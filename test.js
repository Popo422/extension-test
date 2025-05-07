(function () {
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
    // Function to create the overlay with iframe
    // function createOverlayWithIframe(url) {
    //   console.log("url", url);
    // const overlayId = "my-peach-overlay";
    //   const existing = document.getElementById(overlayId);
    //   if (existing) {
    //     existing.remove();
    //   } else {
    //     const floatingWindow = document.createElement("div");
    //     floatingWindow.id = overlayId;
    //     floatingWindow.style.position = "fixed";
    //     const header = document.createElement("div");
    //     header.className = "window-header";
    //     header.innerHTML = "Peach Safety";
  
    //     // Create close button
    //     const closeButton = document.createElement("div");
    //     closeButton.className = "close-button";
    //     closeButton.innerHTML = "\u00D7";
    //     closeButton.onclick = () => floatingWindow.remove();
  
    //     // Create content area
    //     const content = document.createElement("div");
    //     content.className = "window-content";
    //     const iframeElement = document.createElement("iframe");
    //     iframeElement.className = "window-iframe";
    //     // Modify iframe src to include tokens as query parameters (optional)
    //     // Alternatively, use postMessage (see below)
    //     iframeElement.src = url;
    //     iframeElement.allow = "clipboard-write; fullscreen";
    //     content.appendChild(iframeElement);
  
    //     // Create resize handle
    //     const resizeHandle = document.createElement("div");
    //     resizeHandle.className = "resize-handle";
  
    //     // Append elements
    //     header.appendChild(closeButton);
    //     floatingWindow.appendChild(header);
    //     floatingWindow.appendChild(content);
    //     floatingWindow.appendChild(resizeHandle);
    //     document.body.appendChild(floatingWindow);
  
    //     // Make window draggable
    //     let isDragging = false;
    //     let currentX;
    //     let currentY;
    //     let initialX;
    //     let initialY;
  
    //     header.addEventListener("mousedown", (e) => {
    //       initialX = e.clientX - currentX;
    //       initialY = e.clientY - currentY;
    //       isDragging = true;
    //     });
  
    //     document.addEventListener("mousemove", (e) => {
    //       if (isDragging) {
    //         e.preventDefault();
    //         currentX = e.clientX - initialX;
    //         currentY = e.clientY - initialY;
    //         floatingWindow.style.left = currentX + "px";
    //         floatingWindow.style.top = currentY + "px";
    //       }
    //     });
  
    //     document.addEventListener("mouseup", () => {
    //       isDragging = false;
    //     });
  
    //     // Make window resizable
    //     let isResizing = false;
    //     let lastDownX;
    //     let lastDownY;
  
    //     resizeHandle.addEventListener("mousedown", (e) => {
    //       lastDownX = e.clientX;
    //       lastDownY = e.clientY;
    //       isResizing = true;
    //     });
  
    //     document.addEventListener("mousemove", (e) => {
    //       if (isResizing) {
    //         const width = parseInt(getComputedStyle(floatingWindow).width) + (e.clientX - lastDownX);
    //         const height = parseInt(getComputedStyle(floatingWindow).height) + (e.clientY - lastDownY);
    //         floatingWindow.style.width = Math.max(200, width) + "px";
    //         floatingWindow.style.height = Math.max(150, height) + "px";
    //         lastDownX = e.clientX;
    //         lastDownY = e.clientY;
    //       }
    //     });
  
    //     document.addEventListener("mouseup", () => {
    //       isResizing = false;
    //     });
  
    //     // Initial position
    //     const windowWidth = parseInt(getComputedStyle(floatingWindow).width);
    //     const windowHeight = parseInt(getComputedStyle(floatingWindow).height);
    //     currentX = (window.innerWidth - windowWidth) / 2;
    //     currentY = (window.innerHeight - windowHeight) / 2;
    //     floatingWindow.style.left = currentX + "px";
    //     floatingWindow.style.top = currentY + "px";
  
    //     isOverlayVisible = true;
    //   }
    // }
  
    function createOverlayWithIframe(url) {
      console.log("url", url);
      const overlay = document.createElement("div");
      overlay.id = "peach-iframe-overlay";
      overlay.style.position = "fixed";
      overlay.style.top = 0;
      overlay.style.right = 0;
      overlay.style.width = "50vw"; // right half
      overlay.style.height = "100vh";
      overlay.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
      overlay.style.zIndex = 999999;
      overlay.style.display = "flex";
      overlay.style.justifyContent = "center";
      overlay.style.alignItems = "flex-start";
      overlay.style.backdropFilter = "blur(4px)";
      overlay.style.boxShadow = "0 0 12px rgba(0,0,0,0.6)";
  
      const frameWrapper = document.createElement("div");
      frameWrapper.style.borderRadius = "0";
      frameWrapper.style.overflow = "hidden";
      frameWrapper.style.position = "relative";
      frameWrapper.style.width = "100%";
      frameWrapper.style.height = "100%";
  
      const iframe = document.createElement("iframe");
      iframe.src = url;
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "none";
      iframe.style.backgroundColor = "transparent";
  
      // 👇 This line is the fix:
      iframe.allow = "clipboard-write; fullscreen";
  
      const closeBtn = document.createElement("div");
      closeBtn.textContent = "×";
      closeBtn.style.position = "absolute";
      closeBtn.style.top = "12px";
      closeBtn.style.right = "16px";
      closeBtn.style.fontSize = "24px";
      closeBtn.style.color = "#fff";
      closeBtn.style.cursor = "pointer";
      closeBtn.style.zIndex = 1000000;
      closeBtn.style.fontWeight = "bold";
  
      closeBtn.addEventListener("click", () => {
        removeOverlay();
      });
  
      frameWrapper.appendChild(closeBtn);
      frameWrapper.appendChild(iframe);
      overlay.appendChild(frameWrapper);
      document.body.appendChild(overlay);
    }
    function removeOverlay() {
      console.log("removeOverlay called");
      const existingOverlay = document.getElementById(overlayId);
      if (existingOverlay) {
        existingOverlay.remove();
        isOverlayVisible = false;
        overlay = null;
      }
    }
  
    function toggleOverlay() {
      console.log("toggleOverlay called - isOverlayVisible:", isOverlayVisible);
      const existingOverlay = document.getElementById(overlayId);
      if (existingOverlay && isOverlayVisible) {
        removeOverlay();
      } else if (!existingOverlay && !isOverlayVisible) {
        console.log("createOverlayWithIframe called" , peachAIToken, loginID);
        if (peachAIToken && loginID) {
          createOverlayWithIframe(
            "http://localhost:5173/callback/?eula_status=True&access_token=" + peachAIToken + "&login_id=" + loginID
          );
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
  