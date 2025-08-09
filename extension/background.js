// Background script for the extension (Firefox compatible)
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Function to get session cookie from background (has cookies permission)
async function getSessionCookie() {
  try {
    // Try different URL variations
    const urls = [
      'https://dashboard.42paris.fr',
      'https://dashboard.42paris.fr/',
      'https://dashboard.42paris.fr/attendance'
    ];
    
    for (const url of urls) {
      const cookie = await browserAPI.cookies.get({
        url: url,
        name: 'session'
      });
      if (cookie && cookie.value) {
        return cookie.value;
      }
    }
    
    // Get all cookies to debug
    const allCookies = await browserAPI.cookies.getAll({
      url: 'https://dashboard.42paris.fr'
    });
    
    // Look for session cookie in all cookies
    const sessionCookie = allCookies.find(cookie => cookie.name === 'session');
    if (sessionCookie) {
      return sessionCookie.value;
    }
    
  } catch (error) {
    console.error('Background: Error getting cookies:', error);
  }
  
  return null;
}

// Handle messages from content scripts or popup
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSessionCookie') {
    getSessionCookie().then(sessionCookie => {
      sendResponse({ sessionCookie });
    }).catch(error => {
      sendResponse({ sessionCookie: null, error: error.message });
    });
    return true; // Indicates we will send a response asynchronously
  }
  return true;
});