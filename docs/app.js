const STORAGE_KEY = 'pollinationsApiKey';
const AUTH_METHOD_STORAGE_KEY = 'pollinationsAuthMethod';
const MODEL_STORAGE_KEY = 'pollinationsModel';
const TARGET_LANGUAGE_STORAGE_KEY = 'pollinationsTargetLanguage';
const LAST_INPUT_STORAGE_KEY = 'pollinationsLastInput';
const LAST_ACTION_STORAGE_KEY = 'pollinationsLastAction';

const authButton = document.querySelector('#auth-button');
const authStatus = document.querySelector('#auth-status');
const authNote = document.querySelector('#auth-note');
const apiKeyInput = document.querySelector('#api-key-input');
const saveKeyButton = document.querySelector('#save-key-button');
const clearKeyButton = document.querySelector('#clear-key-button');
const toolForm = document.querySelector('#tool-form');
const actionSelect = document.querySelector('#tool-action');
const actionDescription = document.querySelector('#action-description');
const targetLanguageRow = document.querySelector('#translate-language-row');
const outputArea = document.querySelector('#output-display');
const outputHint = document.querySelector('#output-hint');
const copyButton = document.querySelector('#copy-button');
const runButton = document.querySelector('#run-button');
const errorBanner = document.querySelector('#error-banner');
const errorDismiss = document.querySelector('#error-dismiss');
const copyFeedback = document.querySelector('#copy-feedback');
const textInput = document.querySelector('#input-text');
const targetLanguageInput = document.querySelector('#target-language');
const modelSelect = document.querySelector('#model-select');
const toolContent = document.querySelector('#tool-content');
const DEFAULT_MODEL_OPTIONS = ['mistral', 'openai', 'llama'];

/**
 * Updates the authentication status display based on the provided API key.
 * @param {*} apiKey 
 */
