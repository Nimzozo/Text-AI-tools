import { CONFIG } from './config.js';

export function createPrompt(action, inputText, targetLanguage) {
  const safeInput = (inputText ?? '').toString().trim();
  const describeText = 'Text:\n\n' + safeInput;

  switch (action) {
    case 'explain':
      return (
        'Return: only the explanation.\n' +
        'Constraints:\n' +
        '- Max 3 short paragraphs.\n' +
        '- Include bullet points only if they add clarity.\n' +
        '- Preserve meaning; do not add new facts.\n\n' +
        describeText
      );
    case 'format':
      return (
        'Return: only Markdown.\n' +
        'Constraints:\n' +
        '- No preamble or commentary.\n' +
        '- Preserve meaning; do not add new facts.\n' +
        '- Use headings/lists only when appropriate.\n\n' +
        describeText
      );
    case 'improve':
      return (
        'Return: only the improved text.\n' +
        'Constraints:\n' +
        '- Preserve meaning exactly.\n' +
        '- Improve clarity, grammar, tone, and organization.\n' +
        '- Do not add new ideas or facts.\n\n' +
        describeText
      );
    case 'translate':
      return (
        `Return: only the translation to ${targetLanguage}.\n` +
        'Constraints:\n' +
        '- Preserve names, numbers, dates, and technical terms.\n' +
        '- Preserve formatting as much as possible.\n' +
        '- Preserve meaning; do not add commentary.\n\n' +
        describeText
      );
    default:
      return safeInput;
  }
}

export function validateOutput(output) {
  const text = (output ?? '').toString().trim();
  if (!text) {
    return { ok: false, message: 'The API returned an empty result. Please try again.' };
  }
if (text.length > CONFIG.MAX_OUTPUT_LENGTH) {
    return { ok: false, message: 'The result is unexpectedly large. Please try again or shorten your input.' };
  }
  return { ok: true, text };
}