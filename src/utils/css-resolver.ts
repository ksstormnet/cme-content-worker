import { Env } from "../types/database";

/**
 * CSS Resolver - Maps layouts to appropriate CSS URLs and handles CDN serving
 * Integrates with the CSS sync system for dynamic stylesheet management
 */

export type LayoutType = 'homepage' | 'category' | 'post';

export interface CSSFile {
  source_url: string;
  cdn_url: string | null;
  cdn_filename: string | null;
  hash: string | null;
}

export interface CSSMapping {
  layout: LayoutType;
  css_files: CSSFile[];
  fallback_css?: string;
}

export interface CSSResolverOptions {
  baseUrl?: string;
  fallbackEnabled?: boolean;
  cacheEnabled?: boolean;
}

export class CSSResolver {
  private options: CSSResolverOptions;
  private cache: Map<string, CSSMapping> = new Map();

  constructor(options: CSSResolverOptions = {}) {
    this.options = {
      baseUrl: 'https://cdn.cruisemadeeasy.com',
      fallbackEnabled: true,
      cacheEnabled: true,
      ...options
    };
  }

  /**
   * Get CSS files for specific layout type
   * Returns all CSS files in correct WordPress loading order
   */
  async getCSSForLayout(layout: LayoutType, env: Env): Promise<CSSMapping> {
    const cacheKey = `css-${layout}`;
    
    // Return cached result if available and cache enabled
    if (this.options.cacheEnabled && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return cached;
    }

    try {
      // Get CSS settings from database
      const settings = await this.getCSSSettings(env);
      
      if (!settings.css_sync_enabled) {
        return this.getFallbackCSS(layout);
      }

      if (settings.site_css_urls.length === 0) {
        return this.getFallbackCSS(layout);
      }

      // Get all CSS files in WordPress loading order
      const cssFiles: CSSFile[] = [];
      
      for (const sourceUrl of settings.site_css_urls) {
        // Get current active version from database
        const version = await env.DB.prepare(
          "SELECT file_hash, cdn_filename FROM css_versions WHERE file_url = ? AND active = 1"
        ).bind(sourceUrl).first() as { file_hash: string; cdn_filename: string } | null;

        cssFiles.push({
          source_url: sourceUrl,
          cdn_url: version ? `${this.options.baseUrl}/css/${version.cdn_filename}` : null,
          cdn_filename: version?.cdn_filename || null,
          hash: version?.file_hash || null
        });
      }

      const mapping: CSSMapping = {
        layout,
        css_files: cssFiles,
        fallback_css: cssFiles.some(f => !f.cdn_url) ? this.getFallbackCSSContent(layout) : undefined
      };

      // Cache the result
      if (this.options.cacheEnabled) {
        this.cache.set(cacheKey, mapping);
      }

      return mapping;

    } catch (error) {
      console.error(`Error resolving CSS for layout ${layout}:`, error);
      return this.getFallbackCSS(layout);
    }
  }

  /**
   * Get multiple CSS mappings for different layouts
   */
  async getCSSForLayouts(layouts: LayoutType[], env: Env): Promise<Record<LayoutType, CSSMapping>> {
    const results = await Promise.all(
      layouts.map(async layout => ({
        layout,
        mapping: await this.getCSSForLayout(layout, env)
      }))
    );

    return results.reduce((acc, { layout, mapping }) => {
      acc[layout] = mapping;
      return acc;
    }, {} as Record<LayoutType, CSSMapping>);
  }

  /**
   * Get best available CSS URL (CDN first, fallback second)
   */
  getBestCSSUrl(mapping: CSSMapping): string {
    if (mapping.cdn_url) {
      return mapping.cdn_url;
    }
    
    if (this.options.fallbackEnabled && mapping.fallback_css) {
      // In a real implementation, you might serve fallback CSS from a data URL
      // or a different endpoint. For now, return the source URL as fallback.
      return mapping.source_url;
    }
    
    return mapping.source_url;
  }

