// popup.js
// Handles interactions within the extension's popup window (popup.html),
// including loading and saving the Gemini API key.

// Get references to the DOM elements in popup.html
const apiKeyInput = document.getElementById('apiKey');
const saveButton = document.getElementById('saveKey');
const statusDiv = document.getElementById('status');

// --- Functions ---

// Function to load the saved API key from storage and display it in the input field
function restoreApiKey() {
  // Use chrome.storage.sync.get to retrieve the 'geminiApiKey'
  chrome.storage.sync.get('geminiApiKey', (data) => {
    if (chrome.runtime.lastError) {
        // Handle potential errors during storage access
        console.error("Error retrieving API key:", chrome.runtime.lastError);
        statusDiv.textContent = 'Error loading key.';
        statusDiv.style.color = 'red';
        return;
    }
    // Check if an API key was actually retrieved
    if (data.geminiApiKey) {
      // If found, set the value of the input field
      apiKeyInput.value = data.geminiApiKey;
      // Optionally provide visual feedback that a key is loaded (e.g., change border color)
    } else {
      // If no key is stored, the placeholder text will be visible
      console.log("No API key found in storage.");
    }
  });
}

// Function to save the API key entered by the user to chrome.storage.sync
function saveApiKey() {
  // Get the current value from the API key input field and trim whitespace
  const apiKey = apiKeyInput.value.trim();

  // Basic validation: Ensure the key is not empty
  if (!apiKey) {
      statusDiv.textContent = 'API Key cannot be empty.';
      statusDiv.style.color = 'red'; // Use red color for errors
       // Clear the error message after a few seconds
       setTimeout(() => { statusDiv.textContent = ''; }, 3000);
      return; // Stop the function if the key is empty
  }

  // Use chrome.storage.sync.set to save the key
  chrome.storage.sync.set(
    { geminiApiKey: apiKey }, // Save the key under the name 'geminiApiKey'
    () => {
      // This callback function runs after the save operation completes

      // Check for any runtime errors during saving
      if (chrome.runtime.lastError) {
          console.error("Error saving API key:", chrome.runtime.lastError);
          statusDiv.textContent = `Error saving: ${chrome.runtime.lastError.message}`;
          statusDiv.style.color = 'red';
      } else {
          // Update the status div to confirm successful save
          console.log("API Key saved successfully.");
          statusDiv.textContent = 'API Key saved!';
          statusDiv.style.color = 'green'; // Use green color for success
      }

      // Clear the status message after 3 seconds regardless of success/error
      setTimeout(() => { statusDiv.textContent = ''; }, 3000);
    }
  );
}

// --- Event Listeners ---

// When the popup's HTML content is fully loaded, call restoreApiKey to load any saved key
document.addEventListener('DOMContentLoaded', restoreApiKey);

// Add a click event listener to the save button
// Ensure the button element exists before adding the listener
if (saveButton) {
    saveButton.addEventListener('click', saveApiKey);
} else {
    console.error("Could not find the 'saveKey' button in popup.html");
}

// Optional: Allow saving by pressing Enter in the input field
if (apiKeyInput) {
    apiKeyInput.addEventListener('keypress', (event) => {
        // Check if the key pressed was 'Enter'
        if (event.key === 'Enter') {
            // Prevent the default Enter key behavior (like submitting a form, if applicable)
            event.preventDefault();
            // Trigger the save function
            saveApiKey();
        }
    });
} else {
     console.error("Could not find the 'apiKey' input field in popup.html");
}
