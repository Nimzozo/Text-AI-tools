const STORAGE_KEY = 'pollinationsApiKey';
const MODEL_STORAGE_KEY = 'pollinationsModel';
const TARGET_LANGUAGE_STORAGE_KEY = 'pollinationsTargetLanguage';

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
const errorDismiss = document.querySelector('#error-dismiss');
const copyFeedback = document.querySelector('#copy-feedback');
const textInput = document.querySelector('#input-text');
const targetLanguageInput = document.querySelector('#target-language');
const modelSelect = document.querySelector('#model-select');
const toolContent = document.querySelector('#tool-content');

/**
 * Updates the authentication status display based on the provided API key.
 * @param {*} apiKey 
 */
function setAuthStatus(apiKey) {
  const isConnected = Boolean(apiKey);

  if (isConnected) {
    const masked = `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}`;
    if (authStatus) {
      authStatus.textContent = `Connected as ${masked}`;
      authStatus.classList.add('status-connected');
      authStatus.classList.remove('status-disconnected');
    }
  } else {
    if (authStatus) {
      authStatus.textContent = 'Not connected';
      authStatus.classList.remove('status-connected');
      authStatus.classList.add('status-disconnected');
    }
  }

  setToolAccess(isConnected);
}

function setToolAccess(isConnected) {
  if (toolContent) {
    toolContent.hidden = !isConnected;
  }

  if (textInput) {
    textInput.disabled = !isConnected;
  }

  if (actionSelect) {
    actionSelect.disabled = !isConnected;
  }

  if (modelSelect) {
    modelSelect.disabled = !isConnected;
  }

  if (targetLanguageInput) {
    targetLanguageInput.disabled = !isConnected;
  }

  if (runButton) {
    runButton.disabled = !isConnected;
  }

  if (copyButton) {
    copyButton.disabled = !isConnected || !outputArea?.textContent.trim();
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

function loadModelSelection() {
  const savedModel = localStorage.getItem(MODEL_STORAGE_KEY) || 'mistral';
  const selectedModel = ['mistral', 'openai', 'llama'].includes(savedModel) ? savedModel : 'mistral';

  if (modelSelect) {
    modelSelect.value = selectedModel;
  }

  return selectedModel;
}

function saveModelSelection(model) {
  const selectedModel = model || 'mistral';
  localStorage.setItem(MODEL_STORAGE_KEY, selectedModel);

  if (modelSelect) {
    modelSelect.value = selectedModel;
  }

  return selectedModel;
}

function loadTargetLanguage() {
  const savedLanguage = localStorage.getItem(TARGET_LANGUAGE_STORAGE_KEY) || 'English';
  if (targetLanguageInput) {
    targetLanguageInput.value = savedLanguage;
  }
  return savedLanguage;
}

function saveTargetLanguage(language) {
  const safeLanguage = language || 'English';
  localStorage.setItem(TARGET_LANGUAGE_STORAGE_KEY, safeLanguage);

  if (targetLanguageInput) {
    targetLanguageInput.value = safeLanguage;
  }

  return safeLanguage;
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
  const text = message || 'Something went wrong. Please try again.';
  if (errorBanner) {
    // update or create the child span so dismiss button remains intact
    let msg = errorBanner.querySelector('.error-message');
    if (!msg) {
      msg = document.createElement('span');
      msg.className = 'error-message';
      errorBanner.appendChild(msg);
    }
    msg.textContent = text;
    errorBanner.hidden = false;
    errorBanner.setAttribute('role', 'alert');
    errorBanner.setAttribute('aria-live', 'polite');
    // If message is short and single-line, collapse to one-line with ellipsis
    const isShort = text.length <= 80 && !text.includes('\n');
    if (isShort) {
      errorBanner.classList.add('short');
    } else {
      errorBanner.classList.remove('short');
    }
    // keep full text in title for accessibility/hover
    errorBanner.title = text;
  } else {
    console.error('Error:', text);
  }
}

/**
 * Clears the error message from the error banner.
 */
function clearError() {
  if (errorBanner) {
    errorBanner.hidden = true;
    const msg = errorBanner.querySelector('.error-message');
    if (msg) msg.textContent = '';
    errorBanner.classList.remove('short');
    errorBanner.removeAttribute('title');
  }
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
  const action = actionSelect.value;
  targetLanguageRow.hidden = action !== 'translate';

  const descriptions = {
    explain: 'Create a concise summary of the text.',
    format: 'Rewrite the text with Markdown formatting, proper punctuation, and clear structure.',
    improve: 'Suggest improvements for clarity, grammar, tone, and organization while keeping the meaning intact.',
    translate: 'Translate the text into your selected language while keeping the meaning intact.'
  };

  actionDescription.textContent = descriptions[action] || '';
}

async function pollinationsRequest(apiKey, prompt, model = 'mistral') {
  const endpoint = 'https://gen.pollinations.ai/text';
  const payload = {
    model: model || 'mistral',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  };
  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
  } catch (networkError) {
    throw new Error('Network error. Check your connection and try again.');
  }

  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    let message = response.statusText || `Request failed with status ${response.status}`;
    if (contentType.includes('application/json')) {
      try {
        const data = JSON.parse(text);
        message = data.error?.message || data.message || data.detail || message;
      } catch (e) {}
    } else if (text && text.trim()) {
      message = text.trim();
    }
    throw new Error(message);
  }

  if (contentType.includes('application/json')) {
    try {
      const data = JSON.parse(text);
      return data.text || data.output || data.result || data?.choices?.[0]?.text || JSON.stringify(data, null, 2);
    } catch (err) {
      return text.trim();
    }
  }

  return text.trim();
}