function setAuthStatus(apiKey) {
  const isConnected = Boolean(apiKey);
  const authMethod = loadAuthMethod();

  if (isConnected) {
    const masked = `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}`;
    if (authStatus) {
      if (authMethod === 'oauth') {
        authStatus.textContent = `Connected via OAuth as ${masked}`;
      } else if (authMethod === 'apiKey') {
        authStatus.textContent = `Connected with saved API key as ${masked}`;
      } else {
        authStatus.textContent = `Connected as ${masked}`;
      }
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

  updateAuthNote(isConnected, authMethod);
  setToolAccess(isConnected);
}

function updateAuthNote(isConnected, authMethod) {
  if (!authNote) return;

  if (!isConnected) {
    authNote.textContent = 'Please connect or paste your Pollinations API key to continue.';
    return;
  }

  if (authMethod === 'oauth') {
    authNote.textContent = 'OAuth login successful. You can now use the tool.';
  } else if (authMethod === 'apiKey') {
    authNote.textContent = 'Saved API key is active. You can clear it anytime.';
  } else {
    authNote.textContent = 'Connected. You can now use the tool.';
  }
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

  updateCopyButtonState();
}

function updateCopyButtonState() {
  if (!copyButton) return;
  const hasOutput = !!outputArea?.textContent.trim();
  const isConnected = !!localStorage.getItem(STORAGE_KEY);
  copyButton.disabled = !hasOutput || !isConnected;
}

/**
 * Loads the API key from local storage and updates the authentication status.
 * Also checks the URL hash for an API key returned from the auth redirect.
 */
function loadApiKey() {
  // Check for API key in URL hash from auth redirect
  const params = new URLSearchParams(location.hash.slice(1));
  const apiKeyFromUrl = params.get('api_key');
  const denied = params.has('accessDenied') || location.hash.includes('accessDenied');

  if (denied) {
    showError('OAuth authorization was denied. Please try again or paste your API key.');
    window.history.replaceState({}, document.title, location.pathname + location.search);
    return;
  }

  if (apiKeyFromUrl) {
    saveAuthMethod('oauth');
    saveApiKey(apiKeyFromUrl);
    // Clean up the URL hash
    window.history.replaceState({}, document.title, location.pathname + location.search);
    return;
  }

  // Otherwise load from storage
  const apiKey = localStorage.getItem(STORAGE_KEY) || '';
  if (apiKeyInput) {
    apiKeyInput.value = apiKey;
    apiKeyInput.type = 'password';
  }

  if (apiKey && !loadAuthMethod()) {
    saveAuthMethod('apiKey');
  }

  setAuthStatus(apiKey);
}

function formatModelLabel(model) {
  if (!model) return 'Model';
  return String(model)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getModelOptionsFromPayload(data) {
  if (Array.isArray(data)) {
    return data
      .map((model) => (typeof model === 'string' ? model : model?.name || model?.id || model?.value || model?.model))
      .filter(Boolean);
  }

  if (Array.isArray(data?.models)) {
    return data.models
      .map((model) => (typeof model === 'string' ? model : model?.name || model?.id || model?.value || model?.model))
      .filter(Boolean);
  }

  if (data && typeof data === 'object') {
    if (typeof data.name === 'string') {
      return [data.name];
    }
  }

  return [];
}

function setModelOptions(models, selectedModel) {
  if (!modelSelect) return selectedModel || DEFAULT_MODEL_OPTIONS[0] || 'mistral';

  const availableModels = models.length ? models : DEFAULT_MODEL_OPTIONS;
  const normalizedSelected = availableModels.includes(selectedModel) ? selectedModel : availableModels[0] || DEFAULT_MODEL_OPTIONS[0] || 'mistral';

  modelSelect.innerHTML = '';
  availableModels.forEach((model) => {
    const option = document.createElement('option');
    option.value = model;
    option.textContent = formatModelLabel(model);
    modelSelect.appendChild(option);
  });

  modelSelect.value = normalizedSelected;
  localStorage.setItem(MODEL_STORAGE_KEY, normalizedSelected);

  return normalizedSelected;
}

async function refreshModelOptions(apiKey) {
  if (!modelSelect) return '';

  const savedModel = localStorage.getItem(MODEL_STORAGE_KEY) || '';

  try {
    if (!apiKey) {
      throw new Error('No API key');
    }

    const response = await fetch('https://gen.pollinations.ai/text/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Unable to load models (${response.status})`);
    }

    const data = await response.json();
    const models = getModelOptionsFromPayload(data);
    return setModelOptions(models, savedModel);
  } catch (error) {
    return setModelOptions(DEFAULT_MODEL_OPTIONS, savedModel);
  }
}

function loadModelSelection() {
  const savedModel = localStorage.getItem(MODEL_STORAGE_KEY) || 'mistral';
  const selectedModel = DEFAULT_MODEL_OPTIONS.includes(savedModel) ? savedModel : 'mistral';

  if (modelSelect) {
    setModelOptions(DEFAULT_MODEL_OPTIONS, selectedModel);
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

function loadAuthMethod() {
  const method = localStorage.getItem(AUTH_METHOD_STORAGE_KEY);
  return method === 'oauth' || method === 'apiKey' ? method : '';
}

function saveAuthMethod(method) {
  if (method === 'oauth' || method === 'apiKey') {
    localStorage.setItem(AUTH_METHOD_STORAGE_KEY, method);
    return method;
  }

  localStorage.removeItem(AUTH_METHOD_STORAGE_KEY);
  return '';
}

function loadLastInput() {
  const savedInput = localStorage.getItem(LAST_INPUT_STORAGE_KEY) || '';
  if (textInput) {
    textInput.value = savedInput;
  }
  return savedInput;
}

function saveLastInput(value) {
  localStorage.setItem(LAST_INPUT_STORAGE_KEY, value || '');
}

function loadLastAction() {
  const savedAction = localStorage.getItem(LAST_ACTION_STORAGE_KEY) || 'explain';
  if (actionSelect && ['explain', 'format', 'improve', 'translate'].includes(savedAction)) {
    actionSelect.value = savedAction;
  }
  return savedAction;
}

function saveLastAction(value) {
  const action = ['explain', 'format', 'improve', 'translate'].includes(value) ? value : 'explain';
  localStorage.setItem(LAST_ACTION_STORAGE_KEY, action);
  return action;
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
    apiKeyInput.type = 'password';
  }

  setAuthStatus(key);
  if (key) {
    void refreshModelOptions(key);
  } else {
    loadModelSelection();
  }
}

function handleSaveApiKey() {
  clearError();
  const key = apiKeyInput?.value.trim() || '';

  if (!key) {
    showError('Please enter an API key before saving.');
    return;
  }

  saveAuthMethod('apiKey');
  saveApiKey(key);
}

function handleClearApiKey() {
  clearError();

  if (apiKeyInput) {
    apiKeyInput.value = '';
  }

  saveAuthMethod('');
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
  const safeInput = (inputText ?? '').toString().trim();

  // Keep prompts predictable: return only the requested output.
  const describeText = 'Text:\n\n' + safeInput;

  switch (action) {
    case 'explain':
      return (
        'Return: only the explanation.\n' +
        'Constraints:\n' +
        '- Max 3 short paragraphs.\n' +
        '- Include bullet points only if they add clarity.\n' +
        '- Preserve meaning; do not add new facts.\n\n' +
        describeText
      );
    case 'format':
      return (
        'Return: only Markdown.\n' +
        'Constraints:\n' +
        '- No preamble or commentary.\n' +
        '- Preserve meaning; do not add new facts.\n' +
        '- Use headings/lists only when appropriate.\n\n' +
        describeText
      );
    case 'improve':
      return (
        'Return: only the improved text.\n' +
        'Constraints:\n' +
        '- Preserve meaning exactly.\n' +
        '- Improve clarity, grammar, tone, and organization.\n' +
        '- Do not add new ideas or facts.\n\n' +
        describeText
      );
    case 'translate':
      return (
        `Return: only the translation to ${targetLanguage}.\n` +
        'Constraints:\n' +
        '- Preserve names, numbers, dates, and technical terms.\n' +
        '- Preserve formatting as much as possible.\n' +
        '- Preserve meaning; do not add commentary.\n\n' +
        describeText
      );
    default:
      return safeInput;
  }
}

function validateOutput(output) {
  const text = (output ?? '').toString().trim();
  if (!text) return { ok: false, message: 'The API returned an empty result. Please try again.' };
  if (text.length > 200_000) {
    return { ok: false, message: 'The result is unexpectedly large. Please try again or shorten your input.' };
  }
  return { ok: true, text };
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
  saveLastAction(action);
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

  saveLastInput(text);
  saveLastAction(action);

  const prompt = createPrompt(action, text, targetLanguage || 'English');

  if (runButton) {
    runButton.disabled = true;
    runButton.textContent = 'Processing...';
  }
  if (copyFeedback) copyFeedback.hidden = true;

  try {
    const result = await pollinationsRequest(apiKey, prompt, model);

    const validated = validateOutput(result);
    if (!validated.ok) {
      showError(validated.message);
      if (outputHint) outputHint.textContent = 'Processing failed. Fix the issue and try again.';
      return;
    }

    if (outputArea) outputArea.textContent = validated.text;
    if (outputHint) outputHint.textContent = 'Processed successfully. Copy or edit the result below.';
    updateCopyButtonState();
    clearError();
  } catch (error) {
    showError(error?.message || 'An unexpected error occurred.');
    if (outputHint) outputHint.textContent = 'Processing failed. Fix the issue and try again.';
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
  const cleanRedirect = location.origin + location.pathname + location.search;
  const params = new URLSearchParams({
    redirect_uri: cleanRedirect,
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
      if (outputHint) outputHint.textContent = 'Result copied to clipboard.';
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
