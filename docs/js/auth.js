// Authentication functions

import { validateApiKey } from './api.js';
import * as dom from './dom.js';
import { showError } from './ui.js';

export async function handleLoginClick() {
  const key = dom.apiKeyInput?.value.trim() || '';
  if (!key) {
    showError('Please enter a valid API key.');
    return;
  }
  if (dom.apiKeyInput) {  
    dom.apiKeyInput.type = 'password';
  }
  if (key) {
    try {
      const isValid = await validateApiKey(key);
      if (!isValid) {
        if (dom.apiKeyInput) {
          dom.apiKeyInput.value = '';
        }
        showError('Invalid API key. Please check and try again.');
        return;
      }
    } catch (err) {
      showError(err?.message || 'Could not verify key. Please try again.');
      return;
    }
  }
}

export function handleAuthClick() {
  const cleanRedirect = location.origin + location.pathname + location.search;
  const params = new URLSearchParams({
    redirect_uri: cleanRedirect,
    scope: 'profile,key,usage',
    models: 'openai-fast,gemma,nova-fast'
  });
  window.location.href = `https://enter.pollinations.ai/authorize?${params}`;
}