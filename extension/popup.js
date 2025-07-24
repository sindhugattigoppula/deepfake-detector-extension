// Constants
const API_BASE_URL = "http://localhost:8000";

// Initialize UI elements
const elements = {
  image: {
    button: document.getElementById("detectImg"),
    result: document.getElementById("imgRes")
  },
  audio: {
    button: document.getElementById("startAudio"),
    uploadButton: document.getElementById("uploadAudio"),
    input: document.getElementById("audioInput"),
    result: document.getElementById("audioRes")
  },
  video: {
    button: document.getElementById("detectVid"),
    uploadButton: document.getElementById("uploadVid"),
    input: document.getElementById("videoInput"),
    result: document.getElementById("vidRes"),
    uploadResult: document.getElementById("uploadRes")
  }
};

// Initialize event listeners
function init() {
  // Image detection
  elements.image.button.addEventListener("click", detectPageImage);
  
  // Audio detection
  elements.audio.button.addEventListener("click", detectPageAudio);
  elements.audio.uploadButton.addEventListener("click", handleAudioUpload);
  
  // Video detection
  elements.video.button.addEventListener("click", detectPageVideo);
  elements.video.uploadButton.addEventListener("click", handleVideoUpload);
}

// Image detection from page
async function detectPageImage() {
  elements.image.result.textContent = "⏳ Processing...";
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    const imageUrl = await chrome.tabs.sendMessage(tab.id, {action: "getImage"});
    
    if (!imageUrl) {
      elements.image.result.textContent = "❌ No image found";
      return;
    }
    
    const result = await analyzeMedia("image", imageUrl);
    elements.image.result.textContent = `🖼️ Result: ${result.result} (${(result.confidence * 100).toFixed(1)}%)`;
  } catch (error) {
    elements.image.result.textContent = `❌ Error: ${error.message}`;
  }
}

// Audio detection from page
async function detectPageAudio() {
  elements.audio.result.textContent = "⏳ Processing...";
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    const audioUrl = await chrome.tabs.sendMessage(tab.id, {action: "getAudio"});
    
    if (!audioUrl) {
      elements.audio.result.textContent = "❌ No audio found";
      return;
    }
    
    const result = await analyzeMedia("audio", audioUrl);
    elements.audio.result.textContent = `🎵 Result: ${result.result} (${(result.confidence * 100).toFixed(1)}%)`;
  } catch (error) {
    elements.audio.result.textContent = `❌ Error: ${error.message}`;
  }
}

// Video detection from page
async function detectPageVideo() {
  elements.video.result.textContent = "⏳ Processing...";
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    const videoUrl = await chrome.tabs.sendMessage(tab.id, {action: "getVideo"});
    
    if (!videoUrl) {
      elements.video.result.textContent = "❌ No video found";
      return;
    }
    
    const result = await analyzeMedia("video", videoUrl);
    elements.video.result.textContent = `🎥 Result: ${result.result} (${(result.confidence * 100).toFixed(1)}%)`;
  } catch (error) {
    elements.video.result.textContent = `❌ Error: ${error.message}`;
  }
}

// Handle audio upload
async function handleAudioUpload() {
  elements.audio.result.textContent = "⏳ Processing...";
  const file = elements.audio.input.files[0];
  
  if (!file) {
    elements.audio.result.textContent = "❌ No file selected";
    return;
  }
  
  try {
    const base64Data = await fileToBase64(file);
    const result = await analyzeMedia("audio", base64Data);
    elements.audio.result.textContent = `📁 Result: ${result.result} (${(result.confidence * 100).toFixed(1)}%)`;
  } catch (error) {
    elements.audio.result.textContent = `❌ Error: ${error.message}`;
  }
}

// Handle video upload
async function handleVideoUpload() {
  elements.video.uploadResult.textContent = "⏳ Processing...";
  const file = elements.video.input.files[0];
  
  if (!file) {
    elements.video.uploadResult.textContent = "❌ No file selected";
    return;
  }
  
  try {
    const base64Data = await fileToBase64(file);
    const result = await analyzeMedia("video", base64Data);
    elements.video.uploadResult.textContent = `📁 Result: ${result.result} (${(result.confidence * 100).toFixed(1)}%)`;
  } catch (error) {
    elements.video.uploadResult.textContent = `❌ Error: ${error.message}`;
  }
}

// Analyze media through API
async function analyzeMedia(type, urlOrData) {
  let base64Data;
  
  if (urlOrData.startsWith('http')) {
    const response = await fetch(urlOrData);
    if (!response.ok) throw new Error('Failed to fetch media');
    const blob = await response.blob();
    base64Data = await blobToBase64(blob);
  } else {
    base64Data = urlOrData;
  }
  
  // Remove data URL prefix if needed
  const payloadData = type === 'image' ? base64Data : base64Data.split(',')[1];
  
  const apiResponse = await fetch(`${API_BASE_URL}/detect-${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [type]: payloadData })
  });
  
  if (!apiResponse.ok) {
    const error = await apiResponse.json();
    throw new Error(error.error || 'API request failed');
  }
  
  return await apiResponse.json();
}

// Helper functions
async function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

async function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

// Initialize
init();