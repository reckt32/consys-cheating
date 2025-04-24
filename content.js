// content.js
// This script runs in the context of the web page itself (isolated world).

// console.log("Gemini Screenshot Helper content script loaded and running.");

// --- Primary Role ---
// The main purpose of this script in the current setup is to *be the target*
// for `chrome.scripting.executeScript` calls from the background script (`background.js`).
// The functions `showGeminiResult` and `showGeminiError` (defined in background.js)
// are injected and executed directly within this content script's context when called
// by the background script.

// --- Why no message listener? ---
// You *could* implement a message listener here using `chrome.runtime.onMessage.addListener`
// if the background script were sending messages using `chrome.tabs.sendMessage`.
// However, the current approach using `chrome.scripting.executeScript` with the `func`
// parameter is often simpler for cases where the background script just needs to
// execute a specific function within the content script's context, especially
// when passing arguments like the result text or error message.

// --- Potential Future Uses ---
// If the extension needed more complex interaction with the web page, such as:
//   - Reading specific content from the DOM.
//   - Modifying the DOM in more intricate ways.
//   - Listening for user interactions on the page itself (e.g., clicks, selections).
// Then, you would add more logic and potentially message listeners to this file.

// For now, its existence fulfills the requirement specified in the manifest.json
// and allows the background script to inject and run the necessary display functions.
