/**
 * WordPress GenerateBlocks Configuration Fetcher
 * Handles authenticated requests to retrieve GenerateBlocks element configurations
 */

export interface GenerateBlocksConfig {
  element_id: string;
  element_type: string;
  configuration: any;
  styles?: string;
}

export interface WordPressAuth {
  username?: string;
  password?: string;
  application_password?: string;
  jwt_token?: string;
  cookie?: string;
}

/**
 * WordPress API client for GenerateBlocks data
 */
export class WordPressGenerateBlocksClient {
  private baseUrl: string;
  private auth: WordPressAuth;

  constructor(baseUrl: string = 'https://cruisemadeeasy.com', auth: WordPressAuth) {
    this.baseUrl = baseUrl;
    this.auth = auth;
  }

  /**
   * Get authentication headers for WordPress REST API
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.auth.jwt_token) {
      headers['Authorization'] = `Bearer ${this.auth.jwt_token}`;
    } else if (this.auth.username && this.auth.application_password) {
      // WordPress Application Passwords (recommended for REST API)
      const credentials = btoa(`${this.auth.username}:${this.auth.application_password}`);
      headers['Authorization'] = `Basic ${credentials}`;
    } else if (this.auth.cookie) {
      headers['Cookie'] = this.auth.cookie;
    }

    return headers;
  }

  /**
   * Fetch GenerateBlocks element configuration by ID
   * Uses the WordPress REST API with authentication
   */
  async fetchElementConfig(elementId: string): Promise<GenerateBlocksConfig | null> {
    try {
      const url = `${this.baseUrl}/wp-json/generateblocks/v1/elements/${elementId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        console.warn(`Failed to fetch GenerateBlocks config for ${elementId}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      return {
        element_id: elementId,
        element_type: data.type || 'unknown',
        configuration: data.attributes || data.settings || data,
        styles: this.generateCSSFromConfig(data.attributes || data.settings || data)
      };
    } catch (error) {
      console.error(`Error fetching GenerateBlocks config for ${elementId}:`, error);
      return null;
    }
  }

