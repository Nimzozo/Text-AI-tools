import * as dom from './dom.js';
import { CONFIG } from './config.js';
import {
  loadApiKeyFromStorage,
  saveApiKeyToStorage,
  saveAuthMethod,
  loadAuthMethod,
} from './storage.js';
import { showError, clearError, setAuthStatus } from './ui.js';
import { refreshModelOptions, loadModelSelectionIntoUI } from './api.js';

export function loadApiKey() {
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

export function saveApiKey(key) {
  saveApiKeyToStorage(key);
  if (dom.apiKeyInput) {
    dom.apiKeyInput.value = key || '';
    dom.apiKeyInput.type = 'password';
  }
  setAuthStatus(key);
  if (key) {
    void refreshModelOptions(key);
  } else {
    loadModelSelectionIntoUI();
  }
}

export function handleSaveApiKey() {
  clearError();
  const key = dom.apiKeyInput?.value.trim() || '';
  if (!key) {
    showError('Please enter an API key before saving.');
    return;
  }
  saveAuthMethod('apiKey');
  saveApiKey(key);
}

export function handleClearApiKey() {
  clearError();
  if (dom.apiKeyInput) dom.apiKeyInput.value = '';
  saveAuthMethod('');
  saveApiKey('');
}

export function handleAuthClick() {
  const cleanRedirect = location.origin + location.pathname + location.search;
  const params = new URLSearchParams({
    redirect_uri: cleanRedirect,
    client_id: CONFIG.OAUTH_CLIENT_ID,
  });
  window.location.href = `https://enter.pollinations.ai/authorize?${params}`;
}