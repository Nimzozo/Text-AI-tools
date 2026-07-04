import * as dom from './dom.js';
import { CONFIG } from './config.js';
import {
  saveLastInput,
  saveLastAction,
  saveTargetLanguage,
  saveModelSelection,
  loadTargetLanguage,
  loadLastAction,
} from './storage.js';
import { createPrompt, validateOutput } from './prompts.js';
import { pollinationsRequest, loadModelSelectionIntoUI } from './api.js';
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
  updateCopyButtonState,
} from './ui.js';
import {
  loadApiKey,
  handleSaveApiKey,
  handleClearApiKey,
  handleAuthClick,
} from './auth.js';

let currentAbortController = null;

async function handleRun(event) {
  event.preventDefault();
  clearError();

  const apiKey = localStorage.getItem('pollinationsApiKey');
  const text = dom.textInput?.value.trim() || '';
  const action = dom.actionSelect?.value || 'explain';
  const targetLanguage = saveTargetLanguage(dom.targetLanguageInput?.value.trim() || 'English');
  const model = saveModelSelection(dom.modelSelect?.value || localStorage.getItem('pollinationsModel') || 'mistral');

  if (!apiKey) { showError('Please connect to Pollinations or save your API key before running.'); return; }
  if (!text) { showError('Please paste or type some text to process.'); return; }
  if (action === 'translate' && !targetLanguage) { showError('Please enter a target language for translation.'); return; }

  saveLastInput(text);
  saveLastAction(action);

  const prompt = createPrompt(action, text, targetLanguage || 'English');

  if (dom.outputArea) dom.outputArea.textContent = '';
  if (dom.outputHint) dom.outputHint.textContent = 'Processing…';
  if (dom.copyFeedback) dom.copyFeedback.hidden = true;

  if (dom.runButton) {
    dom.runButton.disabled = true;
    dom.runButton.textContent = 'Processing…';
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
      dom.runButton.textContent = 'Run';
    }
  }
}

function init() {
  applyTheme(getPreferredTheme());
  loadApiKey();
  loadModelSelectionIntoUI();

  const savedLang = loadTargetLanguage();
  if (dom.targetLanguageInput) dom.targetLanguageInput.value = savedLang;

  updateActionSettings();
  updateCharCounter();

  dom.actionSelect?.addEventListener('change', updateActionSettings);
  dom.modelSelect?.addEventListener('change', () => saveModelSelection(dom.modelSelect.value));
  dom.targetLanguageInput?.addEventListener('input', () => saveTargetLanguage(dom.targetLanguageInput.value));
  dom.authButton?.addEventListener('click', handleAuthClick);

  dom.revealKeyButton?.addEventListener('click', () => {
    const isPassword = dom.apiKeyInput.type === 'password';
    dom.apiKeyInput.type = isPassword ? 'text' : 'password';
    dom.revealKeyButton.textContent = isPassword ? '🙈' : '👁';
    dom.revealKeyButton.setAttribute('aria-label', isPassword ? 'Hide API key' : 'Reveal API key');
  });

  dom.saveKeyButton?.addEventListener('click', handleSaveApiKey);
  dom.clearKeyButton?.addEventListener('click', handleClearApiKey);

  dom.clearInputButton?.addEventListener('click', () => {
    if (dom.textInput) {
      dom.textInput.value = '';
      dom.textInput.focus();
      updateCharCounter();
    }
  });

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