(function () {
  console.log("rendered");
  if (window.top !== window.self) {
    console.log("Peach content script: skipping iframe");
    return;
  }
  const overlayId = "peach-iframe-overlay";
  let overlay = null;
  let isOverlayVisible = false;
  let peachAIToken;
  let loginID;

  function getTokenFromTab() {
    console.log("test");
    chrome.runtime.sendMessage({ action: "getTokenFromTab" }, (response) => {
      console.log("response", response);
      if (response.tokens) {
        console.log("token");
        console.log("Token received:", response.tokens);
        peachAIToken = response.tokens.peachAIToken;
        loginID = response.tokens.loginID;
        return response.tokens;
      } else {
        console.error("Error:", response);
      }
    });
  }

  function injectSwipeHandler(iframe) {
    const script = document.createElement("script");
    script.textContent = `
      window.addEventListener("message", (event) => {
        if (event.data.action === "swipe") {
          const scrollable = document.querySelector(".scrollable, [style*='overflow-x: auto'], [style*='overflow-x: scroll']") || document.body;
          if (scrollable) {
            const step = 100; // Pixels to scroll per keypress
            scrollable.scrollBy({ left: event.data.direction === "left" ? -step : step, behavior: "smooth" });
          }
        }
      });
    `;
    iframe.contentDocument.head.appendChild(script);
  }

  function createOverlayWithIframe(url) {
    console.log("url", url);
    const overlayId = "my-peach-overlay";
    const existing = document.getElementById(overlayId);
    if (existing) {
      existing.remove();
    } else {
      const floatingWindow = document.createElement("div");
      floatingWindow.id = overlayId;
      floatingWindow.style.position = "fixed";
      const header = document.createElement("div");
      header.className = "window-header";
      header.innerHTML = "Peach Safety";

      // Create close button
      const closeButton = document.createElement("div");
      closeButton.className = "close-button";
      closeButton.innerHTML = "\u00D7";
      closeButton.onclick = () => floatingWindow.remove();

      // Create content area
      const content = document.createElement("div");
      content.className = "window-content";
      const iframeElement = document.createElement("iframe");
      iframeElement.className = "window-iframe";
      iframeElement.src = url;
      iframeElement.allow = "clipboard-write; fullscreen; microphone";
      content.appendChild(iframeElement);

      // Create resize handle
      const resizeHandle = document.createElement("div");
      resizeHandle.className = "resize-handle";

      // Append elements
      header.appendChild(closeButton);
      floatingWindow.appendChild(header);
      floatingWindow.appendChild(content);
      floatingWindow.appendChild(resizeHandle);
      document.body.appendChild(floatingWindow);

      // Inject swipe handler once iframe is loaded
      iframeElement.addEventListener("load", () => {
        try {
          injectSwipeHandler(iframeElement);
        } catch (e) {
          console.error("Failed to inject swipe handler:", e);
        }
      });

      // Make window draggable
      let isDragging = false;
      let currentX;
      let currentY;
      let initialX;
      let initialY;

      // Initial position (top-right corner)
      const windowWidth = parseInt(getComputedStyle(floatingWindow).width) || 400;
      const windowHeight = parseInt(getComputedStyle(floatingWindow).height) || 300;
      currentX = window.innerWidth - windowWidth;
      currentY = 0;
      floatingWindow.style.left = currentX + "px";
      floatingWindow.style.top = currentY + "px";
      floatingWindow.style.right = "";

      // Dragging logic
      header.addEventListener("mousedown", (e) => {
        initialX = e.clientX - currentX;
        initialY = e.clientY - currentY;
        isDragging = true;
      });

      const handleMouseMove = (e) => {
        if (isDragging) {
          e.preventDefault();
          currentX = e.clientX - initialX;
          currentY = e.clientY - initialY;

          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;
          const rect = floatingWindow.getBoundingClientRect();
          const floatingWidth = rect.width;
          const floatingHeight = rect.height;

          currentX = Math.max(0, Math.min(currentX, windowWidth - floatingWidth));
          currentY = Math.max(0, Math.min(currentY, windowHeight - floatingHeight));

          floatingWindow.style.left = currentX + "px";
          floatingWindow.style.top = currentY + "px";
        }
        if (isResizing) {
          const rect = floatingWindow.getBoundingClientRect();
          let width = rect.width + (e.clientX - lastDownX);
          let height = rect.height + (e.clientY - lastDownY);

          width = Math.max(200, Math.min(width, window.innerWidth - rect.left));
          height = Math.max(150, Math.min(height, window.innerHeight - rect.top));

          floatingWindow.style.width = width + "px";
          floatingWindow.style.height = height + "px";
          lastDownX = e.clientX;
          lastDownY = e.clientY;
        }
      };

      const handleMouseUp = () => {
        isDragging = false;
        isResizing = false;
        if (mouseCaptureOverlay && mouseCaptureOverlay.parentNode) {
          mouseCaptureOverlay.parentNode.removeChild(mouseCaptureOverlay);
        }
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      // Make window resizable
      let isResizing = false;
      let lastDownX;
      let lastDownY;
      let mouseCaptureOverlay = null;

      resizeHandle.addEventListener("mousedown", (e) => {
        lastDownX = e.clientX;
        lastDownY = e.clientY;
        isResizing = true;

        mouseCaptureOverlay = document.createElement("div");
        mouseCaptureOverlay.style.position = "absolute";
        mouseCaptureOverlay.style.top = "0";
        mouseCaptureOverlay.style.left = "0";
        mouseCaptureOverlay.style.width = "100%";
        mouseCaptureOverlay.style.height = "100%";
        mouseCaptureOverlay.style.zIndex = "9999";
        mouseCaptureOverlay.style.background = "transparent";
        content.appendChild(mouseCaptureOverlay);
      });

      const originalRemove = floatingWindow.remove;
      floatingWindow.remove = function () {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        if (mouseCaptureOverlay && mouseCaptureOverlay.parentNode) {
          mouseCaptureOverlay.parentNode.removeChild(mouseCaptureOverlay);
        }
        originalRemove.call(floatingWindow);
      };

      isOverlayVisible = true;
    }
  }

  function removeOverlay() {
    console.log("removeOverlay called");
    const existingOverlay = document.getElementById(overlayId);
    if (existingOverlay) {
      existingOverlay.style.transform = "translateX(100%)";
      isOverlayVisible = false;
      setTimeout(() => {
        if (existingOverlay && existingOverlay.parentNode) {
          existingOverlay.parentNode.removeChild(existingOverlay);
          overlay = null;
        }
      }, 300);
    }
  }

  function toggleOverlay() {
    console.log("toggleOverlay called - isOverlayVisible:", isOverlayVisible, peachAIToken, loginID);
    const existingOverlay = document.getElementById(overlayId);
    if (existingOverlay && isOverlayVisible) {
      removeOverlay();
    } else if (!existingOverlay && !isOverlayVisible) {
      if (peachAIToken && loginID) {
        createOverlayWithIframe(
          "http://localhost:5173/callback/?eula_status=True&access_token=" + peachAIToken + "&login_id=" + loginID
        );
      } else {
        createOverlayWithIframe("http://localhost:5173/");
      }
    }
    isOverlayVisible = document.getElementById(overlayId) !== null;
    console.log("toggleOverlay finished - isOverlayVisible:", isOverlayVisible);
  }

  // Listen for the keydown event at the window level
  window.addEventListener("keydown", (e) => {
    if (e.altKey && e.key.toLowerCase() === "p") {
      e.preventDefault();
      toggleOverlay();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const overlay = document.getElementById("my-peach-overlay");
      if (overlay && isOverlayVisible) {
        e.preventDefault();
        const iframe = overlay.querySelector("iframe");
        if (iframe && iframe.contentWindow) {
          try {
            iframe.contentWindow.postMessage(
              { action: "swipe", direction: e.key === "ArrowLeft" ? "left" : "right" },
              "*"
            );
          } catch (e) {
            console.error("Failed to send swipe message to iframe:", e);
          }
        }
      }
    }
  });

  // Listen for toggle command from background script (extension icon click)
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "toggleOverlay") {
      toggleOverlay();
    }
  });

  getTokenFromTab();
})();
