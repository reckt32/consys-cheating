// options.js
// Handles saving and loading the API key on the options page.

// Get references to the DOM elements
const apiKeyInput = document.getElementById('apiKey');
const saveButton = document.getElementById('save');
const statusDiv = document.getElementById('status');

// --- Functions ---

// Function to load the saved API key from storage and display it
function restoreOptions() {
  // Use chrome.storage.sync.get to retrieve the 'geminiApiKey'
  // chrome.storage.sync automatically syncs across user's signed-in browsers
  chrome.storage.sync.get('geminiApiKey', (data) => {
    // Check if an API key was actually retrieved
    if (data.geminiApiKey) {
      // If found, set the value of the input field
      apiKeyInput.value = data.geminiApiKey;
    }
    // No else needed, if no key is stored, the field remains empty
  });
}

// Function to save the API key entered by the user to storage
function saveOptions() {
  // Get the current value from the API key input field
  const apiKey = apiKeyInput.value.trim(); // Trim whitespace

  // Basic validation: Ensure the key is not empty
  if (!apiKey) {
      statusDiv.textContent = 'Error: API Key cannot be empty.';
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

      // Check for any runtime errors during saving (less common with sync)
      if (chrome.runtime.lastError) {
          console.error("Error saving API key:", chrome.runtime.lastError);
          statusDiv.textContent = `Error saving: ${chrome.runtime.lastError.message}`;
          statusDiv.style.color = 'red';
      } else {
          // Update the status div to confirm successful save
          statusDiv.textContent = 'API Key saved successfully!';
          statusDiv.style.color = 'green'; // Use green color for success
      }

      // Clear the status message after 3 seconds regardless of success/error
      setTimeout(() => { statusDiv.textContent = ''; }, 3000);
    }
  );
}

// --- Event Listeners ---

// When the options page HTML is fully loaded, call restoreOptions to load any saved key
document.addEventListener('DOMContentLoaded', restoreOptions);

// When the save button is clicked, call saveOptions to save the entered key
saveButton.addEventListener('click', saveOptions);

// Optional: Allow saving by pressing Enter in the input field
apiKeyInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        saveOptions();
    }
});
