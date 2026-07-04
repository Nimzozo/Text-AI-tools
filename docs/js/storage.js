import {
  STORAGE_KEY,
  AUTH_METHOD_STORAGE_KEY,
  MODEL_STORAGE_KEY,
  TARGET_LANGUAGE_STORAGE_KEY,
  LAST_INPUT_STORAGE_KEY,
  LAST_ACTION_STORAGE_KEY,
} from './config.js';

export function loadApiKeyFromStorage() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function saveApiKeyToStorage(key) {
  if (key) {
    localStorage.setItem(STORAGE_KEY, key);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function loadAuthMethod() {
  const method = localStorage.getItem(AUTH_METHOD_STORAGE_KEY);
  return method === 'oauth' || method === 'apiKey' ? method : '';
}

export function saveAuthMethod(method) {
  if (method === 'oauth' || method === 'apiKey') {
    localStorage.setItem(AUTH_METHOD_STORAGE_KEY, method);
    return method;
  }
  localStorage.removeItem(AUTH_METHOD_STORAGE_KEY);
  return '';
}

export function loadModelSelection() {
  return localStorage.getItem(MODEL_STORAGE_KEY) || 'mistral';
}

export function saveModelSelection(model) {
  const selected = model || 'mistral';
  localStorage.setItem(MODEL_STORAGE_KEY, selected);
  return selected;
}

export function loadTargetLanguage() {
  return localStorage.getItem(TARGET_LANGUAGE_STORAGE_KEY) || 'English';
}

export function saveTargetLanguage(language) {
  const safe = language || 'English';
  localStorage.setItem(TARGET_LANGUAGE_STORAGE_KEY, safe);
  return safe;
}

export function loadLastInput() {
  return localStorage.getItem(LAST_INPUT_STORAGE_KEY) || '';
}

export function saveLastInput(value) {
  localStorage.setItem(LAST_INPUT_STORAGE_KEY, value || '');
}

export function loadLastAction() {
  const saved = localStorage.getItem(LAST_ACTION_STORAGE_KEY) || 'explain';
  return ['explain', 'format', 'improve', 'translate'].includes(saved) ? saved : 'explain';
}

export function saveLastAction(value) {
  const action = ['explain', 'format', 'improve', 'translate'].includes(value) ? value : 'explain';
  localStorage.setItem(LAST_ACTION_STORAGE_KEY, action);
  return action;
}