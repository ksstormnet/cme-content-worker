/**
 * WordPress CSS Extraction API Routes
 * Handles extracting and storing GenerateBlocks CSS from WordPress posts
 */

import { Hono } from 'hono';
import { Env } from '../../types/database.js';

interface ExtractedElementStyles {
  elementId: string;
  cssRules: string[];
  mediaQueries: Record<string, string[]>;
}

interface CSSExtractionRequest {
  urls: string[];
  force_refresh?: boolean;
}

const app = new Hono<{ Bindings: Env }>();

/**
 * Extract GenerateBlocks CSS from WordPress pages
 */
async function extractGenerateBlocksCSS(pageUrl: string): Promise<{
  url: string;
  elementStyles: ExtractedElementStyles[];
  extractedAt: string;
} | null> {
  try {
    const response = await fetch(pageUrl);
    
    if (!response.ok) {
      console.warn(`Failed to fetch page: ${pageUrl} (${response.status})`);
      return null;
    }
    
    const html = await response.text();
    
    // Extract GenerateBlocks element IDs
    const elementIds: string[] = [];
    const regex = /gb-element-([a-f0-9]+)/g;
    let match;
    
    while ((match = regex.exec(html)) !== null) {
      const elementId = match[1];
      if (!elementIds.includes(elementId)) {
        elementIds.push(elementId);
      }
    }
    
    // Extract CSS content from style tags
    let cssContent = '';
    const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let cssMatch;
    
    while ((cssMatch = styleTagRegex.exec(html)) !== null) {
      cssContent += cssMatch[1] + '\n';
    }
    
    // Extract CSS for each element
    const elementStyles: ExtractedElementStyles[] = [];
    
    for (const elementId of elementIds) {
      const elementClass = `gb-element-${elementId}`;
      const escapedClass = elementClass.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      
      // Find CSS rules for this element
      const cssRules: string[] = [];
      const mediaQueries: Record<string, string[]> = {};
      
      // Basic rules: .gb-element-id { rules }
      const classRuleRegex = new RegExp(`\\.${escapedClass}\\s*{([^}]+)}`, 'gi');
      let ruleMatch;
      
      while ((ruleMatch = classRuleRegex.exec(cssContent)) !== null) {
        const rules = ruleMatch[1].trim();
        if (rules) {
          cssRules.push(rules);
        }
      }
      
      // Media query rules
      const mediaQueryRegex = /@media\s*([^{]+)\s*{([^{}]*(?:{[^}]*}[^{}]*)*)}/gi;
      let mediaMatch;
      
      while ((mediaMatch = mediaQueryRegex.exec(cssContent)) !== null) {
        const mediaCondition = mediaMatch[1].trim();
        const mediaContent = mediaMatch[2];
        
        const elementInMedia = new RegExp(`\\.${escapedClass}\\s*{([^}]+)}`, 'gi');
        let elementMatch;
        
        while ((elementMatch = elementInMedia.exec(mediaContent)) !== null) {
          if (!mediaQueries[mediaCondition]) {
            mediaQueries[mediaCondition] = [];
          }
          mediaQueries[mediaCondition].push(elementMatch[1].trim());
        }
      }
      
      if (cssRules.length > 0 || Object.keys(mediaQueries).length > 0) {
        elementStyles.push({
          elementId,
          cssRules,
          mediaQueries
        });
      }
    }
    
    return {
      url: pageUrl,
      elementStyles,
      extractedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error extracting CSS from ${pageUrl}:`, error);
    return null;
  }
}

/**
 * Store extracted element styles in database
 */
async function storeElementStyles(db: D1Database, styles: ExtractedElementStyles, sourceUrl: string): Promise<void> {
  // Generate CSS string
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
  
  const cssString = css.join('\n');
  
  const query = `
    INSERT OR REPLACE INTO generateblocks_elements 
    (element_id, element_type, configuration, styles, updated_at) 
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;
  
  const configuration = {
    cssRules: styles.cssRules,
    mediaQueries: styles.mediaQueries,
    sourceUrl: sourceUrl,
    extractionMethod: 'css_extraction'
  };
  
  await db.prepare(query).bind(
    styles.elementId,
    'css_extracted',
    JSON.stringify(configuration),
    cssString
  ).run();
}

/**
 * POST /api/wordpress-css/extract
 * Extract CSS from WordPress URLs and store in database
 */
app.post('/extract', async (c) => {
  try {
    const requestData: CSSExtractionRequest = await c.req.json();
    
    if (!requestData.urls || !Array.isArray(requestData.urls) || requestData.urls.length === 0) {
      return c.json({ 
        success: false, 
        error: 'URLs array is required' 
      }, 400);
    }
    
    const results = [];
    const errors = [];
    let totalElements = 0;
    
    // Process URLs in batches to avoid overwhelming the server
    const batchSize = 3;
    for (let i = 0; i < requestData.urls.length; i += batchSize) {
      const batch = requestData.urls.slice(i, i + batchSize);
      const batchPromises = batch.map(url => extractGenerateBlocksCSS(url));
      const batchResults = await Promise.all(batchPromises);
      
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const url = batch[j];
        
        if (result) {
          // Store each element's CSS in database
          for (const elementStyle of result.elementStyles) {
            try {
              await storeElementStyles(c.env.DB, elementStyle, url);
              totalElements++;
            } catch (storeError) {
              console.error(`Failed to store element ${elementStyle.elementId}:`, storeError);
              errors.push(`Failed to store element ${elementStyle.elementId}: ${storeError.message}`);
            }
          }
          
          results.push({
            url: result.url,
            elementsFound: result.elementStyles.length,
            extractedAt: result.extractedAt
          });
        } else {
          errors.push(`Failed to extract CSS from ${url}`);
        }
      }
      
      // Add delay between batches to be respectful to the WordPress server
      if (i + batchSize < requestData.urls.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return c.json({
      success: true,
      data: {
        processedUrls: results.length,
        totalElements: totalElements,
        results: results,
        errors: errors.length > 0 ? errors : undefined
      }
    });
    
  } catch (error) {
    console.error('CSS extraction failed:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'CSS extraction failed' 
    }, 500);
  }
});

/**
 * GET /api/wordpress-css/elements
 * Get stored GenerateBlocks elements
 */
app.get('/elements', async (c) => {
  try {
    const query = `
      SELECT element_id, element_type, configuration, styles, updated_at
      FROM generateblocks_elements 
      ORDER BY updated_at DESC
      LIMIT 100
    `;
    
    const results = await c.env.DB.prepare(query).all();
    
    const elements = results.results.map(row => ({
      elementId: row.element_id,
      elementType: row.element_type,
      configuration: JSON.parse(row.configuration as string),
      styles: row.styles,
      updatedAt: row.updated_at
    }));
    
    return c.json({
      success: true,
      data: {
        count: elements.length,
        elements: elements
      }
    });
    
  } catch (error) {
    console.error('Failed to get elements:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Failed to retrieve elements' 
    }, 500);
  }
});

/**
 * GET /api/wordpress-css/elements/:elementId
 * Get specific GenerateBlocks element
 */
app.get('/elements/:elementId', async (c) => {
  try {
    const elementId = c.req.param('elementId');
    
    const query = `
      SELECT element_id, element_type, configuration, styles, updated_at
      FROM generateblocks_elements 
      WHERE element_id = ?
    `;
    
    const result = await c.env.DB.prepare(query).bind(elementId).first();
    
    if (!result) {
      return c.json({ 
        success: false, 
        error: 'Element not found' 
      }, 404);
    }
    
    return c.json({
      success: true,
      data: {
        elementId: result.element_id,
        elementType: result.element_type,
        configuration: JSON.parse(result.configuration as string),
        styles: result.styles,
        updatedAt: result.updated_at
      }
    });
    
  } catch (error) {
    console.error('Failed to get element:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Failed to retrieve element' 
    }, 500);
  }
});

