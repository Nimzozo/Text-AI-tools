import * as dom from './dom.js';
import { CONFIG } from './config.js';
import {
  loadApiKeyFromStorage,
  saveApiKeyToStorage,
  saveAuthMethod,
  loadAuthMethod,
} from './storage.js';
import { showError, clearError, setAuthStatus } from './ui.js';
import { refreshModelOptions, loadModelSelectionIntoUI, validateApiKey } from './api.js';

export async function loadApiKey() {
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
    await saveApiKey(apiKeyFromUrl);
    window.history.replaceState({}, document.title, location.pathname + location.search);
    return;
  }

  const apiKey = loadApiKeyFromStorage();
  if (dom.apiKeyInput) {
    dom.apiKeyInput.value = apiKey;
    dom.apiKeyInput.type = 'password';
  }
  if (apiKey && !loadAuthMethod()) {
    saveAuthMethod('apiKey');
  }
  setAuthStatus(apiKey);
}

export async function saveApiKey(key) {
  saveApiKeyToStorage(key);
  if (dom.apiKeyInput) {
    dom.apiKeyInput.value = key || '';
    dom.apiKeyInput.type = 'password';
  }

  if (key) {
    const isValid = await validateApiKey(key);
    if (!isValid) {
      // Key is invalid — clear it and show error
      saveApiKeyToStorage('');
      if (dom.apiKeyInput) dom.apiKeyInput.value = '';
      setAuthStatus('');
      showError('Invalid API key. Please check and try again.');
      return;
    }
  } else {
    loadModelSelectionIntoUI();
  }

  setAuthStatus(key);
}

export async function handleSaveApiKey() {
  clearError();
  const key = dom.apiKeyInput?.value.trim() || '';
  if (!key) {
    showError('Please enter an API key before saving.');
    return;
  }
  saveAuthMethod('apiKey');
  await saveApiKey(key);
}

export async function handleClearApiKey() {
  clearError();
  if (dom.apiKeyInput) dom.apiKeyInput.value = '';
  saveAuthMethod('');
  await saveApiKey('');
}

export function handleAuthClick() {
  const cleanRedirect = location.origin + location.pathname + location.search;
  const params = new URLSearchParams({
    redirect_uri: cleanRedirect,
    client_id: CONFIG.OAUTH_CLIENT_ID,
  });
  window.location.href = `https://enter.pollinations.ai/authorize?${params}`;
}