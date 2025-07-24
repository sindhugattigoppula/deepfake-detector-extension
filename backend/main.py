from fastapi import FastAPI
from pydantic import BaseModel
import base64
from io import BytesIO
from PIL import Image
import numpy as np
import librosa
import tensorflow as tf
from keras.applications.efficientnet_v2 import preprocess_input
import soundfile as sf
from fastapi.middleware.cors import CORSMiddleware
import cv2
import tempfile
import os

app = FastAPI()

# Load models
audio_model = tf.keras.models.load_model("audio_deepfake_model.keras")
image_model = tf.keras.models.load_model("efficient_final_model_finetuned_v3_90percent_cleaned.keras")
video_model = tf.keras.models.load_model("video_phase2_final.keras")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class ImageRequest(BaseModel):
    image: str  

class AudioRequest(BaseModel):
    audio: str

class VideoRequest(BaseModel):
    video: str  

# Image detection endpoint
@app.post("/detect-image")
async def detect_image(request: ImageRequest):
    try:
        # Handle data URL if present
        image_data = request.image.split(",")[1] if "," in request.image else request.image
        image_bytes = base64.b64decode(image_data)
        
        # Process image
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        image = image.resize((224, 224))
        image = np.array(image)
        image = preprocess_input(image)
        image = np.expand_dims(image, axis=0)

        # Make prediction
        prediction = image_model.predict(image)[0][0]
        confidence = float(prediction) if prediction > 0.5 else float(1 - prediction)
        label = "Real" if prediction > 0.5 else "Fake"
        
        return {
            "result": label,
            "confidence": confidence,
            "error": None
        }
    except Exception as e:
        return {
            "result": "Error",
            "confidence": 0.0,
            "error": str(e)
        }

# Audio feature extraction - Updated version
def extract_features_from_bytes(audio_bytes):
    try:
        # Write to temp file with explicit path handling
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        
        try:
            # Use updated librosa API with proper error handling
            y, sr = librosa.load(tmp_path, sr=None)
            
            # Calculate duration properly
            duration = len(y) / sr if sr else 0
            if duration < 0.5:
                raise ValueError("Audio too short (minimum 0.5 seconds required)")
            
            # Extract features with better error handling
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)  # Increased to 40 MFCCs
            chroma = librosa.feature.chroma_stft(y=y, sr=sr)
            contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
            mel = librosa.feature.melspectrogram(y=y, sr=sr)
            
            # More robust feature aggregation
            features = np.hstack([
                np.mean(mfccs, axis=1),
                np.mean(chroma, axis=1),
                np.mean(contrast, axis=1),
                np.mean(mel, axis=1)
            ])
            
            return features
        finally:
            # Ensure temp file is always cleaned up
            try:
                os.unlink(tmp_path)
            except:
                pass
    except Exception as e:
        raise ValueError(f"Audio processing failed: {str(e)}")

# Audio detection endpoint - Updated version
@app.post("/detect-audio")
async def detect_audio(request: AudioRequest):
    try:
        # 1. Decode audio
        audio_data = request.audio.split(",")[1] if "," in request.audio else request.audio
        audio_bytes = base64.b64decode(audio_data)
        
        # 2. Create temp file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        
        try:
            # 3. Enhanced feature extraction specifically for AI voice detection
            y, sr = librosa.load(tmp_path, sr=22050)  # Standardize sample rate
            
            # Add additional features that help detect AI voices
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)  # Increased to 20
            chroma = librosa.feature.chroma_stft(y=y, sr=sr)
            contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
            tonnetz = librosa.feature.tonnetz(y=y, sr=sr)
            spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)
            
            features = np.hstack([
                np.mean(mfccs, axis=1),
                np.mean(chroma, axis=1),
                np.mean(contrast, axis=1),
                np.mean(tonnetz, axis=1),
                np.mean(spectral_bandwidth, axis=1),
                np.array([librosa.feature.zero_crossing_rate(y).mean()])
            ]).reshape(1, -1)
            
            # 4. Adjusted prediction with bias compensation
            prediction = audio_model.predict(features, verbose=1)[0]
            
            # Apply threshold adjustment (0.7 favors more "Fake" classifications)
            adjusted_threshold = 0.7
            confidence = float(max(prediction))
            label = "Fake" if prediction[1] >= adjusted_threshold else "Real"
            
            # Debug info
            print(f"Raw predictions: {prediction}")
            print(f"Using threshold: {adjusted_threshold}")
            
            return {
                "result": label,
                "confidence": confidence,
                "error": None
            }
            
        finally:
            try:
                os.unlink(tmp_path)
            except:
                pass
                
    except Exception as e:
        return {
            "result": "Error",
            "confidence": 0.0,
            "error": str(e)
        }

# Video detection endpoint - Updated version
@app.post("/detect-video")
async def detect_video(request: VideoRequest):
    try:
        # Decode video with validation
        try:
            video_bytes = base64.b64decode(request.video)
        except:
            raise ValueError("Invalid base64 video data")
        
        # Use non-deleted temp file for OpenCV compatibility
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as temp_file:
            temp_file.write(video_bytes)
            temp_path = temp_file.name
        
        try:
            # Open video with proper resource handling
            cap = cv2.VideoCapture(temp_path)
            if not cap.isOpened():
                raise ValueError("Could not open video file")
                
            # Get video properties with validation
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            
            if total_frames < 10:
                raise ValueError("Video too short (minimum 10 frames required)")
            if fps <= 0:
                fps = 30  # Default assumption if fps not available
            
            # Process frames with better sampling
            predictions = []
            frame_count = 0
            max_frames = min(30, total_frames)
            frame_interval = max(1, int(total_frames / max_frames))
            
            for i in range(0, total_frames, frame_interval):
                cap.set(cv2.CAP_PROP_POS_FRAMES, i)
                ret, frame = cap.read()
                
                if not ret or frame is None:
                    continue
                    
                # Process frame with validation
                try:
                    frame = cv2.resize(frame, (224, 224))
                    frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    frame = frame / 255.0
                    frame = np.expand_dims(frame, axis=0)
                    
                    pred = video_model.predict(frame, verbose=0)[0]
                    predictions.append(pred)
                    frame_count += 1
                    
                    if frame_count >= max_frames:
                        break
                except Exception as e:
                    continue

            if not predictions:
                raise ValueError("No valid frames extracted")
                
            # Calculate results with validation
            avg_pred = np.mean(predictions, axis=0)
            if len(avg_pred) < 2:
                raise ValueError("Invalid prediction format")
                
            confidence = float(max(avg_pred))
            label = "Fake" if avg_pred[0] > avg_pred[1] else "Real"
            
            return {
                "result": label,
                "confidence": confidence,
                "frames_analyzed": len(predictions),
                "error": None
            }
        finally:
            # Release resources and clean up
            if 'cap' in locals() and cap.isOpened():
                cap.release()
            try:
                os.unlink(temp_path)
            except:
                pass
    except Exception as e:
        return {
            "result": "Error",
            "confidence": 0.0,
            "frames_analyzed": 0,
            "error": str(e)
        }