async function handleRun(event) {
  event.preventDefault();
  clearError();

  const apiKey = localStorage.getItem(STORAGE_KEY);
  const text = textInput?.value.trim() || '';
  const action = actionSelect?.value || 'explain';
  const targetLanguage = saveTargetLanguage(targetLanguageInput?.value.trim() || 'English');
  const model = saveModelSelection(modelSelect?.value || localStorage.getItem(MODEL_STORAGE_KEY) || 'mistral');

  if (!apiKey) {
    showError('Please connect to Pollinations or save your API key before running.');
    return;
  }

  if (!text) {
    showError('Please paste or type some text to process.');
    return;
  }

  if (action === 'translate' && !targetLanguage) {
    showError('Please enter a target language for translation.');
    return;
  }

  const prompt = createPrompt(action, text, targetLanguage || 'English');

  if (runButton) {
    runButton.disabled = true;
    runButton.textContent = 'Processing...';
  }
  if (copyFeedback) copyFeedback.hidden = true;

  try {
    const result = await pollinationsRequest(apiKey, prompt, model);
    if (outputArea) outputArea.textContent = result;
    if (copyButton) {
      copyButton.disabled = false;
    }
    clearError();
  } catch (error) {
    showError(error?.message || 'An unexpected error occurred.');
  } finally {
    if (runButton) {
      runButton.disabled = false;
      runButton.textContent = 'Run';
    }
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
  loadModelSelection();
  loadTargetLanguage();
  updateActionSettings();
  if (actionSelect) actionSelect.addEventListener('change', updateActionSettings);
  if (modelSelect) modelSelect.addEventListener('change', () => saveModelSelection(modelSelect.value));
  if (targetLanguageInput) targetLanguageInput.addEventListener('input', () => saveTargetLanguage(targetLanguageInput.value));
  if (authButton) authButton.addEventListener('click', handleAuthClick);
  if (saveKeyButton) saveKeyButton.addEventListener('click', handleSaveApiKey);
  if (clearKeyButton) clearKeyButton.addEventListener('click', handleClearApiKey);
  if (toolForm) toolForm.addEventListener('submit', handleRun);
  if (copyButton) copyButton.addEventListener('click', handleCopy);
  if (errorDismiss) {
    errorDismiss.addEventListener('click', (e) => {
      e.preventDefault();
      clearError();
    });
  }
}

init();
