/**
 * WordPress CSS Extractor
 * Extracts GenerateBlocks and other CSS styles from published WordPress pages
 */

export interface ExtractedElementStyles {
  elementId: string;
  cssRules: string[];
  mediaQueries: Record<string, string[]>;
  cssVariables?: Record<string, string>;
}

export interface PageCSSData {
  url: string;
  elementStyles: ExtractedElementStyles[];
  globalCSSVariables: Record<string, string>;
  extractedAt: string;
}

/**
 * CSS Extractor for WordPress GenerateBlocks elements
 */
export class WordPressCSSExtractor {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://cruisemadeeasy.com') {
    this.baseUrl = baseUrl;
  }

  /**
   * Extract CSS styles from a WordPress page
   */
  async extractPageCSS(pageUrl: string): Promise<PageCSSData | null> {
    try {
      const response = await fetch(pageUrl);
      
      if (!response.ok) {
        console.warn(`Failed to fetch page: ${pageUrl} (${response.status})`);
        return null;
      }
      
      const html = await response.text();
      return this.parseHTMLForCSS(pageUrl, html);
    } catch (error) {
      console.error(`Error extracting CSS from ${pageUrl}:`, error);
      return null;
    }
  }

  /**
   * Parse HTML content for CSS styles
   */
  private parseHTMLForCSS(url: string, html: string): PageCSSData {
    const elementStyles: ExtractedElementStyles[] = [];
    const globalCSSVariables: Record<string, string> = {};

    // Extract all GenerateBlocks element IDs from the HTML
    const elementIds = this.extractGenerateBlocksElementIds(html);
    
    // Extract CSS content from style tags and linked stylesheets
    const cssContent = this.extractCSSContent(html);
    
    // Extract global CSS variables
    const globalVars = this.extractCSSVariables(cssContent);
    Object.assign(globalCSSVariables, globalVars);
    
    // For each GenerateBlocks element, extract its CSS rules
    for (const elementId of elementIds) {
      const elementClass = `gb-element-${elementId}`;
      const styles = this.extractElementCSS(cssContent, elementClass);
      
      if (styles.cssRules.length > 0 || Object.keys(styles.mediaQueries).length > 0) {
        elementStyles.push({
          elementId,
          ...styles
        });
      }
    }
    
    return {
      url,
      elementStyles,
      globalCSSVariables,
      extractedAt: new Date().toISOString()
    };
  }

  /**
   * Extract GenerateBlocks element IDs from HTML
   */
  private extractGenerateBlocksElementIds(html: string): string[] {
    const elementIds: string[] = [];
    const regex = /gb-element-([a-f0-9]+)/g;
    let match;
    
    while ((match = regex.exec(html)) !== null) {
      const elementId = match[1];
      if (!elementIds.includes(elementId)) {
        elementIds.push(elementId);
      }
    }
    
    return elementIds;
  }

  /**
   * Extract CSS content from HTML (style tags and inline styles)
   */
  private extractCSSContent(html: string): string {
    let cssContent = '';
    
    // Extract from style tags
    const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let match;
    
    while ((match = styleTagRegex.exec(html)) !== null) {
      cssContent += match[1] + '\n';
    }
    
    // Could also extract from linked stylesheets, but for now focus on inline styles
    // which is where GenerateBlocks usually puts its custom CSS
    
    return cssContent;
  }

  /**
   * Extract CSS variables (custom properties) from CSS content
   */
  private extractCSSVariables(cssContent: string): Record<string, string> {
    const variables: Record<string, string> = {};
    
    // Match CSS variables like --variable-name: value;
    const variableRegex = /--([a-zA-Z0-9-_]+):\s*([^;]+);/g;
    let match;
    
    while ((match = variableRegex.exec(cssContent)) !== null) {
      const varName = match[1];
      const varValue = match[2].trim();
      variables[varName] = varValue;
    }
    
    return variables;
  }

  /**
   * Extract CSS rules for a specific element class
   */
  private extractElementCSS(cssContent: string, elementClass: string): {
    cssRules: string[];
    mediaQueries: Record<string, string[]>;
    cssVariables?: Record<string, string>;
  } {
    const cssRules: string[] = [];
    const mediaQueries: Record<string, string[]> = {};
    const cssVariables: Record<string, string> = {};

    // Escape special characters in class name for regex
    const escapedClass = elementClass.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    
    // Match CSS rules for this specific element
    // Pattern: .gb-element-id { rules }
    const classRuleRegex = new RegExp(`\\.${escapedClass}\\s*{([^}]+)}`, 'gi');
    let match;
    
    while ((match = classRuleRegex.exec(cssContent)) !== null) {
      const rules = match[1].trim();
      if (rules) {
        cssRules.push(rules);
        
        // Extract any CSS variables from this rule
        const vars = this.extractCSSVariables(rules);
        Object.assign(cssVariables, vars);
      }
    }
    
    // Extract media queries that contain this element
    const mediaQueryRegex = /@media\s*([^{]+)\s*{([^{}]*(?:{[^}]*}[^{}]*)*)}/gi;
    let mediaMatch;
    
    while ((mediaMatch = mediaQueryRegex.exec(cssContent)) !== null) {
      const mediaCondition = mediaMatch[1].trim();
      const mediaContent = mediaMatch[2];
      
      // Check if this media query contains our element
      const elementInMedia = new RegExp(`\\.${escapedClass}\\s*{([^}]+)}`, 'gi');
      let elementMatch;
      
      while ((elementMatch = elementInMedia.exec(mediaContent)) !== null) {
        if (!mediaQueries[mediaCondition]) {
          mediaQueries[mediaCondition] = [];
        }
        mediaQueries[mediaCondition].push(elementMatch[1].trim());
      }
    }
    
    return {
      cssRules,
      mediaQueries,
      cssVariables: Object.keys(cssVariables).length > 0 ? cssVariables : undefined
    };
  }

  /**
   * Convert extracted styles to CSS string
   */
  generateCSSFromExtractedStyles(styles: ExtractedElementStyles): string {
    const css: string[] = [];
    
    // Add base rules
    if (styles.cssRules.length > 0) {
      css.push(`.gb-element-${styles.elementId} {`);
      css.push('  ' + styles.cssRules.join('\n  '));
      css.push('}');
    }
    
    // Add media query rules
    for (const [mediaCondition, rules] of Object.entries(styles.mediaQueries)) {
      css.push(`@media ${mediaCondition} {`);
      css.push(`  .gb-element-${styles.elementId} {`);
      css.push('    ' + rules.join('\n    '));
      css.push('  }');
      css.push('}');
    }
    
    return css.join('\n');
  }

  /**
   * Extract CSS for multiple posts in batch
   */
  async extractMultiplePages(pageUrls: string[]): Promise<PageCSSData[]> {
    const results: PageCSSData[] = [];
    
    // Process in batches to avoid overwhelming the server
    const batchSize = 3;
    for (let i = 0; i < pageUrls.length; i += batchSize) {
      const batch = pageUrls.slice(i, i + batchSize);
      const batchPromises = batch.map(url => this.extractPageCSS(url));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults.filter(result => result !== null));
      
      // Add delay between batches to be respectful
      if (i + batchSize < pageUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return results;
  }

  /**
   * Consolidate styles from multiple pages into a master CSS
   */
  consolidateStyles(pageCSSData: PageCSSData[]): {
    consolidatedCSS: string;
    elementRegistry: Record<string, ExtractedElementStyles>;
    globalVariables: Record<string, string>;
  } {
    const elementRegistry: Record<string, ExtractedElementStyles> = {};
    const globalVariables: Record<string, string> = {};
    const cssRules: string[] = [];

    // Merge global variables from all pages
    for (const pageData of pageCSSData) {
      Object.assign(globalVariables, pageData.globalCSSVariables);
    }

    // Consolidate element styles
    for (const pageData of pageCSSData) {
      for (const elementStyle of pageData.elementStyles) {
        const elementId = elementStyle.elementId;
        
        if (!elementRegistry[elementId]) {
          elementRegistry[elementId] = elementStyle;
        } else {
          // Merge styles if element appears on multiple pages
          elementRegistry[elementId].cssRules.push(...elementStyle.cssRules);
          Object.assign(elementRegistry[elementId].mediaQueries, elementStyle.mediaQueries);
          if (elementStyle.cssVariables) {
            elementRegistry[elementId].cssVariables = {
              ...elementRegistry[elementId].cssVariables,
              ...elementStyle.cssVariables
            };
          }
        }
      }
    }

    // Generate consolidated CSS
    if (Object.keys(globalVariables).length > 0) {
      cssRules.push(':root {');
      for (const [varName, varValue] of Object.entries(globalVariables)) {
        cssRules.push(`  --${varName}: ${varValue};`);
      }
      cssRules.push('}');
      cssRules.push('');
    }

    // Add element styles
    for (const elementStyle of Object.values(elementRegistry)) {
      const elementCSS = this.generateCSSFromExtractedStyles(elementStyle);
      if (elementCSS) {
        cssRules.push(elementCSS);
        cssRules.push('');
      }
    }

    return {
      consolidatedCSS: cssRules.join('\n'),
      elementRegistry,
      globalVariables
    };
  }
}

