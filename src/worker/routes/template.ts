import { Hono } from "hono";
import { Env } from "../../types/database";
import { wpTemplateScraper } from "../../utils/wp-template-scraper";

export const templateRoutes = new Hono<{ Bindings: Env }>();

/**
 * Template Management Routes - Admin functionality for WordPress template management
 */

/**
 * Get template status and information
 * GET /api/template/status
 */
templateRoutes.get("/status", async (c) => {
  try {
    // Get current cached template info
    const cached = await wpTemplateScraper.getCachedTemplate(c.env);
    
    if (!cached) {
      return c.json({
        status: 'no_template',
        message: 'No WordPress template cached',
        cached: false,
        source_url: 'https://cruisemadeeasy.com/cruise-planning/'
      });
    }

    return c.json({
      status: 'cached',
      message: 'WordPress template is cached and ready',
      cached: true,
      source_url: 'https://cruisemadeeasy.com/cruise-planning/',
      last_scraped: cached.last_scraped,
      template_hash: cached.template_hash,
      template_size: cached.full_html.length,
      content_placeholder: cached.content_placeholder
    });

  } catch (error) {
    console.error("Template status error:", error);
    return c.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Manually refresh WordPress template
 * POST /api/template/refresh
 */
templateRoutes.post("/refresh", async (c) => {
  try {
    console.log('Admin triggered WordPress template refresh');
    
    // Force refresh the template
    const template = await wpTemplateScraper.refreshTemplate(c.env);
    
    return c.json({
      status: 'success',
      message: 'WordPress template refreshed successfully',
      last_scraped: template.last_scraped,
      template_hash: template.template_hash,
      template_size: template.full_html.length,
      changes_detected: true // Always true for manual refresh
    });

  } catch (error) {
    console.error("Template refresh error:", error);
    return c.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to refresh template'
    }, 500);
  }
});

/**
 * Preview current template structure (first 1000 chars)
 * GET /api/template/preview
 */
templateRoutes.get("/preview", async (c) => {
  try {
    const template = await wpTemplateScraper.getTemplate(c.env);
    
    return c.json({
      status: 'success',
      preview: template.full_html.substring(0, 1000) + '...',
      template_size: template.full_html.length,
      last_scraped: template.last_scraped,
      content_placeholder: template.content_placeholder
    });

  } catch (error) {
    console.error("Template preview error:", error);
    return c.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to load template'
    }, 500);
  }
});

/**
 * Delete cached template (force re-scrape on next request)
 * DELETE /api/template/cache
 */
templateRoutes.delete("/cache", async (c) => {
  try {
    // Delete cached template from database
    await c.env.DB.prepare(
      "DELETE FROM wp_templates WHERE source_url = ?"
    ).bind('https://cruisemadeeasy.com/cruise-planning/').run();
    
    return c.json({
      status: 'success',
      message: 'Template cache cleared. Next request will fetch fresh template.'
    });

  } catch (error) {
    console.error("Template cache clear error:", error);
    return c.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to clear cache'
    }, 500);
  }
});