// Storage keys
export const STORAGE_KEY = 'pollinationsApiKey';
export const AUTH_METHOD_STORAGE_KEY = 'pollinationsAuthMethod';
export const MODEL_STORAGE_KEY = 'pollinationsModel';
export const TARGET_LANGUAGE_STORAGE_KEY = 'pollinationsTargetLanguage';
export const LAST_INPUT_STORAGE_KEY = 'pollinationsLastInput';
export const LAST_ACTION_STORAGE_KEY = 'pollinationsLastAction';

// App configuration
export const CONFIG = {
  OAUTH_CLIENT_ID: 'pk_glFXkwE3j6MaBBMM',
  API_TIMEOUT: 120_000,
  API_ENDPOINT: 'https://gen.pollinations.ai/text',
  MODELS_ENDPOINT: 'https://gen.pollinations.ai/text/models',
  MAX_OUTPUT_LENGTH: 200_000,
  MAX_INPUT_LENGTH: 50_000,
};

export const DEFAULT_MODEL_OPTIONS = ['mistral', 'openai', 'llama'];