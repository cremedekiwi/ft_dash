const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Function to automatically fill and submit the session cookie
function autoFillSessionCookie(sessionCookie) {
  // Wait a bit for the page to load
  setTimeout(() => {
    // Find the session input field
    const sessionInput = document.querySelector('input[id="session"]') || 
                        document.querySelector('input[type="text"]') ||
                        document.querySelector('input[placeholder*="session"]') ||
                        document.querySelector('input[placeholder*="535510n_c00k13"]');
    
    if (sessionInput) {
      // Fill the input
      sessionInput.value = sessionCookie;
      
      // Trigger change events
      sessionInput.dispatchEvent(new Event('input', { bubbles: true }));
      sessionInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Try to find and click the login button
      setTimeout(() => {
        const loginButton = document.querySelector('button[type="submit"]') ||
                           document.querySelector('button:contains("Login")') ||
                           document.querySelector('button:contains("Authentica")') ||
                           document.querySelector('form button');
        
        if (loginButton) {
          loginButton.click();
        } else {
          // Add a visual indicator
          sessionInput.style.border = '2px solid #4CAF50';
          sessionInput.style.boxShadow = '0 0 5px rgba(76, 175, 80, 0.5)';
        }
      }, 500);
      
    } 
  }, 1000);
}

// Listen for messages from the 42 dashboard content script
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'autoFillSession' && request.sessionCookie) {
    autoFillSessionCookie(request.sessionCookie);
    sendResponse({ success: true });
  }
});

// Check if we're on the login page and there's a pending session cookie
if (window.location.pathname === '/login' || document.querySelector('input[id="session"]')) {
  // Check if there's a stored session cookie from the extension
  browserAPI.storage.local.get(['pendingSessionCookie'], (result) => {
    if (result.pendingSessionCookie) {
      autoFillSessionCookie(result.pendingSessionCookie);
      
      // Clear the stored cookie
      browserAPI.storage.local.remove(['pendingSessionCookie']);
    }
  });
}