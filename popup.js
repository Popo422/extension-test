document.getElementById('clickMe').addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const existing = document.getElementById('my-peach-overlay');
      if (existing) {
        existing.remove();
      } else {
        const overlay = document.createElement('div');
        overlay.id = 'my-peach-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
        overlay.style.zIndex = 999999;
        overlay.style.pointerEvents = 'none';
        document.body.appendChild(overlay);
      }
    }
  });
});
