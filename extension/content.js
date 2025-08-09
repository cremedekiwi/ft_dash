// Function to get the session cookie via background script
async function getSessionCookie() {
  return new Promise((resolve) => {
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
    browserAPI.runtime.sendMessage({ action: 'getSessionCookie' }, (response) => {
      if (response && response.sessionCookie) {
        resolve(response.sessionCookie);
      } else {
        resolve(null);
      }
    });
  });
}

// Function to send session to your dashboard
async function sendSessionToCustomDashboard(sessionCookie) {
  try {
    const dashboardUrl = 'http://localhost:3000'; // Change this to your deployed URL
    
    // First, try to send the session cookie
    const response = await fetch(`${dashboardUrl}/api/extension-login`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionCookie: sessionCookie
      })
    });

    if (response.ok) {
      // Open your dashboard in a new tab - go directly to home since API login worked
      window.open(`${dashboardUrl}`, '_blank');
      return true;
    } else {
      console.error('Failed to send session, status:', response.status);
      // Store session for auto-fill and open login page with URL parameter
      const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
      browserAPI.storage.local.set({ pendingSessionCookie: sessionCookie }, () => {
        window.open(`${dashboardUrl}/login#session=${encodeURIComponent(sessionCookie)}`, '_blank');
      });
      return false;
    }
  } catch (error) {
    console.error('Network error, opening dashboard anyway:', error);
    
    // Store session cookie for auto-fill and open dashboard with URL parameter
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
    browserAPI.storage.local.set({ pendingSessionCookie: sessionCookie }, () => {
      const dashboardUrl = 'http://localhost:3000';
      // Pass session in URL hash for immediate access
      window.open(`${dashboardUrl}/login#session=${encodeURIComponent(sessionCookie)}`, '_blank');
    });
    
    // Also copy session to clipboard as backup
    try {
      await navigator.clipboard.writeText(sessionCookie);
    } catch (clipError) {
      console.log('Could not copy to clipboard:', clipError);
    }
    
    return false;
  }
}

// Listen for messages from popup (Firefox compatible)
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sendToCustomDashboard') {
    getSessionCookie().then(sessionCookie => {
      if (sessionCookie) {
        sendSessionToCustomDashboard(sessionCookie).then(success => {
          sendResponse({ success });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      } else {
        sendResponse({ success: false, error: 'No session cookie found' });
      }
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Indicates we will send a response asynchronously
  }
});

// Auto-inject a button if user is on the attendance page
if (window.location.pathname === '/attendance') {
  // Create a floating button
  const floatingButton = document.createElement('div');
  floatingButton.innerHTML = `
    <button id="ft-dashboard-btn" style="
      position: fixed;
      top: 7px;
      right: 7px;
      z-index: 9999;
      background: white;
      color: black;
      border: none;
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
Open ft_dashboard
    </button>
  `;
  
  document.body.appendChild(floatingButton);
  
  // Add hover effect
  const btn = document.getElementById('ft-dashboard-btn');
  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'translateY(-2px)';
    btn.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
  });
  
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translateY(0)';
    btn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
  });
  
  // Add click handler
  btn.addEventListener('click', () => {
    getSessionCookie().then(sessionCookie => {
      if (sessionCookie) {
        btn.innerHTML = 'Opening...';
        btn.disabled = true;
        sendSessionToCustomDashboard(sessionCookie).then(success => {
          if (success) {
            btn.innerHTML = 'Opened!';
            setTimeout(() => {
              btn.innerHTML = 'Open ft_dashboard';
              btn.disabled = false;
            }, 2000);
          } else {
            btn.innerHTML = 'Failed';
            setTimeout(() => {
              btn.innerHTML = 'Open ft_dashboard';
              btn.disabled = false;
            }, 2000);
          }
        });
      } else {
        alert('No session cookie found. Please make sure you are logged in to the 42 dashboard.');
      }
    }).catch(error => {
      console.error('Error getting session cookie:', error);
      alert('Error getting session cookie. Please check console for details.');
    });
  });
}