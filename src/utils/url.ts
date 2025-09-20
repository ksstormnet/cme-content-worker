// URL generation utilities for blog posts

/**
 * URL-encode a category string for safe use in URLs
 * Converts spaces to hyphens, removes special characters, and lowercases
 */
export function urlEncodeCategory(category: string): string {
  return category
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/[^a-z0-9\-]/g, '')    // Remove non-alphanumeric chars except hyphens
    .replace(/-+/g, '-')            // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');         // Remove leading/trailing hyphens
}

/**
 * Generate a blog post URL using the configured URL pattern and post data
 */
export function generatePostUrl(
  urlPattern: string,
  post: { slug: string; category: string },
  baseUrl?: string
): string {
  // Replace placeholders in the URL pattern
  let url = urlPattern.replace('%category%', urlEncodeCategory(post.category));
  
  // Ensure the URL ends with a slash if it doesn't already
  if (!url.endsWith('/')) {
    url += '/';
  }
  
  // Add the post slug
  url += post.slug;
  
  // Add base URL if provided
  if (baseUrl) {
    // Remove trailing slash from base URL
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    url = cleanBaseUrl + url;
  }
  
  return url;
}

/**
 * Parse a category-based URL to extract the category and slug
 */
export function parsePostUrl(
  url: string,
  urlPattern: string
): { category: string | null; slug: string | null } {
  // Convert URL pattern to regex
  // Replace %category% with a capture group
  const patternRegex = urlPattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
    .replace('%category%', '([^/]+)');      // Replace %category% with capture group
  
  // Add capture group for slug at the end
  const fullPattern = `^${patternRegex}([^/]+)/?$`;
  
  const regex = new RegExp(fullPattern);
  const match = url.match(regex);
  
  if (!match) {
    return { category: null, slug: null };
  }
  
  return {
    category: match[1],
    slug: match[2]
  };
}

/**
 * Generate a category archive URL
 */
export function generateCategoryUrl(
  urlPattern: string,
  category: string,
  baseUrl?: string
): string {
  // Replace placeholders in the URL pattern
  let url = urlPattern.replace('%category%', urlEncodeCategory(category));
  
  // Ensure the URL ends with a slash
  if (!url.endsWith('/')) {
    url += '/';
  }
  
  // Add base URL if provided
  if (baseUrl) {
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    url = cleanBaseUrl + url;
  }
  
  return url;
}

/**
 * Validate that a URL pattern is properly formatted
 */
export function validateUrlPattern(pattern: string): boolean {
  // Must contain %category% placeholder
  if (!pattern.includes('%category%')) {
    return false;
  }
  
  // Should start with /
  if (!pattern.startsWith('/')) {
    return false;
  }
  
  // Should not contain invalid characters
  const invalidChars = /[<>"'\s]/;
  if (invalidChars.test(pattern)) {
    return false;
  }
  
  return true;
}

/**
 * Get example URLs for a given pattern
 */
export function getExampleUrls(pattern: string): {
  category: string;
  slug: string;
  fullUrl: string;
}[] {
  const examples = [
    { category: 'cruise-tips', slug: 'packing-essentials' },
    { category: 'destinations', slug: 'caribbean-highlights' },
    { category: 'cruise lines', slug: 'norwegian-review' },
    { category: 'planning', slug: 'best-time-to-book' }
  ];
  
  return examples.map(example => ({
    ...example,
    fullUrl: generatePostUrl(pattern, example)
  }));
}