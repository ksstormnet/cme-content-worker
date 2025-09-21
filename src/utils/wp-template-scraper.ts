/**
 * WordPress Template Scraper - Fetches and processes WordPress page HTML
 * Extracts the complete page structure and replaces content areas with dynamic content
 */

import { Env } from "../types/database";

export interface WordPressTemplate {
  full_html: string;
  content_placeholder: string;
  last_scraped: string;
  template_hash: string;
}

export class WordPressTemplateScraper {
  private sourceUrl: string;
  private contentPlaceholder: string;
  
  constructor(sourceUrl: string = 'https://cruisemadeeasy.com/cruise-planning/') {
    this.sourceUrl = sourceUrl;
    this.contentPlaceholder = '<!-- DYNAMIC_CONTENT_PLACEHOLDER -->';
  }

  /**
   * Fetch and process the WordPress template page
   */
  async scrapeTemplate(env: Env): Promise<WordPressTemplate> {
    try {
      console.log(`Scraping WordPress template from: ${this.sourceUrl}`);
      
      const response = await fetch(this.sourceUrl, {
        headers: {
          'User-Agent': 'CME-Content-Worker/1.0 (Template Scraper)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      console.log(`Scraped HTML length: ${html.length} characters`);

      // Generate hash for change detection
      const templateHash = await this.generateHash(html);
      
      // Process the HTML to add content placeholders
      const processedHtml = this.processHtmlTemplate(html);
      
      const template: WordPressTemplate = {
        full_html: processedHtml,
        content_placeholder: this.contentPlaceholder,
        last_scraped: new Date().toISOString(),
        template_hash: templateHash
      };

      // Cache the template in database
      await this.saveTemplate(template, env);
      
      return template;

    } catch (error) {
      console.error('Error scraping WordPress template:', error);
      throw error;
    }
  }

  /**
   * Process HTML template to identify and replace content areas
   */
  private processHtmlTemplate(html: string): string {
    let processedHtml = html;

    // Step 1: Remove unwanted tracking and optimization scripts
    processedHtml = this.removeUnwantedScripts(processedHtml);

    // Step 2: Find and replace blog post content areas
    processedHtml = this.replaceContentAreas(processedHtml);

    // Step 3: Update CSS URLs to use our CDN versions
    processedHtml = this.replaceCSSUrls(processedHtml);

    return processedHtml;
  }

  /**
   * Remove unwanted scripts and CSS using whitelist approach
   */
  private removeUnwantedScripts(html: string): string {
    let cleanHtml = html;

    // Define whitelist of allowed external resources (from our CSS mapping)
    const allowedCSSPaths = [
      '/wp-includes/css/dist/block-library/',
      '/wp-content/themes/generatepress/assets/css/',
      '/wp-content/uploads/generatepress/',
      '/wp-content/plugins/gp-premium/blog/functions/css/',
      '/wp-content/plugins/gp-premium/menu-plus/functions/css/'
    ];

    const allowedScriptPaths = [
      '/wp-includes/js/jquery/',
      '/wp-content/themes/generatepress/assets/js/'
    ];

    // Remove all external scripts except whitelisted ones
    cleanHtml = cleanHtml.replace(/<script[^>]*src="([^"]*)"[^>]*><\/script>/gi, (match, src) => {
      // Keep if it matches any allowed path
      if (allowedScriptPaths.some(path => src.includes(path))) {
        return match;
      }
      console.log(`Removed script: ${src}`);
      return '';
    });

    // Remove all external stylesheets except whitelisted ones
    cleanHtml = cleanHtml.replace(/<link[^>]*rel=['"]stylesheet['"][^>]*href="([^"]*)"[^>]*>/gi, (match, href) => {
      // Keep if it matches any allowed path AND is not a plugin CSS
      if (allowedCSSPaths.some(path => href.includes(path)) && !href.includes('/wp-content/plugins/')) {
        return match;
      }
      // Exception: keep only specific GeneratePress Premium plugin CSS
      if (href.includes('/wp-content/plugins/gp-premium/') && 
          (href.includes('/blog/functions/css/') || href.includes('/menu-plus/functions/css/'))) {
        return match;
      }
      console.log(`Removed stylesheet: ${href}`);
      return '';
    });

    // Remove all inline scripts (they're usually tracking/analytics)
    cleanHtml = cleanHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, (match) => {
      // Keep if it's just JSON-LD schema (safe structured data)
      if (match.includes('application/ld+json')) {
        return match;
      }
      console.log('Removed inline script');
      return '';
    });

    // Keep ALL inline styles - don't remove GenerateBlocks CSS
    // We'll work WITH the existing structure instead of against it
    cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, (match) => {
      // Keep all inline styles - the issue isn't the CSS, it's how we're inserting content
      return match;
    });

    // Remove tracking meta tags
    cleanHtml = cleanHtml.replace(/<meta[^>]*name="sentry-trace"[^>]*>/gi, '');
    cleanHtml = cleanHtml.replace(/<meta[^>]*name="baggage"[^>]*>/gi, '');

    // Remove noscript tracking pixels
    cleanHtml = cleanHtml.replace(/<noscript>[\s\S]*?(analytics|tracking|matomo|facebook|google)[\s\S]*?<\/noscript>/gi, '');

    console.log('Applied whitelist-based script and CSS filtering');
    return cleanHtml;
  }

  /**
   * Find and replace blog post content areas
   */
  private replaceContentAreas(html: string): string {
    let processedHtml = html;
    
    // First, try to find GenerateBlocks grid containers
    const gbContainerPattern = /<div[^>]*class="[^"]*gb-container[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    const gbMatches = processedHtml.match(gbContainerPattern);
    
    if (gbMatches && gbMatches.length > 0) {
      console.log(`Found ${gbMatches.length} GenerateBlocks containers`);
      // Log first match to see the structure
      console.log('First GB container structure:', gbMatches[0].substring(0, 300) + '...');
      
      // Replace the content inside the first GB container
      processedHtml = processedHtml.replace(gbContainerPattern, (match, content, offset) => {
        if (offset === processedHtml.search(gbContainerPattern)) {
          console.log('Replacing first GB container with placeholder');
          return match.replace(content, this.contentPlaceholder);
        }
        return match;
      });
      return processedHtml;
    }
    
    // Fallback: Look for generate-columns-container 
    const generateColumnsPattern = /<div[^>]*class="[^"]*generate-columns-container[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    const columnMatches = processedHtml.match(generateColumnsPattern);
    
    if (columnMatches && columnMatches.length > 0) {
      console.log(`Found ${columnMatches.length} matches for generate-columns-container pattern`);
      processedHtml = processedHtml.replace(generateColumnsPattern, `<div class="generate-columns-container">${this.contentPlaceholder}</div>`);
      return processedHtml;
    }
      
    // Final fallback: look for the site-main container
    const fallbackPattern = /<main[^>]*class="[^"]*site-main[^"]*"[^>]*>([\s\S]*?)<\/main>/gi;
    const fallbackMatches = processedHtml.match(fallbackPattern);
    
    if (fallbackMatches && fallbackMatches.length > 0) {
      console.log(`Found ${fallbackMatches.length} matches for fallback content pattern`);
      processedHtml = processedHtml.replace(fallbackPattern, `<main class="site-main" id="main">${this.contentPlaceholder}</main>`);
      return processedHtml;
    }
    
    console.log('No suitable content area found for replacement');
    return processedHtml;
  }

  /**
   * Replace WordPress CSS URLs with our CDN versions
   */
  private replaceCSSUrls(html: string): string {
    // Map WordPress CSS URLs to our CDN filenames
    const cssReplacements = [
      {
        original: /https:\/\/cruisemadeeasy\.com\/wp-includes\/css\/dist\/block-library\/style\.min\.css[^"']*/g,
        replacement: 'https://cdn.cruisemadeeasy.com/css/wp-block-library.min.css'
      },
      {
        original: /https:\/\/cruisemadeeasy\.com\/wp-content\/themes\/generatepress\/assets\/css\/main\.min\.css[^"']*/g,
        replacement: 'https://cdn.cruisemadeeasy.com/css/generatepress-main.min.css'
      },
      {
        original: /https:\/\/cruisemadeeasy\.com\/wp-content\/uploads\/generatepress\/style\.min\.css[^"']*/g,
        replacement: 'https://cdn.cruisemadeeasy.com/css/generatepress-style.min.css'
      },
      {
        original: /https:\/\/cruisemadeeasy\.com\/wp-content\/uploads\/font-awesome\/[^"']*\/css\/svg-with-js\.css[^"']*/g,
        replacement: 'https://cdn.cruisemadeeasy.com/css/font-awesome.min.css'
      },
      {
        original: /https:\/\/fonts\.googleapis\.com\/css\?family=Montserrat[^"']*/g,
        replacement: 'https://cdn.cruisemadeeasy.com/css/google-fonts-montserrat.css'
      }
    ];

    let processedHtml = html;
    for (const replacement of cssReplacements) {
      processedHtml = processedHtml.replace(replacement.original, replacement.replacement);
    }

    return processedHtml;
  }

  /**
   * Generate content hash for change detection
   */
  private async generateHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Save template to database
   */
  private async saveTemplate(template: WordPressTemplate, env: Env): Promise<void> {
    try {
      // Store template in database for caching
      await env.DB.prepare(`
        INSERT OR REPLACE INTO wp_templates (source_url, template_html, template_hash, last_scraped)
        VALUES (?, ?, ?, ?)
      `).bind(
        this.sourceUrl,
        template.full_html,
        template.template_hash,
        template.last_scraped
      ).run();
      
      console.log('WordPress template saved to database');
    } catch (error) {
      console.error('Error saving template to database:', error);
      // Don't throw - template can still be used even if caching fails
    }
  }

  /**
   * Get cached template from database
   */
  async getCachedTemplate(env: Env): Promise<WordPressTemplate | null> {
    try {
      const result = await env.DB.prepare(`
        SELECT template_html, template_hash, last_scraped 
        FROM wp_templates 
        WHERE source_url = ? 
        ORDER BY last_scraped DESC 
        LIMIT 1
      `).bind(this.sourceUrl).first() as any;

      if (!result) {
        return null;
      }

      return {
        full_html: result.template_html,
        content_placeholder: this.contentPlaceholder,
        last_scraped: result.last_scraped,
        template_hash: result.template_hash
      };
    } catch (error) {
      console.error('Error fetching cached template:', error);
      return null;
    }
  }

  /**
   * Get template with caching only (no auto-refresh)
   */
  async getTemplate(env: Env): Promise<WordPressTemplate> {
    // Try to get cached template first
    const cached = await this.getCachedTemplate(env);
    
    if (cached) {
      console.log('Using cached WordPress template');
      return cached;
    }

    console.log('No cached template found, fetching fresh WordPress template');
    return await this.scrapeTemplate(env);
  }

  /**
   * Force refresh template (for admin use)
   */
  async refreshTemplate(env: Env): Promise<WordPressTemplate> {
    console.log('Force refreshing WordPress template');
    return await this.scrapeTemplate(env);
  }

  /**
   * Render content using the WordPress template
   */
  renderWithTemplate(template: WordPressTemplate, dynamicContent: string): string {
    return template.full_html.replace(template.content_placeholder, dynamicContent);
  }
}

// Export default instance
export const wpTemplateScraper = new WordPressTemplateScraper();