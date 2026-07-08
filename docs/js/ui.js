import * as dom from './dom.js';
import { loadAuthMethod, saveLastAction, loadApiKeyFromStorage } from './storage.js';
import { CONFIG } from './config.js';

export function showError(message) {
  const text = message || 'Something went wrong. Please try again.';
  if (!dom.errorBanner) {
    console.error('Error:', text);
    return;
  }
  let msg = dom.errorBanner.querySelector('.error-message');
  if (!msg) {
    msg = document.createElement('span');
    msg.className = 'error-message';
    dom.errorBanner.appendChild(msg);
  }
  msg.textContent = text;
  dom.errorBanner.hidden = false;
  dom.errorBanner.classList.toggle('short', text.length <= 80 && !text.includes('\n'));
  dom.errorBanner.title = text;
}

export function clearError() {
  if (!dom.errorBanner) return;
  dom.errorBanner.hidden = true;
  const msg = dom.errorBanner.querySelector('.error-message');
  if (msg) msg.textContent = '';
  dom.errorBanner.classList.remove('short');
  dom.errorBanner.removeAttribute('title');
}

export function updateActionSettings() {
  // const action = dom.actionSelect.value;
  // dom.targetLanguageRow.hidden = action !== 'translate';
  const descriptions = {
    explain: 'Create a concise summary of the text.',
    format: 'Rewrite the text with Markdown formatting, proper punctuation, and clear structure.',
    improve: 'Suggest improvements for clarity, grammar, tone, and organization while keeping the meaning intact.',
    translate: 'Translate the text into your selected language while keeping the meaning intact.',
  };
  // dom.actionDescription.textContent = descriptions[action] || '';
  // saveLastAction(action);
}

export function updateCharCounter() {
  if (!dom.charCounter || !dom.textInput) return;
  const text = dom.textInput.value;
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  dom.charCounter.textContent = `${chars.toLocaleString()} character${chars !== 1 ? 's' : ''} · ${words.toLocaleString()} word${words !== 1 ? 's' : ''}`;

  // Show warning when approaching the limit
  const warning = dom.charWarning;
  if (warning) {
    if (chars > CONFIG.MAX_INPUT_LENGTH) {
      warning.textContent = `⚠️ Exceeds ${CONFIG.MAX_INPUT_LENGTH.toLocaleString()} character limit`;
      warning.hidden = false;
    } else if (chars > CONFIG.MAX_INPUT_LENGTH * 0.9) {
      const remaining = CONFIG.MAX_INPUT_LENGTH - chars;
      warning.textContent = `⚠️ ${remaining.toLocaleString()} character${remaining !== 1 ? 's' : ''} remaining before limit`;
      warning.hidden = false;
    } else {
      warning.hidden = true;
    }
  }
}

export function getPreferredTheme() {
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  if (dom.themeToggle) {
    dom.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    dom.themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

export function createCancelButton(onCancel) {
  const btn = document.createElement('button');
  btn.id = 'cancel-button';
  btn.className = 'button secondary cancel-button';
  btn.textContent = 'Cancel';
  btn.type = 'button';
  btn.addEventListener('click', onCancel);
  return btn;
}

export function handleToogleSecret() {
  const isPassword = dom.apiKeyInput.type === 'password';
  dom.apiKeyInput.type = isPassword ? 'text' : 'password';
  dom.eyeImage.setAttribute('src', isPassword ? 'assets/invisible.png' : 'assets/eye.png');
  dom.revealKeyButton.setAttribute('aria-label', isPassword ? 'Hide API key' : 'Reveal API key');
}

export function handleCopy() {
  const text = dom.outputArea?.textContent.trim();
  if (!text) return;
  navigator.clipboard.writeText(text)
    .then(() => {
      if (dom.outputHint) dom.outputHint.textContent = 'Result copied to clipboard.';
    })
    .catch(() => showError('Unable to copy result.'));
}

export function updateCopyButtonState() {
  if (!dom.copyButton) return;
  const hasOutput = !!dom.outputArea?.textContent.trim();
  const isConnected = !!loadApiKeyFromStorage();
  dom.copyButton.disabled = !hasOutput || !isConnected;
}

export function setAuthStatus(apiKey) {
  const isConnected = Boolean(apiKey);
  const authMethod = loadAuthMethod();

  if (isConnected && dom.authStatus) {
    const masked = `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}`;
    const label = authMethod === 'oauth'
      ? `Connected via OAuth as ${masked}`
      : authMethod === 'apiKey'
        ? `Connected with saved API key as ${masked}`
        : `Connected as ${masked}`;
    dom.authStatus.textContent = label;
    dom.authStatus.classList.add('status-connected');
    dom.authStatus.classList.remove('status-disconnected');
  } else if (dom.authStatus) {
    dom.authStatus.textContent = 'Not connected';
    dom.authStatus.classList.remove('status-connected');
    dom.authStatus.classList.add('status-disconnected');
  }

  updateAuthNote(isConnected, authMethod);
  setToolAccess(isConnected);
}

function updateAuthNote(isConnected, authMethod) {
  if (!dom.authNote) return;
  if (!isConnected) {
    dom.authNote.textContent = 'Please connect or paste your Pollinations API key to continue.';
  } else if (authMethod === 'oauth') {
    dom.authNote.textContent = 'OAuth login successful. You can now use the tool.';
  } else if (authMethod === 'apiKey') {
    dom.authNote.textContent = 'Saved API key is active. You can clear it anytime.';
  } else {
    dom.authNote.textContent = 'Connected. You can now use the tool.';
  }
}

function setToolAccess(isConnected) {
  if (dom.toolContent) dom.toolContent.hidden = !isConnected;
  if (dom.textInput) dom.textInput.disabled = !isConnected;
  if (dom.actionSelect) dom.actionSelect.disabled = !isConnected;
  if (dom.targetLanguageInput) dom.targetLanguageInput.disabled = !isConnected;
  if (dom.runButton) dom.runButton.disabled = !isConnected;
  updateCopyButtonState();
}