/**
 * GET /api/wordpress-css/consolidated
 * Get consolidated CSS for all stored elements
 */
app.get('/consolidated', async (c) => {
  try {
    const query = `
      SELECT element_id, styles
      FROM generateblocks_elements 
      ORDER BY element_id
    `;
    
    const results = await c.env.DB.prepare(query).all();
    
    const cssBlocks: string[] = [];
    
    for (const row of results.results) {
      if (row.styles) {
        cssBlocks.push(row.styles as string);
      }
    }
    
    const consolidatedCSS = cssBlocks.join('\n\n');
    
    return c.json({
      success: true,
      data: {
        elementsCount: results.results.length,
        consolidatedCSS: consolidatedCSS,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Failed to generate consolidated CSS:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Failed to generate consolidated CSS' 
    }, 500);
  }
});

/**
 * DELETE /api/wordpress-css/elements/:elementId
 * Delete a stored element
 */
app.delete('/elements/:elementId', async (c) => {
  try {
    const elementId = c.req.param('elementId');
    
    const query = `DELETE FROM generateblocks_elements WHERE element_id = ?`;
    const result = await c.env.DB.prepare(query).bind(elementId).run();
    
    if (result.changes === 0) {
      return c.json({ 
        success: false, 
        error: 'Element not found' 
      }, 404);
    }
    
    return c.json({
      success: true,
      message: `Element ${elementId} deleted successfully`
    });
    
  } catch (error) {
    console.error('Failed to delete element:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Failed to delete element' 
    }, 500);
  }
});

export default app;