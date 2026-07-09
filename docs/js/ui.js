import * as dom from './dom.js';

export function showError(message) {
  const text = message || 'Something went wrong. Please try again.';
  dom.errorSpan.textContent = text;
  dom.errorBanner.className = '';
  setTimeout(clearError, 4000);
}

function clearError() {
  if (!dom.errorBanner) return;
  dom.errorBanner.className = 'dismissed';
}

export function handleToggleSecret() {
  const isPassword = dom.apiKeyInput.type === 'password';
  dom.apiKeyInput.type = isPassword ? 'text' : 'password';
  dom.eyeImage.setAttribute('src', isPassword ? 'assets/invisible.png' : 'assets/eye.png');
  dom.revealKeyButton.setAttribute('aria-label', isPassword ? 'Hide API key' : 'Reveal API key');
}
