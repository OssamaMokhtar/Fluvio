/**
 * Input sanitization utilities.
 * Shared between server routes and companion chat to prevent prompt injection.
 */

/**
 * Safe label: strips punctuation used to break out of context, truncates.
 * Use for user-controlled label fields (languages, levels, accents).
 */
export function safeLabel(value: unknown, maxLen = 60): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[^\p{L}\p{N}\s\-']/gu, ' ')  // drop punctuation used to break out of context
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

/**
 * Safe sentence: keeps sentence punctuation but strips delimiters that could
 * forge a new instruction block. Use for reference text displayed to learners.
 */
export function safeSentence(value: unknown, maxLen = 500): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[<>{}\\\`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}
