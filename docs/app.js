const STORAGE_KEY = 'pollinationsApiKey';

const authButton = document.querySelector('#auth-button');
const authStatus = document.querySelector('#auth-status');
const apiKeyInput = document.querySelector('#api-key-input');
const saveKeyButton = document.querySelector('#save-key-button');
const clearKeyButton = document.querySelector('#clear-key-button');
const toolForm = document.querySelector('#tool-form');
const actionSelect = document.querySelector('#tool-action');
const actionDescription = document.querySelector('#action-description');
const targetLanguageRow = document.querySelector('#translate-language-row');
const outputArea = document.querySelector('#output-display');
const copyButton = document.querySelector('#copy-button');
const runButton = document.querySelector('#run-button');
const errorBanner = document.querySelector('#error-banner');
const copyFeedback = document.querySelector('#copy-feedback');
const textInput = document.querySelector('#input-text');

/**
 * Updates the authentication status display based on the provided API key.
 * @param {*} apiKey 
 */
function setAuthStatus(apiKey) {
  if (apiKey) {
    const masked = `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}`;
    authStatus.textContent = `Connected as ${masked}`;
    authStatus.classList.add('status-connected');
    authStatus.classList.remove('status-disconnected');
  } else {
    authStatus.textContent = 'Not connected';
    authStatus.classList.remove('status-connected');
    authStatus.classList.add('status-disconnected');
  }
}

/**
 * Loads the API key from local storage and updates the authentication status.
 * Also checks the URL hash for an API key returned from the auth redirect.
 */
function loadApiKey() {
  // Check for API key in URL hash from auth redirect
  const params = new URLSearchParams(location.hash.slice(1));
  const apiKeyFromUrl = params.get('api_key');
  
  if (apiKeyFromUrl) {
    saveApiKey(apiKeyFromUrl);
    // Clean up the URL hash
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }

  // Otherwise load from storage
  const apiKey = localStorage.getItem(STORAGE_KEY) || '';
  if (apiKeyInput) {
    apiKeyInput.value = apiKey;
  }
  setAuthStatus(apiKey);
}

/**
 * Saves the API key to local storage and updates the authentication status.
 * @param {*} key 
 */
function saveApiKey(key) {
  if (key) {
    localStorage.setItem(STORAGE_KEY, key);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }

  if (apiKeyInput) {
    apiKeyInput.value = key || '';
  }

  setAuthStatus(key);
}

function handleSaveApiKey() {
  clearError();
  const key = apiKeyInput?.value.trim() || '';

  if (!key) {
    showError('Please enter an API key before saving.');
    return;
  }

  saveApiKey(key);
}

function handleClearApiKey() {
  clearError();

  if (apiKeyInput) {
    apiKeyInput.value = '';
  }

  saveApiKey('');
}

/**
 * Displays an error message in the error banner.
 * @param {*} message 
 */
function showError(message) {
  errorBanner.textContent = message;
  errorBanner.hidden = false;
}

/**
 * Clears the error message from the error banner.
 */
function clearError() {
  errorBanner.hidden = true;
  errorBanner.textContent = '';
}

/**
 * Creates a prompt based on the selected action and input text.
 * @param {*} action 
 * @param {*} inputText 
 * @param {*} targetLanguage 
 * @returns 
 */
function createPrompt(action, inputText, targetLanguage) {
  switch (action) {
    case 'explain':
      return `Summarize the following text in a concise manner, highlighting the main points and key information. Preserve meaning:\n\n${inputText}`;
    case 'format':
      return `Rewrite the following text with proper Markdown formatting, punctuation, and clear structure. Preserve meaning:\n\n${inputText}`;
    case 'improve':
      return `Suggest improvements for clarity, grammar, tone, and organization of the following text while keeping the meaning intact:\n\n${inputText}`;
    case 'translate':
      return `Translate the following text into ${targetLanguage} while keeping the meaning intact:\n\n${inputText}`;
    default:
      return inputText;
  }
}

function updateActionSettings() {
  targetLanguageRow.hidden = actionSelect.value !== 'translate';

  const descriptions = {
    explain: 'Create a concise summary of the text.',
    format: 'Rewrite the text with Markdown formatting, proper punctuation, and clear structure.',
    improve: 'Suggest improvements for clarity, grammar, tone, and organization while keeping the meaning intact.',
    translate: 'Translate the text into your selected language while keeping the meaning intact.'
  };

  actionDescription.textContent = descriptions[actionSelect.value] || '';
}

async function pollinationsRequest(apiKey, prompt) {
  const endpoint = 'https://gen.pollinations.ai/text';
  const payload = {
    model: 'mistral',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  if (!response.ok) {
    const message = text.trim() || response.statusText;
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${message}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return text.trim();
  }

  try {
    const data = JSON.parse(text);
    return data.text || data.output || data.result || data?.choices?.[0]?.text || JSON.stringify(data, null, 2);
  } catch (error) {
    return text.trim();
  }
}

async function handleRun(event) {
  event.preventDefault();
  clearError();

  const apiKey = localStorage.getItem(STORAGE_KEY);
  const text = textInput.value.trim();
  const action = actionSelect.value;
  const targetLanguage = document.querySelector('#target-language').value.trim() || 'English';

  if (!apiKey) {
    showError('Please connect to the Pollinations API before running the tool.');
    return;
  }

  if (!text) {
    showError('Please paste or type some text to process.');
    return;
  }

  const prompt = createPrompt(action, text, targetLanguage);
  runButton.disabled = true;
  runButton.textContent = 'Processing...';
  outputArea.textContent = '';
  if (copyFeedback) copyFeedback.hidden = true;

  try {
    const result = await pollinationsRequest(apiKey, prompt);
    outputArea.textContent = result;
  } catch (error) {
    showError(error.message);
  } finally {
    runButton.disabled = false;
    runButton.textContent = 'Run';
  }
}

/**
 * Handles the authentication click event by redirecting the user to the Pollinations authorization page.
 * The API key will be captured in the URL hash after the redirect and processed by loadApiKey().
 */
function handleAuthClick() {
  const params = new URLSearchParams({
    redirect_uri: location.href,
    client_id: 'pk_glFXkwE3j6MaBBMM',
  });
  window.location.href = `https://enter.pollinations.ai/authorize?${params}`;
}

function handleCopy() {
  if (!outputArea.textContent.trim()) {
    return;
  }
  navigator.clipboard.writeText(outputArea.textContent.trim())
    .then(() => {
      if (copyFeedback) {
        copyFeedback.hidden = false;
        setTimeout(() => {
          copyFeedback.hidden = true;
        }, 2000);
      }
    })
    .catch(() => {
      showError('Unable to copy result.');
    });
}

function init() {
  loadApiKey();
  updateActionSettings();
  actionSelect.addEventListener('change', updateActionSettings);
  authButton.addEventListener('click', handleAuthClick);
  saveKeyButton.addEventListener('click', handleSaveApiKey);
  clearKeyButton.addEventListener('click', handleClearApiKey);
  toolForm.addEventListener('submit', handleRun);
  copyButton.addEventListener('click', handleCopy);
}

init();
