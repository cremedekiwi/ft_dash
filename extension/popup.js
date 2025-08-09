// Popup script (Firefox compatible)
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const sessionInfoEl = document.getElementById('sessionInfo');
  const sessionValueEl = document.getElementById('sessionValue');
  const openDashboardBtn = document.getElementById('openDashboard');
  const copySessionBtn = document.getElementById('copySession');
  const openTextEl = document.getElementById('openText');

  let currentSessionCookie = null;

  // Check if we're on the 42 dashboard
  try {
    const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('dashboard.42paris.fr')) {
      statusEl.textContent = 'Please visit dashboard.42paris.fr first';
      statusEl.className = 'status error';
      return;
    }

    // Get session cookie directly from background script
    browserAPI.runtime.sendMessage({ action: 'getSessionCookie' }, (response) => {
      if (browserAPI.runtime.lastError) {
        statusEl.textContent = 'Error: Could not connect to background';
        statusEl.className = 'status error';
        return;
      }

      if (response && response.sessionCookie) {
        currentSessionCookie = response.sessionCookie;
        statusEl.textContent = 'Session cookie found!';
        statusEl.className = 'status success';
        
        // Show session info
        sessionInfoEl.style.display = 'block';
        sessionValueEl.textContent = currentSessionCookie;
        
        // Enable buttons
        openDashboardBtn.disabled = false;
        copySessionBtn.style.display = 'block';
      } else {
        statusEl.textContent = 'No session cookie found';
        statusEl.className = 'status error';
      }
    });

  } catch (error) {
    statusEl.textContent = 'Error accessing tab';
    statusEl.className = 'status error';
  }

  // Open dashboard button
  openDashboardBtn.addEventListener('click', async () => {
    if (!currentSessionCookie) return;

    openDashboardBtn.disabled = true;
    openTextEl.innerHTML = '<span class="loading"></span>Opening...';

    try {
      const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
      
      browserAPI.tabs.sendMessage(tab.id, { action: 'sendToCustomDashboard' }, (response) => {
        if (response && response.success) {
          openTextEl.textContent = 'Opened!';
          setTimeout(() => {
            openTextEl.textContent = 'Open ft_dashboard';
            openDashboardBtn.disabled = false;
          }, 2000);
        } else {
          openTextEl.textContent = 'Failed';
          setTimeout(() => {
            openTextEl.textContent = 'Open ft_dashboard';
            openDashboardBtn.disabled = false;
          }, 2000);
        }
      });
    } catch (error) {
      openTextEl.textContent = 'Error';
      setTimeout(() => {
        openTextEl.textContent = 'Open ft_dashboard';
        openDashboardBtn.disabled = false;
      }, 2000);
    }
  });

  // Copy session button
  copySessionBtn.addEventListener('click', () => {
    if (!currentSessionCookie) return;

    navigator.clipboard.writeText(currentSessionCookie).then(() => {
      const originalText = copySessionBtn.textContent;
      copySessionBtn.textContent = 'Copied!';
      setTimeout(() => {
        copySessionBtn.textContent = originalText;
      }, 2000);
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = currentSessionCookie;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      const originalText = copySessionBtn.textContent;
      copySessionBtn.textContent = 'Copied!';
      setTimeout(() => {
        copySessionBtn.textContent = originalText;
      }, 2000);
    });
  });
});