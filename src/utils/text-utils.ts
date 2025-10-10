/**
 * Text manipulation utilities
 */

/**
 * Strip HTML tags and decode entities from text
 * Used for cleaning excerpts and other user-generated content
 */
export function stripHtml(html: string): string {
  if (!html) return '';

  // Remove all HTML tags
  let text = html.replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '...')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"');

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Truncate text to specified length, preserving word boundaries
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text || text.length <= maxLength) return text;

  // Find the last space before maxLength
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + suffix;
  }

  return truncated + suffix;
}

/**
 * Generate a clean excerpt from HTML content
 * Strips HTML, limits length, preserves word boundaries
 */
export function generateExcerpt(html: string, maxLength: number = 300): string {
  const cleaned = stripHtml(html);
  return truncateText(cleaned, maxLength);
}
