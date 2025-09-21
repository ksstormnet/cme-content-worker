/**
 * WordPress REST API Utility Functions
 * Session 1: WordPress REST API Discovery & Authentication
 * 
 * Provides secure authentication, rate limiting, and error handling
 * for WordPress REST API interactions with cruisemadeeasy.com
 */

interface WordPressConfig {
  url: string;
  api_base: string;
  credentials: {
    username: string;
    password: string;
  };
  access_level: string;
}

interface RateLimitConfig {
  requests_per_second: number;
  max_concurrent: number;
  retry_attempts: number;
  backoff_multiplier: number;
}

interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
  headers?: Record<string, string>;
}

interface EndpointInfo {
  namespace: string;
  routes: Record<string, any>;
  methods: string[];
  description?: string;
}

export class WordPressAPI {
  private config: WordPressConfig;
  private rateLimit: RateLimitConfig;
  private authHeader: string;
  private requestQueue: Array<() => Promise<any>> = [];
  private activeRequests = 0;
  private lastRequestTime = 0;

  constructor(config: WordPressConfig, rateLimit: RateLimitConfig) {
    this.config = config;
    this.rateLimit = rateLimit;
    this.authHeader = 'Basic ' + btoa(`${config.credentials.username}:${config.credentials.password}`);
  }

  /**
   * Create WordPress API instance from config file
   */
  static async fromConfig(): Promise<WordPressAPI> {
    try {
      // In a real implementation, this would read from the config file
      // For now, we'll use the values directly
      const config: WordPressConfig = {
        url: "https://cruisemadeeasy.com",
        api_base: "https://cruisemadeeasy.com/wp-json",
        credentials: {
          username: "support-team",
          password: "TMIi 8E5g NPxn 9B7F y4T0 L86q"
        },
        access_level: "admin"
      };

      const rateLimit: RateLimitConfig = {
        requests_per_second: 2.5,
        max_concurrent: 3,
        retry_attempts: 3,
        backoff_multiplier: 2
      };

      return new WordPressAPI(config, rateLimit);
    } catch (error) {
      throw new Error(`Failed to load WordPress API configuration: ${error}`);
    }
  }

  /**
   * Test WordPress connection and authentication
   */
  async testConnection(): Promise<APIResponse<any>> {
    try {
      console.log('Testing WordPress API connection...');
      const response = await this.makeRequest('/');
      
      
      if (response.success && response.data) {
        console.log('✅ WordPress API connection successful');
        return {
          success: true,
          data: {
            site_name: response.data.name || 'Unknown Site',
            description: response.data.description || '',
            url: response.data.url || '',
            namespaces: response.data.namespaces || [],
            authentication: 'verified'
          }
        };
      } else {
        return {
          success: false,
          error: `Connection test failed: success=${response.success}, hasData=${!!response.data}, error=${response.error}`
        };
      }
    } catch (error) {
      console.error('❌ WordPress API connection failed:', error);
      return {
        success: false,
        error: `Connection test failed: ${error}`
      };
    }
  }

  /**
   * Discover all available WordPress REST API endpoints
   */
  async discoverEndpoints(): Promise<APIResponse<Record<string, EndpointInfo>>> {
    try {
      console.log('Discovering WordPress API endpoints...');
      const response = await this.makeRequest('/');
      
      if (!response.success || !response.data) {
        return {
          success: false,
          error: 'Failed to fetch endpoint discovery data'
        };
      }

      const namespaces = response.data.namespaces || [];
      const routes = response.data.routes || {};
      const endpointMap: Record<string, EndpointInfo> = {};

      // Process each namespace
      for (const namespace of namespaces) {
        endpointMap[namespace] = {
          namespace,
          routes: {},
          methods: [],
          description: `Endpoints for ${namespace}`
        };

        // Find routes belonging to this namespace
        for (const [route, routeInfo] of Object.entries(routes)) {
          if (route.startsWith(`/${namespace}/`)) {
            endpointMap[namespace].routes[route] = routeInfo;
            
            // Extract unique methods
            const methods = (routeInfo as any)?.methods || [];
            for (const method of methods) {
              if (!endpointMap[namespace].methods.includes(method)) {
                endpointMap[namespace].methods.push(method);
              }
            }
          }
        }
      }

      console.log(`✅ Discovered ${namespaces.length} namespaces with ${Object.keys(routes).length} routes`);
      
      return {
        success: true,
        data: endpointMap
      };
    } catch (error) {
      console.error('❌ Endpoint discovery failed:', error);
      return {
        success: false,
        error: `Endpoint discovery failed: ${error}`
      };
    }
  }

