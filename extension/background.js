// Initialize context menus
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "detect-image",
      title: "🔍 Detect Image Deepfake",
      contexts: ["image"]
    });

    chrome.contextMenus.create({
      id: "detect-audio",
      title: "🔍 Detect Audio Deepfake",
      contexts: ["audio"]
    });

    chrome.contextMenus.create({
      id: "detect-video",
      title: "🔍 Detect Video Deepfake",
      contexts: ["video"]
    });
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!info.srcUrl) {
    showNotification('Error', 'No media source available');
    return;
  }

  try {
    showNotification('Processing', 'Analyzing media for deepfake...');

    const endpointMap = {
      "detect-image": "/detect-image",
      "detect-audio": "/detect-audio",
      "detect-video": "/detect-video"
    };

    const endpoint = endpointMap[info.menuItemId];
    if (!endpoint) return;

    // Fetch and process media
    const response = await fetch(info.srcUrl);
    if (!response.ok) throw new Error('Failed to fetch media');
    
    const blob = await response.blob();
    const base64Data = await blobToBase64(blob);
    const payloadData = info.menuItemId === "detect-image" ? base64Data : base64Data.split(',')[1];

    // Send to detection API
    const apiResponse = await fetch(`http://localhost:8000${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [info.menuItemId.split('-')[1]]: payloadData })
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(errorData.error || 'API request failed');
    }

    const result = await apiResponse.json();
    showNotification('Result', `This content is: ${result.result} (${(result.confidence * 100).toFixed(1)}%)`);

  } catch (error) {
    console.error('Detection failed:', error);
    showNotification('Error', error.message || 'Detection failed');
  }
});

// Helper functions
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: title,
    message: message,
    priority: 2
  });
}