  /**
   * Check if CSS needs updating
   */
  async checkCSSHealth(layout: LayoutType, env: Env): Promise<{
    healthy: boolean;
    cdn_available: boolean;
    source_accessible: boolean;
    last_sync: string | null;
    error?: string;
  }> {
    try {
      const mapping = await this.getCSSForLayout(layout, env);
      
      let cdn_available = false;
      let source_accessible = false;
      let error: string | undefined;

      // Check CDN availability
      if (mapping.cdn_url) {
        try {
          const response = await fetch(mapping.cdn_url, { method: 'HEAD' });
          cdn_available = response.ok;
        } catch (e) {
          error = `CDN check failed: ${e}`;
        }
      }

      // Check source accessibility
      try {
        const response = await fetch(mapping.source_url, { method: 'HEAD' });
        source_accessible = response.ok;
      } catch (e) {
        error = error ? `${error}; Source check failed: ${e}` : `Source check failed: ${e}`;
      }

      // Get last sync time
      const lastSync = await env.DB.prepare(
        "SELECT detected_at FROM css_versions WHERE file_url = ? AND active = 1"
      ).bind(mapping.source_url).first() as { detected_at: string } | null;

      return {
        healthy: cdn_available || source_accessible,
        cdn_available,
        source_accessible,
        last_sync: lastSync?.detected_at || null,
        error
      };

    } catch (error) {
      return {
        healthy: false,
        cdn_available: false,
        source_accessible: false,
        last_sync: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Force refresh CSS cache
   */
  clearCache(layout?: LayoutType): void {
    if (layout) {
      this.cache.delete(`css-${layout}`);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get CSS settings from database
   */
  private async getCSSSettings(env: Env): Promise<{
    site_css_urls: string[];
    css_sync_enabled: boolean;
  }> {
    try {
      const cssUrlResult = await env.DB.prepare(
        "SELECT value FROM settings WHERE key = ?"
      ).bind("site_css_urls").first() as { value: string } | null;
      
      const syncEnabledResult = await env.DB.prepare(
        "SELECT value FROM settings WHERE key = ?"
      ).bind("css_sync_enabled").first() as { value: string } | null;

      let cssUrls = [];
      try {
        cssUrls = cssUrlResult?.value ? JSON.parse(cssUrlResult.value) : [];
      } catch (error) {
        console.error("Error parsing site_css_urls JSON:", error);
        console.log("Raw value:", cssUrlResult?.value);
        cssUrls = [];
      }
      const syncEnabled = syncEnabledResult?.value === "true" || syncEnabledResult?.value === true;

      return {
        site_css_urls: Array.isArray(cssUrls) ? cssUrls : [cssUrls].filter(Boolean),
        css_sync_enabled: syncEnabled
      };
    } catch (error) {
      console.error("Error fetching CSS settings:", error);
      return {
        site_css_urls: [],
        css_sync_enabled: false
      };
    }
  }

  /**
   * Map layout type to CSS URL index
   * Based on the implementation plan's layout-CSS mapping strategy
   */
  private mapLayoutToCSSUrl(layout: LayoutType, cssUrls: string[]): string {
    switch (layout) {
      case 'homepage':
      case 'category':
        // Both homepage and category use cruise-planning styles (first URL)
        return cssUrls[0];
      
      case 'post':
        // Posts use second URL if available, otherwise fall back to first
        return cssUrls.length > 1 ? cssUrls[1] : cssUrls[0];
      
      default:
        return cssUrls[0] || '';
    }
  }

  /**
   * Get fallback CSS mapping when sync system fails
   */
  private getFallbackCSS(layout: LayoutType): CSSMapping {
    // Emergency fallback - just the GeneratePress main theme CSS
    const fallbackUrl = 'https://cruisemadeeasy.com/wp-content/themes/generatepress/assets/css/main.min.css';

    return {
      layout,
      css_files: [{
        source_url: fallbackUrl,
        cdn_url: null,
        cdn_filename: null,
        hash: null
      }],
      fallback_css: this.getFallbackCSSContent(layout)
    };
  }

  /**
   * Get minimal fallback CSS content
   * Critical CSS for when external stylesheets fail to load
   */
  private getFallbackCSSContent(layout: LayoutType): string {
    const baseCss = `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
      .skip-link { position: absolute; top: -40px; left: 6px; z-index: 999999; padding: 8px 16px; background: #000; color: #fff; text-decoration: none; }
      .skip-link:focus { top: 6px; }
      img { max-width: 100%; height: auto; }
      .posts-grid { display: grid; gap: 2rem; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
      .post-card { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; }
      .post-card__title a { color: #333; text-decoration: none; }
      .post-card__title a:hover { text-decoration: underline; }
    `;

    const layoutSpecificCss = {
      homepage: `
        .site-header { text-align: center; margin-bottom: 2rem; }
        .site-header h1 { margin: 0; color: #2c5aa0; }
      `,
      category: `
        .category-header { margin-bottom: 2rem; }
        .breadcrumb { list-style: none; padding: 0; display: flex; gap: 0.5rem; }
        .breadcrumb li:not(:last-child)::after { content: '/'; margin-left: 0.5rem; }
      `,
      post: `
        .post-content { max-width: 800px; margin: 0 auto; }
        .post-header { margin-bottom: 2rem; }
        .post-meta { color: #666; font-size: 0.9rem; margin-top: 1rem; }
      `
    };

    return baseCss + (layoutSpecificCss[layout] || '');
  }
}

/**
 * Convenience functions
 */

// Default resolver instance
export const cssResolver = new CSSResolver();

/**
 * Get CSS URLs for layout (convenience function)
 * Returns array of CSS URLs in WordPress loading order
 */
export async function getCSSForLayout(layout: LayoutType, env: Env): Promise<string[]> {
  const mapping = await cssResolver.getCSSForLayout(layout, env);
  return mapping.css_files
    .map(file => file.cdn_url || file.source_url)
    .filter(Boolean) as string[];
}

/**
 * Get CSS mapping with full details
 */
export async function getCSSMapping(layout: LayoutType, env: Env): Promise<CSSMapping> {
  return await cssResolver.getCSSForLayout(layout, env);
}

/**
 * Check CSS system health
 */
export async function checkCSSHealth(layout: LayoutType, env: Env) {
  return await cssResolver.checkCSSHealth(layout, env);
}

/**
 * Get CSS for all layout types
 */
export async function getAllCSS(env: Env): Promise<Record<LayoutType, CSSMapping>> {
  return await cssResolver.getCSSForLayouts(['homepage', 'category', 'post'], env);
}