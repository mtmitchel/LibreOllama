// src/lib/tagUtils.ts

/**
 * Parses a comma-separated string of tags into an array of trimmed strings.
 * Filters out empty strings.
 * @param tagsString The comma-separated string of tags.
 * @returns An array of tag strings.
 */
export const parseTagsString = (tagsString: string): string[] => {
  if (!tagsString || !tagsString.trim()) return [];
  return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
};

/**
 * Formats an array of tag strings into a comma-separated string.
 * @param tagsArray An array of tag strings.
 * @returns A comma-separated string of tags, or an empty string if the array is undefined or empty.
 */
export const formatTagsArray = (tagsArray?: string[]): string => {
  return tagsArray && tagsArray.length > 0 ? tagsArray.join(', ') : '';
};