  /**
   * Get GeneratePress/GenerateBlocks specific endpoints
   */
  async getGenerateEndpoints(): Promise<APIResponse<any>> {
    try {
      console.log('Searching for GeneratePress/GenerateBlocks endpoints...');
      const endpointsResponse = await this.discoverEndpoints();
      
      if (!endpointsResponse.success || !endpointsResponse.data) {
        return {
          success: false,
          error: 'Failed to discover endpoints for Generate analysis'
        };
      }

      const generateEndpoints = {
        generatepress: {},
        generateblocks: {},
        related_themes: {},
        custom_post_types: {}
      };

      // Search for Generate-related namespaces and endpoints
      for (const [namespace, info] of Object.entries(endpointsResponse.data)) {
        if (namespace.toLowerCase().includes('generate')) {
          if (namespace.toLowerCase().includes('blocks')) {
            generateEndpoints.generateblocks = { [namespace]: info };
          } else if (namespace.toLowerCase().includes('press')) {
            generateEndpoints.generatepress = { [namespace]: info };
          } else {
            generateEndpoints.related_themes = { [namespace]: info };
          }
        }

        // Check routes for Generate-related content
        for (const [route, routeInfo] of Object.entries(info.routes)) {
          const routeLower = route.toLowerCase();
          if (routeLower.includes('generate') || 
              routeLower.includes('theme') || 
              routeLower.includes('customizer')) {
            if (!generateEndpoints.custom_post_types[namespace]) {
              generateEndpoints.custom_post_types[namespace] = {};
            }
            generateEndpoints.custom_post_types[namespace][route] = routeInfo;
          }
        }
      }

      // Test GenerateBlocks specific endpoint if it exists
      const generateblocksTest = await this.makeRequest('/wp-json/generateblocks/v1/');
      if (generateblocksTest.success) {
        generateEndpoints.generateblocks['test_result'] = generateblocksTest.data;
      }

      console.log('✅ GeneratePress/GenerateBlocks endpoint analysis complete');
      
      return {
        success: true,
        data: generateEndpoints
      };
    } catch (error) {
      console.error('❌ Generate endpoints analysis failed:', error);
      return {
        success: false,
        error: `Generate endpoints analysis failed: ${error}`
      };
    }
  }

  /**
   * Test multiple endpoints to verify access levels
   */
  async validateEndpointAccess(endpoints: string[]): Promise<APIResponse<Record<string, any>>> {
    try {
      console.log(`Validating access to ${endpoints.length} endpoints...`);
      const results: Record<string, any> = {};

      for (const endpoint of endpoints) {
        try {
          const response = await this.makeRequest(endpoint);
          results[endpoint] = {
            accessible: response.success,
            status: response.status,
            error: response.error || null,
            data_preview: response.success && response.data ? 
              Object.keys(response.data).slice(0, 5) : null
          };
        } catch (error) {
          results[endpoint] = {
            accessible: false,
            error: `${error}`,
            status: null,
            data_preview: null
          };
        }

        // Rate limiting between endpoint tests
        await this.sleep(500);
      }

      const accessibleCount = Object.values(results).filter(r => r.accessible).length;
      console.log(`✅ Endpoint validation complete: ${accessibleCount}/${endpoints.length} accessible`);

      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error('❌ Endpoint validation failed:', error);
      return {
        success: false,
        error: `Endpoint validation failed: ${error}`
      };
    }
  }

  /**
   * Make rate-limited authenticated request to WordPress API
   */
  async makeRequest(endpoint: string, options: RequestInit = {}): Promise<APIResponse> {
    return new Promise((resolve) => {
      this.requestQueue.push(async () => {
        try {
          await this.enforceRateLimit();

          const url = endpoint.startsWith('http') ? endpoint : `${this.config.api_base}${endpoint}`;
          
          const response = await fetch(url, {
            ...options,
            headers: {
              'Authorization': this.authHeader,
              'User-Agent': 'CME-Content-Worker/1.0 (WordPress Component Export)',
              'Accept': 'application/json',
              ...options.headers,
            },
          });

          const responseHeaders: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
          });

          if (response.ok) {
            const data = await response.json();
            resolve({
              success: true,
              data,
              status: response.status,
              headers: responseHeaders
            });
          } else {
            const errorText = await response.text();
            resolve({
              success: false,
              error: `HTTP ${response.status}: ${errorText}`,
              status: response.status,
              headers: responseHeaders
            });
          }
        } catch (error) {
          resolve({
            success: false,
            error: `Request failed: ${error}`,
            status: 0
          });
        } finally {
          this.activeRequests--;
          this.processQueue();
        }
      });

      this.processQueue();
    });
  }

  /**
   * Process queued requests with concurrency limits
   */
  private processQueue() {
    if (this.requestQueue.length > 0 && this.activeRequests < this.rateLimit.max_concurrent) {
      const request = this.requestQueue.shift();
      if (request) {
        this.activeRequests++;
        request();
      }
    }
  }

  /**
   * Enforce rate limiting between requests
   */
  private async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 1000 / this.rateLimit.requests_per_second;

    if (timeSinceLastRequest < minInterval) {
      await this.sleep(minInterval - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Sleep utility for rate limiting and delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get API configuration information
   */
  getConfig(): WordPressConfig {
    return { ...this.config };
  }

  /**
   * Get rate limiting configuration
   */
  getRateLimitConfig(): RateLimitConfig {
    return { ...this.rateLimit };
  }
}

/**
 * Export convenience function for quick API access
 */
export async function createWordPressAPI(): Promise<WordPressAPI> {
  return await WordPressAPI.fromConfig();
}

/**
 * Export types for external use
 */
export type { WordPressConfig, RateLimitConfig, APIResponse, EndpointInfo };