const GEMINI_MODEL = "gemini-2.5-pro-exp-03-25";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const DEFAULT_PROMPT = "Answer the question upto 4 decimal places accurately. Just give the final answers. If you are rounding of something like square roots give the answers in the form of sqrt(x) or x^y. Do not give any explanation or any other text.";

// --- Helper Functions ---

// Function to get API key from storage
async function getApiKey() {
  const result = await chrome.storage.sync.get("geminiApiKey");
  return result.geminiApiKey;
}

// Function to call Gemini API
async function callGeminiApi(apiKey, base64ImageData, prompt) {
  if (!apiKey) {
    console.error("Gemini API Key not found.");
    throw new Error("API Key missing. Please set it in the extension options.");
  }

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: "image/png",
              data: base64ImageData,
            },
          },
        ],
      },
    ],
    // Optional: Add generationConfig if needed (e.g., temperature, maxOutputTokens)
    // generationConfig: {
    //   temperature: 0.4,
    //   topK: 32,
    //   topP: 1,
    //   maxOutputTokens: 4096,
    //   stopSequences: [],
    // },
    // Optional: Add safetySettings if needed
    // safetySettings: [
    //   { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    //   // ... other categories
    // ]
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error:", errorData);
      throw new Error(`API Error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();

    // Extract text - Adjust based on the actual API response structure
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
       return data.candidates[0].content.parts[0].text;
    } else {
       console.error("Unexpected Gemini API response structure:", data);
       throw new Error("Could not parse text from Gemini response.");
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error; // Re-throw to be caught by the command listener
  }
}

// Function to send message to content script
function displayResultInTab(tabId, text) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: showGeminiResult, // Function defined in content.js
    args: [text] // Pass the result text as an argument
  }).catch(err => console.error("Error injecting script or calling function:", err));
}

// Function to display error in content script
function displayErrorInTab(tabId, errorMessage) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: showGeminiError, // Function defined in content.js
        args: [errorMessage]
    }).catch(err => console.error("Error injecting error script:", err));
}

// Listen for the command (keyboard shortcut)
chrome.commands.onCommand.addListener(async (command, tab) => {
    console.log(`Command received: ${command}`);
    if (command === "take_screenshot" && tab?.id) {
      const apiKey = await getApiKey();
      if (!apiKey) {
        console.error("API Key not set.");
        displayErrorInTab(tab.id, "Error: Gemini API Key not set. Please configure it in the extension options.");
        // Optionally open the options page
        // chrome.runtime.openOptionsPage();
        return;
      }
  
      try {
        // 1. Take Screenshot
        const screenshotDataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
        const base64ImageData = screenshotDataUrl.split(',')[1]; // Remove the "data:image/png;base64," prefix
  
        // Optional: Show a temporary "Processing..." message
        displayResultInTab(tab.id, "Processing screenshot with Gemini...");
  
        // 2. Call Gemini API
        const resultText = await callGeminiApi(apiKey, base64ImageData, DEFAULT_PROMPT);
  
        // 3. Display Result
        displayResultInTab(tab.id, resultText);
  
      } catch (error) {
        console.error("Error during screenshot processing:", error);
        displayErrorInTab(tab.id, `Error: ${error.message}`);
      }
    }
  });
  
  // Listen for extension installation or update to guide user
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      console.log("Extension installed. Opening options page to set API Key.");
      chrome.runtime.openOptionsPage();
    }
    // You could add logic for 'update' if needed
  });
  
  // Define functions to be injected into the content script context
  // These need to be defined here because the executeScript call needs the function definition.
  
  // This function will be executed IN THE CONTEXT of the web page (content script)
  function showGeminiResult(text) {
      // Remove any existing overlay first
      const existingOverlay = document.getElementById('gemini-screenshot-result-overlay');
      if (existingOverlay) {
          existingOverlay.remove();
      }
  
      // Create overlay div
      const overlay = document.createElement('div');
      overlay.id = 'gemini-screenshot-result-overlay';
      overlay.textContent = text;
      // Apply basic styling (more in content.css)
      overlay.style.position = 'fixed';
      overlay.style.bottom = '20px';
      overlay.style.right = '20px';
      overlay.style.zIndex = '2147483647'; // Max z-index
      overlay.style.padding = '10px 15px';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      overlay.style.color = 'white';
      overlay.style.borderRadius = '5px';
      overlay.style.fontSize = '14px';
      overlay.style.maxWidth = '300px';
      overlay.style.boxShadow = '0 2px 10px rgba(0,0,0,0.5)';
      overlay.style.opacity = '0'; // Start hidden for fade-in
      overlay.style.transition = 'opacity 0.5s ease-in-out';
  
      document.body.appendChild(overlay);
  
      // Fade in
      setTimeout(() => {
          overlay.style.opacity = '1';
      }, 50); // Short delay to allow rendering
  
      // Fade out and remove after a delay
      setTimeout(() => {
          overlay.style.opacity = '0';
          setTimeout(() => {
              if (overlay.parentNode) {
                  overlay.remove();
              }
          }, 500); // Wait for fade out transition
      }, 5000); // Display for 5 seconds
  }
  
  // This function will also be executed IN THE CONTEXT of the web page
  function showGeminiError(errorMessage) {
      // Remove any existing overlay first
      const existingOverlay = document.getElementById('gemini-screenshot-result-overlay');
      if (existingOverlay) {
          existingOverlay.remove();
      }
  
      // Create overlay div for error
      const overlay = document.createElement('div');
      overlay.id = 'gemini-screenshot-result-overlay'; // Use same ID to replace
      overlay.textContent = errorMessage;
      // Apply error styling
      overlay.style.position = 'fixed';
      overlay.style.bottom = '20px';
      overlay.style.right = '20px';
      overlay.style.zIndex = '2147483647';
      overlay.style.padding = '10px 15px';
      overlay.style.backgroundColor = 'rgba(200, 0, 0, 0.9)'; // Red background for error
      overlay.style.color = 'white';
      overlay.style.borderRadius = '5px';
      overlay.style.fontSize = '14px';
      overlay.style.maxWidth = '350px';
      overlay.style.boxShadow = '0 2px 10px rgba(0,0,0,0.5)';
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.5s ease-in-out';
  
      document.body.appendChild(overlay);
  
       // Fade in
      setTimeout(() => {
          overlay.style.opacity = '1';
      }, 50);
  
      // Fade out and remove after a longer delay for errors
      setTimeout(() => {
          overlay.style.opacity = '0';
          setTimeout(() => {
               if (overlay.parentNode) {
                  overlay.remove();
              }
          }, 500);
      }, 8000); // Display error for 8 seconds
  }