  /**
   * Fetch multiple GenerateBlocks elements in batch
   */
  async fetchElementConfigs(elementIds: string[]): Promise<GenerateBlocksConfig[]> {
    const configs: GenerateBlocksConfig[] = [];
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < elementIds.length; i += batchSize) {
      const batch = elementIds.slice(i, i + batchSize);
      const batchPromises = batch.map(id => this.fetchElementConfig(id));
      const batchResults = await Promise.all(batchPromises);
      
      configs.push(...batchResults.filter(config => config !== null));
      
      // Add delay between batches to be respectful
      if (i + batchSize < elementIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return configs;
  }

  /**
   * Extract GenerateBlocks element IDs from HTML content
   */
  extractElementIds(htmlContent: string): string[] {
    const elementIds: string[] = [];
    const regex = /gb-element-([a-f0-9]+)/g;
    let match;
    
    while ((match = regex.exec(htmlContent)) !== null) {
      const elementId = match[1];
      if (!elementIds.includes(elementId)) {
        elementIds.push(elementId);
      }
    }
    
    return elementIds;
  }

  /**
   * Generate CSS from GenerateBlocks configuration
   * This is a simplified version - real implementation would be more complex
   */
  private generateCSSFromConfig(config: any): string {
    if (!config) return '';
    
    const css: string[] = [];
    
    // Handle common GenerateBlocks properties
    if (config.backgroundColor) {
      css.push(`background-color: ${config.backgroundColor};`);
    }
    
    if (config.textColor) {
      css.push(`color: ${config.textColor};`);
    }
    
    if (config.padding) {
      if (typeof config.padding === 'object') {
        if (config.padding.top) css.push(`padding-top: ${config.padding.top}px;`);
        if (config.padding.right) css.push(`padding-right: ${config.padding.right}px;`);
        if (config.padding.bottom) css.push(`padding-bottom: ${config.padding.bottom}px;`);
        if (config.padding.left) css.push(`padding-left: ${config.padding.left}px;`);
      } else {
        css.push(`padding: ${config.padding}px;`);
      }
    }
    
    if (config.margin) {
      if (typeof config.margin === 'object') {
        if (config.margin.top) css.push(`margin-top: ${config.margin.top}px;`);
        if (config.margin.right) css.push(`margin-right: ${config.margin.right}px;`);
        if (config.margin.bottom) css.push(`margin-bottom: ${config.margin.bottom}px;`);
        if (config.margin.left) css.push(`margin-left: ${config.margin.left}px;`);
      } else {
        css.push(`margin: ${config.margin}px;`);
      }
    }
    
    if (config.borderRadius) {
      css.push(`border-radius: ${config.borderRadius}px;`);
    }
    
    if (config.fontSize) {
      css.push(`font-size: ${config.fontSize}px;`);
    }
    
    if (config.fontWeight) {
      css.push(`font-weight: ${config.fontWeight};`);
    }
    
    if (config.display) {
      css.push(`display: ${config.display};`);
    }
    
    if (config.flexDirection) {
      css.push(`flex-direction: ${config.flexDirection};`);
    }
    
    if (config.alignItems) {
      css.push(`align-items: ${config.alignItems};`);
    }
    
    if (config.justifyContent) {
      css.push(`justify-content: ${config.justifyContent};`);
    }
    
    return css.join(' ');
  }

  /**
   * Test WordPress API connection and authentication
   */
  async testConnection(): Promise<boolean> {
    try {
      // Test with a simple authenticated endpoint
      const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/users/me`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      if (response.ok) {
        const user = await response.json();
        console.log(`WordPress API authentication successful as: ${user.name} (${user.roles?.[0] || 'no role'})`);
        return true;
      } else {
        console.warn(`WordPress API authentication failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('WordPress API connection test failed:', error);
      return false;
    }
  }

  /**
   * Check if GenerateBlocks REST API is available
   */
  async checkGenerateBlocksAPI(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/wp-json/generateblocks/v1`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      return response.ok;
    } catch (error) {
      console.error('GenerateBlocks API check failed:', error);
      return false;
    }
  }
}

/**
 * Database storage functions for GenerateBlocks configurations
 */
export class GenerateBlocksStorage {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Store GenerateBlocks configuration in database
   */
  async storeConfig(config: GenerateBlocksConfig): Promise<void> {
    const query = `
      INSERT OR REPLACE INTO generateblocks_elements 
      (element_id, element_type, configuration, styles, updated_at) 
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    await this.db.prepare(query).bind(
      config.element_id,
      config.element_type,
      JSON.stringify(config.configuration),
      config.styles
    ).run();
  }

  /**
   * Store multiple configurations in batch
   */
  async storeConfigs(configs: GenerateBlocksConfig[]): Promise<void> {
    for (const config of configs) {
      await this.storeConfig(config);
    }
  }

  /**
   * Retrieve GenerateBlocks configuration from database
   */
  async getConfig(elementId: string): Promise<GenerateBlocksConfig | null> {
    const query = `
      SELECT element_id, element_type, configuration, styles
      FROM generateblocks_elements 
      WHERE element_id = ?
    `;
    
    const result = await this.db.prepare(query).bind(elementId).first();
    
    if (!result) return null;
    
    return {
      element_id: result.element_id as string,
      element_type: result.element_type as string,
      configuration: JSON.parse(result.configuration as string),
      styles: result.styles as string,
    };
  }

  /**
   * Get configurations for multiple element IDs
   */
  async getConfigs(elementIds: string[]): Promise<GenerateBlocksConfig[]> {
    if (elementIds.length === 0) return [];
    
    const placeholders = elementIds.map(() => '?').join(',');
    const query = `
      SELECT element_id, element_type, configuration, styles
      FROM generateblocks_elements 
      WHERE element_id IN (${placeholders})
    `;
    
    const results = await this.db.prepare(query).bind(...elementIds).all();
    
    return results.results.map(row => ({
      element_id: row.element_id as string,
      element_type: row.element_type as string,
      configuration: JSON.parse(row.configuration as string),
      styles: row.styles as string,
    }));
  }

  /**
   * Check if configuration exists for element ID
   */
  async hasConfig(elementId: string): Promise<boolean> {
    const query = `SELECT 1 FROM generateblocks_elements WHERE element_id = ?`;
    const result = await this.db.prepare(query).bind(elementId).first();
    return result !== null;
  }
}