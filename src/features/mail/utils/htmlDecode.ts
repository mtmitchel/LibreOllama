/**
 * Decodes HTML entities in strings
 */
export function decodeHtmlEntities(text: string): string {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
}

/**
 * Decodes common HTML entities without DOM access
 * Fallback for environments where document is not available
 */
export function decodeHtmlEntitiesSimple(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '='
  };

  return text.replace(/&[#\w]+;/g, (entity) => {
    return entities[entity] || entity;
  });
}

/**
 * Safe HTML entity decoder that works in all environments
 */
export function safeDecodeHtmlEntities(text: string): string {
  if (typeof document !== 'undefined') {
    return decodeHtmlEntities(text);
  }
  return decodeHtmlEntitiesSimple(text);
}