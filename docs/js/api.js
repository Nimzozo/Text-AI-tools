// API requests functions

import { CONFIG } from './config.js';

export async function validateApiKey(apiKey) {
  if (!apiKey) {
    return false;
  }
  let response;
  try {
    response = await fetch(CONFIG.KEY_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });
  } catch {
    throw new Error('Could not verify key. Try again.');
  }
  return response.ok && response.status == 200;
}