import { Hono } from "hono";
import { Env } from "../../types/database";

export const cssSyncRoutes = new Hono<{ Bindings: Env }>();

/**
 * CSS Sync Route - Monitors configured URLs and stores CSS in R2
 * Implements automatic CSS scraping and CDN serving functionality
 */

interface CSSVersion {
  id: number;
  file_url: string;
  file_hash: string;
  cdn_filename: string;
  content: string;
  detected_at: string;
  active: boolean;
}

interface CSSSettings {
  site_css_urls: string[];
  css_sync_enabled: boolean;
}

/**
 * Get CSS settings from database
 */
async function getCSSSettings(env: Env): Promise<CSSSettings> {
  try {
    const cssUrlResult = await env.DB.prepare(
      "SELECT value FROM settings WHERE key = ?"
    ).bind("site_css_urls").first();
    
    const syncEnabledResult = await env.DB.prepare(
      "SELECT value FROM settings WHERE key = ?"
    ).bind("css_sync_enabled").first();

    let cssUrls = [];
    try {
      cssUrls = cssUrlResult?.value ? JSON.parse(cssUrlResult.value as string) : [];
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
 * Generate hash for CSS content to detect changes
 */
async function generateHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate meaningful CDN filename from WordPress CSS URL
 */
function generateCDNFilename(url: string): string {
  try {
    // Handle manual uploads
    if (url.startsWith('manual://')) {
      const filename = url.replace('manual://', '');
      return filename;
    }
    
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // WordPress core block library
    if (pathname.includes('wp-includes/css/dist/block-library/style.min.css')) {
      return 'wp-block-library.min.css';
    }
    
    // Font Awesome
    if (pathname.includes('font-awesome') && pathname.includes('svg-with-js.css')) {
      return 'font-awesome.min.css';
    }
    
    // GeneratePress theme main CSS
    if (pathname.includes('wp-content/themes/generatepress/assets/css/main.min.css')) {
      return 'generatepress-main.min.css';
    }
    
    // GeneratePress customizations
    if (pathname.includes('wp-content/uploads/generatepress/style.min.css')) {
      return 'generatepress-style.min.css';
    }
    
    // Google Fonts
    if (urlObj.hostname === 'fonts.googleapis.com') {
      return 'google-fonts-montserrat.css';
    }
    
    // GeneratePress Premium plugins
    if (pathname.includes('gp-premium/blog/functions/css/columns.min.css')) {
      return 'gp-premium-columns.min.css';
    }
    
    if (pathname.includes('gp-premium/menu-plus/functions/css/offside.min.css')) {
      return 'gp-premium-offside.min.css';
    }
    
    if (pathname.includes('gp-premium/menu-plus/functions/css/navigation-branding-flex.min.css')) {
      return 'gp-premium-navigation.min.css';
    }
    
    // CME Personas plugin
    if (pathname.includes('cme-personas/public/css/personas-frontend.css')) {
      return 'cme-personas.min.css';
    }
    
    // GHL Wizard plugin
    if (pathname.includes('ghl-wizard/css/styles.css')) {
      return 'ghl-wizard.min.css';
    }
    
    // Fallback: create filename from the last part of the URL
    const filename = pathname.split('/').pop() || 'unknown.css';
    const baseName = filename.replace(/\.css$/, '').replace(/\.min$/, '');
    return `${baseName}.min.css`;
    
  } catch (error) {
    // Fallback for invalid URLs
    return 'unknown.min.css';
  }
}

/**
 * Check if CSS has changed by comparing hash and R2 existence
 */
async function hasChanged(url: string, newHash: string, env: Env): Promise<boolean> {
  try {
    const currentVersion = await env.DB.prepare(
      "SELECT file_hash, cdn_filename FROM css_versions WHERE file_url = ? AND active = 1"
    ).bind(url).first() as CSSVersion | null;

    // If no database record, definitely changed
    if (!currentVersion || currentVersion.file_hash !== newHash) {
      return true;
    }

    // Even if hash matches, check if R2 file actually exists
    const r2Path = `css/${currentVersion.cdn_filename}`;
    const r2Object = await env.IMAGES.get(r2Path);
    
    // Force update if R2 file doesn't exist
    return !r2Object;
    
  } catch (error) {
    console.error("Error checking CSS changes:", error);
    return true; // Assume changed if can't check
  }
}

/**
 * Store CSS content in R2 bucket with meaningful filename
 */
async function storeCSSInR2(url: string, content: string, hash: string, env: Env): Promise<string> {
  const cdnFilename = generateCDNFilename(url);
  const r2Path = `css/${cdnFilename}`;
  
  try {
    await env.IMAGES.put(r2Path, content, {
      httpMetadata: {
        contentType: 'text/css',
        cacheControl: 'public, max-age=86400', // 24 hours
      },
      customMetadata: {
        'source-url': url,
        'content-hash': hash,
        'generated-at': new Date().toISOString()
      }
    });

    return cdnFilename; // Return just the filename, not the full path
  } catch (error) {
    console.error("Error storing CSS in R2:", error);
    throw new Error(`Failed to store CSS in R2: ${error}`);
  }
}

/**
 * Update CSS version tracking in database
 */
async function updateCSSVersion(url: string, hash: string, content: string, cdnFilename: string, env: Env): Promise<void> {
  try {
    // Mark previous versions as inactive
    await env.DB.prepare(
      "UPDATE css_versions SET active = 0 WHERE file_url = ?"
    ).bind(url).run();

    // Insert new version
    await env.DB.prepare(`
      INSERT INTO css_versions (file_url, file_hash, cdn_filename, content, detected_at, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).bind(url, hash, cdnFilename, content.slice(0, 10000), new Date().toISOString()).run(); // Store first 10KB for reference

  } catch (error) {
    console.error("Error updating CSS version:", error);
    throw error;
  }
}

/**
 * Fetch CSS from external URL with proper error handling
 */
async function fetchCSS(url: string): Promise<{ content: string; success: boolean; error?: string }> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'CME-Content-Worker/1.0 (CSS Sync)',
        'Accept': 'text/css,text/plain,*/*'
      }
    });

    if (!response.ok) {
      return {
        content: '',
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const content = await response.text();
    return {
      content,
      success: true
    };
  } catch (error) {
    return {
      content: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown fetch error'
    };
  }
}

/**
 * Sync CSS endpoint - fetches, stores, and updates CSS files
 * GET /api/css/sync
 */
cssSyncRoutes.get("/sync", async (c) => {
  try {
    const settings = await getCSSSettings(c.env);
    
    if (!settings.css_sync_enabled) {
      return c.json({
        status: 'disabled',
        message: 'CSS sync is disabled in settings'
      });
    }

    if (settings.site_css_urls.length === 0) {
      return c.json({
        status: 'error',
        message: 'No CSS URLs configured in settings'
      });
    }

    const results = [];

    for (const url of settings.site_css_urls) {
      console.log(`Syncing CSS from: ${url}`);
      
      const fetchResult = await fetchCSS(url);
      
      if (!fetchResult.success) {
        results.push({
          url,
          status: 'error',
          error: fetchResult.error
        });
        continue;
      }

      const hash = await generateHash(fetchResult.content);
      const changed = await hasChanged(url, hash, c.env);

      if (!changed) {
        results.push({
          url,
          status: 'unchanged',
          hash
        });
        continue;
      }

      try {
        const cdnFilename = await storeCSSInR2(url, fetchResult.content, hash, c.env);
        await updateCSSVersion(url, hash, fetchResult.content, cdnFilename, c.env);

        results.push({
          url,
          status: 'updated',
          hash,
          cdn_filename: cdnFilename,
          size: fetchResult.content.length
        });
      } catch (error) {
        results.push({
          url,
          status: 'error',
          error: error instanceof Error ? error.message : 'Storage error'
        });
      }
    }

    const successCount = results.filter(r => r.status === 'updated' || r.status === 'unchanged').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return c.json({
      status: 'completed',
      summary: {
        total: settings.site_css_urls.length,
        updated: results.filter(r => r.status === 'updated').length,
        unchanged: results.filter(r => r.status === 'unchanged').length,
        errors: errorCount
      },
      results,
      sync_time: new Date().toISOString()
    });

  } catch (error) {
    console.error("CSS sync error:", error);
    return c.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown sync error'
    }, 500);
  }
});

/**
 * CSS Status endpoint - returns sync status and CSS file information
 * GET /api/css/status
 */
cssSyncRoutes.get("/status", async (c) => {
  try {
    const settings = await getCSSSettings(c.env);
    
    // Get latest CSS versions
    const versions = await c.env.DB.prepare(
      "SELECT file_url, file_hash, detected_at, active FROM css_versions ORDER BY detected_at DESC"
    ).all();

    // Get R2 bucket info for CSS files
    const cssObjects = await c.env.IMAGES.list({ prefix: 'css/' });

    return c.json({
      sync_enabled: settings.css_sync_enabled,
      configured_urls: settings.site_css_urls,
      versions: versions.results || [],
      r2_files: {
        count: cssObjects.objects.length,
        files: cssObjects.objects.map(obj => ({
          key: obj.key,
          size: obj.size,
          uploaded: obj.uploaded
        }))
      },
      status: 'healthy'
    });

  } catch (error) {
    console.error("CSS status error:", error);
    return c.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown status error'
    }, 500);
  }
});

/**
 * Serve CSS files from R2 with proper caching
 * GET /api/css/:filename
 */
cssSyncRoutes.get("/css/:filename", async (c) => {
  try {
    const filename = c.req.param("filename");
    
    // Security: Only allow CSS files and prevent path traversal
    if (!filename.endsWith('.css') || filename.includes('..') || filename.includes('/')) {
      return c.text('Invalid filename', 400);
    }

    const cssPath = `css/${filename}`;
    const object = await c.env.IMAGES.get(cssPath);

    if (!object) {
      return c.text('CSS file not found', 404);
    }

    // Set proper headers for CSS serving
    c.header('Content-Type', 'text/css');
    c.header('Cache-Control', 'public, max-age=86400'); // 24 hours
    c.header('Access-Control-Allow-Origin', '*'); // Allow cross-origin for CDN usage

    return c.body(await object.arrayBuffer());

  } catch (error) {
    console.error("CSS serving error:", error);
    return c.text('Internal server error', 500);
  }
});

/**
 * Get CSS URL for specific layout type
 * GET /api/css/url/:layout
 * Returns the appropriate CSS URL for homepage, category, or post layouts
 */
cssSyncRoutes.get("/url/:layout", async (c) => {
  try {
    const layout = c.req.param("layout") as 'homepage' | 'category' | 'post';
    const validLayouts = ['homepage', 'category', 'post'];
    
    if (!validLayouts.includes(layout)) {
      return c.json({ error: 'Invalid layout type' }, 400);
    }

    const settings = await getCSSSettings(c.env);
    
    if (settings.site_css_urls.length === 0) {
      return c.json({ error: 'No CSS URLs configured' }, 404);
    }

    // Layout to CSS URL mapping
    let cssUrl = '';
    switch (layout) {
      case 'homepage':
      case 'category':
        // Both use the cruise-planning style (first URL)
        cssUrl = settings.site_css_urls[0];
        break;
      case 'post':
        // Use second URL if available, otherwise fall back to first
        cssUrl = settings.site_css_urls[1] || settings.site_css_urls[0];
        break;
    }

    // Get the CDN filename for the current active version
    const version = await c.env.DB.prepare(
      "SELECT file_hash, cdn_filename FROM css_versions WHERE file_url = ? AND active = 1"
    ).bind(cssUrl).first() as CSSVersion | null;

    const cdnUrl = version 
      ? `https://cdn.cruisemadeeasy.com/css/${version.cdn_filename}`
      : null;

    return c.json({
      layout,
      source_url: cssUrl,
      cdn_url: cdnUrl,
      hash: version?.file_hash || null
    });

  } catch (error) {
    console.error("CSS URL error:", error);
    return c.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Cron handler for scheduled CSS sync
 * This will be called by Cloudflare Workers cron trigger
 */
cssSyncRoutes.get("/cron", async (c) => {
  // Verify this is actually a cron request
  const cronHeader = c.req.header('cf-cron');
  if (!cronHeader) {
    return c.text('Unauthorized', 401);
  }

  console.log('CSS Sync Cron triggered at:', new Date().toISOString());
  
  // Forward to sync endpoint
  const syncUrl = new URL('/api/css/sync', c.req.url);
  const syncResponse = await fetch(syncUrl.toString());
  const syncResult = await syncResponse.json();

  console.log('CSS Sync Cron completed:', syncResult);
  
  return c.json({
    cron_run: true,
    timestamp: new Date().toISOString(),
    sync_result: syncResult
  });
});

/**
 * Manual CSS upload endpoint for custom CSS files
 * POST /api/css/upload/:filename
 */
cssSyncRoutes.post("/upload/:filename", async (c) => {
  try {
    const filename = c.req.param("filename");
    
    // Security: Only allow CSS files and prevent path traversal
    if (!filename.endsWith('.css') || filename.includes('..') || filename.includes('/')) {
      return c.json({ error: 'Invalid filename' }, 400);
    }

    const content = await c.req.text();
    if (!content || content.length === 0) {
      return c.json({ error: 'No CSS content provided' }, 400);
    }

    const hash = await generateHash(content);
    const cdnFilename = await storeCSSInR2(`manual://${filename}`, content, hash, c.env);
    
    // Store in database for tracking
    await updateCSSVersion(`manual://${filename}`, hash, content, cdnFilename, c.env);

    return c.json({
      status: 'uploaded',
      filename,
      cdn_filename: cdnFilename,
      hash,
      size: content.length,
      cdn_url: `https://cdn.cruisemadeeasy.com/css/${cdnFilename}`
    });

  } catch (error) {
    console.error("Manual CSS upload error:", error);
    return c.json({
      error: error instanceof Error ? error.message : 'Upload failed'
    }, 500);
  }
});