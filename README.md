# 🧠 DeepFake Media Detector (via Chrome Extension + AI Backend)

> 🔍 A Chrome Extension integrated with AI backend to detect deepfakes in **images**, **videos**, and **audio**—ensuring digital content authenticity.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Gattigoppula--Sindhu-blue?logo=linkedin)](https://www.linkedin.com/in/gattigoppula-sindhu)
[![HuggingFace Models](https://img.shields.io/badge/Models-HuggingFace-blue?logo=huggingface)](https://huggingface.co/SindhuGattigoppula)
---

## 📌 Problem Statement

With the rise of manipulated media, **DeepFakes** have become a major threat—spreading misinformation through fake celebrity videos, morphed audios, and altered images. This project aims to **detect deepfake content directly from the browser** using deep learning models and a seamless frontend extension.

---

## 🚀 Features

- 🌐 **Chrome Extension UI**  
  Detect fake media directly while browsing any webpage.

- 🤖 **AI-Powered Backend (FastAPI)**  
  Runs deepfake classification on media content using finetuned models.

- 📸 **Media Support**  
  - ✅ Image DeepFake Detection  
  - ✅ Video DeepFake Detection  
  - ✅ Audio DeepFake Detection

- 📦 Hugging Face Model Integration  
  (Models are hosted separately for efficiency)

- 🎯 Accuracy Achieved  
  - **Video Model**: 94% validation accuracy  
  - Others: High performance using transfer learning

---

## 🧪 Tech Stack

| Area        | Technology                  |
|-------------|------------------------------|
| Backend     | Python, FastAPI              |
| Models      | TensorFlow, Keras, EfficientNet, OpenCV |
| Frontend    | HTML, CSS, JavaScript        |
| Extension   | Chrome Extension API         |
| Deployment  | HuggingFace, GitHub          |

---

## 📁 Project Structure

deepfake/
├── backend/
│ ├── main.py # FastAPI backend to process media
│ ├── requirements.txt # Backend dependencies
├── extension/
│ ├── manifest.json # Chrome extension manifest
│ ├── popup.html # Extension popup interface
│ ├── popup.js # Extension logic
│ ├── styles.css # Styling
├── .gitignore
├── README.md

---

## 🧠 How It Works

1. **User browses content** in Chrome and clicks "Detect" on the extension.
2. Extension grabs media and sends it to the **FastAPI backend**.
3. Backend detects the media type (image/video/audio).
4. Uses **finetuned AI models** to classify content as Real or Fake.
5. Returns result back to Chrome with confidence scores.

---

## ⚙️ Setup Instructions

### 🐍 1. Clone and Setup Backend

```bash
git clone https://github.com/yourusername/deepfake.git
cd deepfake/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # (Linux/Mac)
venv\Scripts\activate     # (Windows)

# Install dependencies
pip install -r requirements.txt
▶️ 2. Run FastAPI Server
uvicorn main:app --reload

Make sure your HuggingFace token is set up and models are accessible inside main.py

🌐 3. Load Chrome Extension
Open Chrome → chrome://extensions

Enable Developer Mode

Click Load Unpacked

Select the deepfake/extension/ folder

Now click the extension icon and start detecting!

📦 Deployment
Due to model size (~4GB), models are stored and integrated via Hugging Face repo (public).

If needed, deploy FastAPI backend on platforms like:

Render

Railway

EC2 (for GPU support)

🧪 Sample Detection Screens
✅ Real News Video → Marked Authentic

❌ Morphed Celebrity Clip → Marked DeepFake

Media detection preview clips available in the repo

🤝 Credits
Built by: Sindhu Gattigoppula

Deep Learning Models: HuggingFace repo

Thanks to TensorFlow, Keras, FastAPI, OpenCV & Chrome API Docs

📜 License
MIT License – Free to use with attribution
