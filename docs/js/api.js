import { CONFIG, DEFAULT_MODEL_OPTIONS } from './config.js';
import { loadModelSelection, saveModelSelection as saveModel } from './storage.js';
import { modelSelect } from './dom.js';

export function formatModelLabel(model) {
  if (!model) return 'Model';
  return String(model)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getModelOptionsFromPayload(data) {
  if (Array.isArray(data)) {
    return data
      .map((m) => (typeof m === 'string' ? m : m?.name || m?.id || m?.value || m?.model))
      .filter(Boolean);
  }
  if (Array.isArray(data?.models)) {
    return data.models
      .map((m) => (typeof m === 'string' ? m : m?.name || m?.id || m?.value || m?.model))
      .filter(Boolean);
  }
  if (data && typeof data === 'object' && typeof data.name === 'string') {
    return [data.name];
  }
  return [];
}

export function setModelOptions(models, selectedModel) {
  if (!modelSelect) return selectedModel || DEFAULT_MODEL_OPTIONS[0] || 'mistral';

  const available = models.length ? models : DEFAULT_MODEL_OPTIONS;
  const normalized = available.includes(selectedModel)
    ? selectedModel
    : available[0] || DEFAULT_MODEL_OPTIONS[0] || 'mistral';

  modelSelect.innerHTML = '';
  available.forEach((model) => {
    const opt = document.createElement('option');
    opt.value = model;
    opt.textContent = formatModelLabel(model);
    modelSelect.appendChild(opt);
  });

  modelSelect.value = normalized;
  saveModel(normalized);
  return normalized;
}

export function loadModelSelectionIntoUI() {
  const saved = loadModelSelection();
  const selected = DEFAULT_MODEL_OPTIONS.includes(saved) ? saved : 'mistral';
  if (modelSelect) setModelOptions(DEFAULT_MODEL_OPTIONS, selected);
  return selected;
}

export function saveModelSelection(model) {
  return saveModel(model);
}

export async function refreshModelOptions(apiKey) {
  if (!modelSelect) return false;
  const savedModel = loadModelSelection();

  try {
    if (!apiKey) throw new Error('No API key');
    const res = await fetch(CONFIG.MODELS_ENDPOINT, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`Unable to load models (${res.status})`);
    const data = await res.json();
    setModelOptions(getModelOptionsFromPayload(data), savedModel);
    return true;   // ← key is valid
  } catch {
    setModelOptions(DEFAULT_MODEL_OPTIONS, savedModel);
    return false;  // ← key is invalid
  }
} 

export async function pollinationsRequest(apiKey, prompt, model = 'mistral', { onChunk, signal } = {}) {
  const payload = {
    model: model || 'mistral',
    stream: Boolean(onChunk),
    messages: [{ role: 'user', content: prompt }],
  };

  let response;
  try {
    response = await fetch(CONFIG.API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw new DOMException('Aborted', 'AbortError');
    throw new Error('Network error. Check your connection and try again.');
  }

  if (!response.ok) {
    const text = await response.text();
    const ct = response.headers.get('content-type') || '';
    let msg = response.statusText || `Request failed with status ${response.status}`;
    if (ct.includes('application/json')) {
      try {
        const data = JSON.parse(text);
        msg = data.error?.message || data.message || data.detail || msg;
      } catch {}
    } else if (text && text.trim()) {
      msg = text.trim();
    }
    throw new Error(msg);
  }

  // Streaming
  if (onChunk && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const t = line.trim();
        if (!t || !t.startsWith('data: ')) continue;
        const d = t.slice(6);
        if (d === '[DONE]') continue;
        try {
          const parsed = JSON.parse(d);
          const content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text || '';
          if (content) {
            fullText += content;
            onChunk(fullText, content);
          }
        } catch {
          if (d) {
            fullText += d;
            onChunk(fullText, d);
          }
        }
      }
    }
    return fullText;
  }

  // Non-streaming
  const text = await response.text();
  const ct = response.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try {
      const data = JSON.parse(text);
      return data.text || data.output || data.result || data?.choices?.[0]?.text || JSON.stringify(data, null, 2);
    } catch {
      return text.trim();
    }
  }
  return text.trim();
}

export async function validateApiKey(apiKey) {
  if (!apiKey) return false;
  try {
    const res = await fetch(CONFIG.API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'hi' }],
      }),
    });
    // 401 or 403 means invalid key
    // Any other status (200, 400, 404, 500…) means the key is authenticated
    if (res.status === 401 || res.status === 403) return false;
    return true;
  } catch {
    return false;
  }
}