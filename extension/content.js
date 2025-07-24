// Get image from page
function getImage() {
  const img = document.querySelector('img');
  if (!img) return null;
  
  // Create canvas to get image data
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  return canvas.toDataURL('image/jpeg');
}

// Get audio from page
function getAudio() {
  const audio = document.querySelector('audio');
  return audio?.src || audio?.querySelector('source')?.src;
}

// Get video from page
function getVideo() {
  const video = document.querySelector('video');
  return video?.src || video?.querySelector('source')?.src;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  let result = null;
  
  switch(request.action) {
    case 'getImage':
      result = getImage();
      break;
    case 'getAudio':
      result = getAudio();
      break;
    case 'getVideo':
      result = getVideo();
      break;
  }
  
  sendResponse(result);
});