/**
 * Database storage for extracted CSS
 */
export class GenerateBlocksCSSStorage {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Store extracted element styles
   */
  async storeElementStyles(styles: ExtractedElementStyles): Promise<void> {
    const query = `
      INSERT OR REPLACE INTO generateblocks_elements 
      (element_id, element_type, configuration, styles, updated_at) 
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    const cssString = this.convertStylesToCSS(styles);
    const configuration = {
      cssRules: styles.cssRules,
      mediaQueries: styles.mediaQueries,
      cssVariables: styles.cssVariables
    };
    
    await this.db.prepare(query).bind(
      styles.elementId,
      'css_extracted',
      JSON.stringify(configuration),
      cssString
    ).run();
  }

  /**
   * Store multiple element styles in batch
   */
  async storeMultipleStyles(stylesArray: ExtractedElementStyles[]): Promise<void> {
    for (const styles of stylesArray) {
      await this.storeElementStyles(styles);
    }
  }

  /**
   * Convert ExtractedElementStyles to CSS string
   */
  private convertStylesToCSS(styles: ExtractedElementStyles): string {
    const extractor = new WordPressCSSExtractor();
    return extractor.generateCSSFromExtractedStyles(styles);
  }

  /**
   * Get stored element styles
   */
  async getElementStyles(elementId: string): Promise<ExtractedElementStyles | null> {
    const query = `
      SELECT element_id, configuration, styles
      FROM generateblocks_elements 
      WHERE element_id = ?
    `;
    
    const result = await this.db.prepare(query).bind(elementId).first();
    
    if (!result) return null;
    
    const configuration = JSON.parse(result.configuration as string);
    
    return {
      elementId: result.element_id as string,
      cssRules: configuration.cssRules || [],
      mediaQueries: configuration.mediaQueries || {},
      cssVariables: configuration.cssVariables
    };
  }
}