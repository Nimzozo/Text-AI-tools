import * as dom from './dom.js';
import { CONFIG } from './config.js';
import {
  loadApiKeyFromStorage,
  saveApiKeyToStorage,
  saveAuthMethod,
  loadAuthMethod,
} from './storage.js';
import { showError, clearError, setAuthStatus } from './ui.js';
import { validateApiKey } from './api.js';

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

  // Validate the stored key before showing "Connected".
  // If invalid or transient, saveApiKey handles clearing/status itself.
  if (apiKey) {
    await saveApiKey(apiKey);
  } else {
    setAuthStatus('');
  }
}

export async function saveApiKey(key) {
  // Persist the key first so a transient error doesn't lose it.
  saveApiKeyToStorage(key);
  if (dom.apiKeyInput) {
    dom.apiKeyInput.value = key || '';
    dom.apiKeyInput.type = 'password';
  }

  if (key) {
    // Show a pending state while we verify with the server.
    if (dom.authStatus) {
      dom.authStatus.textContent = 'Verifying API key…';
      dom.authStatus.classList.remove('status-connected', 'status-disconnected');
    }
    if (dom.authNote) {
      dom.authNote.textContent = 'Checking your API key with the server…';
    }

    try {
      const isValid = await validateApiKey(key);
      if (!isValid) {
        // Key is invalid — clear it and show error
        saveApiKeyToStorage('');
        if (dom.apiKeyInput) dom.apiKeyInput.value = '';
        setAuthStatus('');
        showError('Invalid API key. Please check and try again.');
        return;
      }
    } catch (err) {
      // Transient error (server down / rate-limited) — keep the key, surface the message
      showError(err?.message || 'Could not verify key. Please try again.');
      setAuthStatus(key);
      return;
    }
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