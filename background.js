chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed.");
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url.startsWith("chrome://")) {
    try {
      chrome.tabs.sendMessage(tab.id, { action: "toggleOverlay" });
    } catch (error) {
      console.error("Error in background script:", error);
    }
  } else {
    console.warn("Ignoring click on chrome:// URL.");
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTokenFromTab") {
    // Query for tabs with peachsafety.com
    chrome.tabs.query({ url: "http://localhost:5173/*" }, (tabs) => {
      if (tabs.length === 0) {
        console.error("No peachsafety.com tabs found");
        sendResponse({ error: "No peachsafety.com tabs found" });
        return;
      }

      // Inject script into the first matching tab
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: () => {
            const peachAIToken = localStorage.getItem("peachAIToken");
            const loginID = localStorage.getItem("loginID");
            return { peachAIToken, loginID };
          },
        },
        (results) => {
          if (chrome.runtime.lastError) {
            console.error("Script injection error:", chrome.runtime.lastError);
            sendResponse({ error: chrome.runtime.lastError.message });
            return;
          }

          const tokens = results[0].result;
          if (tokens.peachAIToken && tokens.loginID) {
            // Store tokens in chrome.storage.local
            chrome.storage.local.set({ peachAIToken: tokens.peachAIToken, loginID: tokens.loginID }, () => {
              console.log("Tokens stored in chrome.storage.local from background");
              sendResponse({ tokens });
            });
          } else {
            sendResponse({ error: "Tokens not found in tab" });
          }
        }
      );
    });
    return true; // Keep message channel open for async response
  }
});
