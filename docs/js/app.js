import * as dom from './dom.js';
import { CONFIG } from './config.js';
import {
  saveLastInput,
  saveLastAction,
  saveTargetLanguage,
  loadApiKeyFromStorage,
  loadTargetLanguage,
  loadLastAction,
  loadLastInput,
} from './storage.js';
import { createPrompt, validateOutput } from './prompts.js';
import { pollinationsRequest } from './api.js';
import {
  showError,
  clearError,
  updateActionSettings,
  updateCharCounter,
  applyTheme,
  getPreferredTheme,
  toggleTheme,
  createCancelButton,
  handleCopy,
  handleToogleSecret,
  updateCopyButtonState,
} from './ui.js';
import {
  loadApiKey,
  handleLoginClick,
  handleClearApiKey,
  handleAuthClick,
} from './auth.js';

let currentAbortController = null;

async function handleRun(event) {
  event.preventDefault();
  clearError();

  const apiKey = loadApiKeyFromStorage();
  const text = dom.textInput?.value.trim() || '';
  const action = dom.actionSelect?.value || 'explain';
  const targetLanguage = saveTargetLanguage(dom.targetLanguageInput?.value.trim() || 'English');
  const model = 'nova-fast';
  if (!apiKey) { showError('Please connect to Pollinations or save your API key before running.'); return; }
  if (!text) { showError('Please paste or type some text to process.'); return; }
  if (action === 'translate' && !targetLanguage) { showError('Please enter a target language for translation.'); return; }
  if (text.length > CONFIG.MAX_INPUT_LENGTH) {
    showError(`Input text exceeds the ${CONFIG.MAX_INPUT_LENGTH.toLocaleString()} character limit. Please shorten it.`);
    return;
  }
  
  saveLastInput(text);
  saveLastAction(action);

  const prompt = createPrompt(action, text, targetLanguage || 'English');

  if (dom.outputArea) dom.outputArea.textContent = '';
  if (dom.outputHint) dom.outputHint.textContent = 'Processing…';

  if (dom.runButton) {
    dom.runButton.disabled = true;
    dom.runButton.setAttribute('aria-busy', 'true');
    dom.runButton.insertAdjacentElement('afterend', createCancelButton(() => currentAbortController?.abort()));
  }
  if (dom.toolForm) dom.toolForm.setAttribute('aria-busy', 'true');

  currentAbortController = new AbortController();
  const timeoutId = setTimeout(() => currentAbortController.abort(), CONFIG.API_TIMEOUT);

  try {
    const result = await pollinationsRequest(apiKey, prompt, model, {
      onChunk(fullText) { if (dom.outputArea) dom.outputArea.textContent = fullText; },
      signal: currentAbortController.signal,
    });

    clearTimeout(timeoutId);
    const validated = validateOutput(result);
    if (!validated.ok) {
      showError(validated.message);
      if (dom.outputHint) dom.outputHint.textContent = 'Processing failed. Fix the issue and try again.';
      return;
    }

    if (dom.outputArea) dom.outputArea.textContent = validated.text;
    if (dom.outputHint) dom.outputHint.textContent = 'Processed successfully. Copy or edit the result below.';
    updateCopyButtonState();
    clearError();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      if (dom.outputHint) dom.outputHint.textContent = 'Request was cancelled.';
    } else {
      showError(error?.message || 'An unexpected error occurred.');
      if (dom.outputHint) dom.outputHint.textContent = 'Processing failed. Fix the issue and try again.';
    }
  } finally {
    currentAbortController = null;
    document.querySelector('#cancel-button')?.remove();
    if (dom.toolForm) dom.toolForm.removeAttribute('aria-busy');
    if (dom.runButton) {
      dom.runButton.disabled = false;
      dom.runButton.removeAttribute('aria-busy');
    }
  }
}

async function init() {
  applyTheme(getPreferredTheme());
  await loadApiKey();

  // Load stored action
  const savedAction = loadLastAction();
  if (dom.actionSelect) dom.actionSelect.value = savedAction;
  // updateActionSettings();

  // Load stored language
  const savedLang = loadTargetLanguage();
  if (dom.targetLanguageInput) dom.targetLanguageInput.value = savedLang;

  // Load stored input
  const savedInput = loadLastInput();
  if (dom.textInput && savedInput) dom.textInput.value = savedInput;
  updateCharCounter();

  // EventListeners
  dom.actionSelect?.addEventListener('change', updateActionSettings);
  dom.targetLanguageInput?.addEventListener('input', () => saveTargetLanguage(dom.targetLanguageInput.value));
  dom.authButton?.addEventListener('click', handleAuthClick);
  dom.revealKeyButton?.addEventListener('click', handleToogleSecret);
  dom.loginButton?.addEventListener('click', handleLoginClick);
  dom.clearKeyButton?.addEventListener('click', handleClearApiKey);
  dom.textInput?.addEventListener('input', updateCharCounter);
  dom.themeToggle?.addEventListener('click', toggleTheme);
  dom.toolForm?.addEventListener('submit', handleRun);
  dom.toolForm?.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun(e);
    }
  });
  dom.copyButton?.addEventListener('click', handleCopy);
  dom.errorDismiss?.addEventListener('click', (e) => { e.preventDefault(); clearError(); });
}

init();