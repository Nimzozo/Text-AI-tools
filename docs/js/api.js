import { CONFIG } from './config.js';
import {showError} from './ui.js';

export async function pollinationsRequest(apiKey, prompt, model, { onChunk, signal } = {}) {
  const payload = {
    model: model,
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
  let res;
  try {
    res = await fetch(CONFIG.KEY_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });
  } catch {
    // Network error — transient, not the user's fault
    throw new Error('Could not verify key — server unavailable. Try again.');
  }

  return (res.ok && res.status == 200);
}