/**
 * Enhanced WordPress Import Routes
 * Uses new block mapper and CSS extraction for complete import
 */

import { Hono } from 'hono';
import { Env } from '../../types/database.js';
import { requireAuth } from './auth.js';
import { 
  downloadAndUploadToR2, 
  extractImageUrlsFromHtml, 
  replaceImageUrlsInHtml 
} from '../../utils/r2-media.js';

interface WordPressPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt?: { rendered: string };
  slug: string;
  date: string;
  categories: number[];
  featured_media?: number;
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
      alt_text: string;
      title?: { rendered: string };
      media_details?: {
        sizes?: {
          full?: { source_url: string };
        };
      };
    }>;
    'wp:term'?: Array<Array<{
      name: string;
      slug: string;
    }>>;
  };
}

const app = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all import routes
app.use('*', requireAuth);

/**
 * Extract GenerateBlocks element IDs from HTML content
 */
function extractGenerateBlocksElementIds(html: string): string[] {
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
 * Extract and store CSS for GenerateBlocks elements
 */
async function extractAndStoreCSSForPost(
  postUrl: string,
  db: D1Database
): Promise<{ elementIds: string[], cssExtracted: boolean }> {
  try {
    const response = await fetch(postUrl);
    
    if (!response.ok) {
      console.warn(`Failed to fetch post for CSS extraction: ${postUrl}`);
      return { elementIds: [], cssExtracted: false };
    }
    
    const html = await response.text();
    const elementIds = extractGenerateBlocksElementIds(html);
    
    if (elementIds.length === 0) {
      return { elementIds: [], cssExtracted: true };
    }
    
    // Extract CSS content from style tags
    let cssContent = '';
    const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let cssMatch;
    
    while ((cssMatch = styleTagRegex.exec(html)) !== null) {
      cssContent += cssMatch[1] + '\n';
    }
    
    // Store each element's CSS
    for (const elementId of elementIds) {
      const elementClass = `gb-element-${elementId}`;
      const escapedClass = elementClass.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      
      const cssRules: string[] = [];
      const mediaQueries: Record<string, string[]> = {};
      
      // Basic rules
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
      
      // Generate CSS string
      const css: string[] = [];
      
      if (cssRules.length > 0) {
        css.push(`.gb-element-${elementId} {`);
        css.push('  ' + cssRules.join('\n  '));
        css.push('}');
      }
      
      for (const [mediaCondition, rules] of Object.entries(mediaQueries)) {
        css.push(`@media ${mediaCondition} {`);
        css.push(`  .gb-element-${elementId} {`);
        css.push('    ' + rules.join('\n    '));
        css.push('  }');
        css.push('}');
      }
      
      const cssString = css.join('\n');
      
      if (cssRules.length > 0 || Object.keys(mediaQueries).length > 0) {
        // Store in database
        const query = `
          INSERT OR REPLACE INTO generateblocks_elements 
          (element_id, element_type, configuration, styles, updated_at) 
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;
        
        const configuration = {
          cssRules,
          mediaQueries,
          sourceUrl: postUrl,
          extractionMethod: 'wordpress_import'
        };
        
        await db.prepare(query).bind(
          elementId,
          'wordpress_import',
          JSON.stringify(configuration),
          cssString
        ).run();
      }
    }
    
    return { elementIds, cssExtracted: true };
    
  } catch (error) {
    console.error(`CSS extraction failed for ${postUrl}:`, error);
    return { elementIds: [], cssExtracted: false };
  }
}

/**
 * Map WordPress content to our block system
 */
function mapWordPressContentToBlocks(wpPost: WordPressPost, postId: number): Array<{
  block_type: string;
  block_order: number;
  content: string;
}> {
  const blocks: Array<{
    block_type: string;
    block_order: number;
    content: string;
  }> = [];
  
  const htmlContent = wpPost.content.rendered;
  let blockOrder = 0;
  
  // Simple content parsing - split by major HTML elements
  const elements = htmlContent.split(/(?=<(?:p|h[1-6]|div|figure|blockquote|ul|ol|table|hr))/);
  
  for (const element of elements) {
    if (!element.trim()) continue;
    
    const tagMatch = element.match(/<(\\w+)/);
    const tagName = tagMatch ? tagMatch[1].toLowerCase() : '';
    const className = element.match(/class=["']([^"']*)["']/)?.[1] || '';
    
    let blockType = 'paragraph';
    let content: any = {};
    
    switch (tagName) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        blockType = 'heading';
        content = {
          level: parseInt(tagName[1]) as 1 | 2 | 3 | 4 | 5 | 6,
          text: element.replace(/<[^>]*>/g, '').trim()
        };
        break;
        
      case 'figure':
        if (className.includes('wp-block-image')) {
          blockType = 'figure';
          const imgMatch = element.match(/<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*/);
          const captionMatch = element.match(/<figcaption[^>]*>(.*?)<\/figcaption>/);
          
          content = {
            image: {
              url: imgMatch?.[1] || '',
              alt: imgMatch?.[2] || '',
              caption: captionMatch ? captionMatch[1].replace(/<[^>]*>/g, '').trim() : ''
            },
            alignment: className.includes('aligncenter') ? 'center' : 
                      className.includes('alignright') ? 'right' : 'left',
            size: className.includes('size-large') ? 'large' : 
                  className.includes('size-full') ? 'full' : 'medium'
          };
        }
        break;
        
      case 'div':
        // Handle special div types
        if (className.includes('gbp-section')) {
          blockType = 'section';
          const headlineMatch = element.match(/<h[1-6][^>]*class="[^"]*gbp-section__headline[^"]*"[^>]*>(.*?)<\/h[1-6]>/);
          content = {
            headline: headlineMatch ? headlineMatch[1].replace(/<[^>]*>/g, '').trim() : '',
            style: 'default'
          };
        } else if (className.match(/gb-element-([a-f0-9]+)/)) {
          blockType = 'container';
          const elementIdMatch = className.match(/gb-element-([a-f0-9]+)/);
          content = {
            elementId: elementIdMatch ? `gb-element-${elementIdMatch[1]}` : '',
            className: className
          };
        } else if (className.includes('wp-block-columns')) {
          blockType = 'columns';
          const columnCount = (element.match(/wp-block-column/g) || []).length;
          content = {
            columns: columnCount,
            alignment: className.includes('is-content-justification-center') ? 'center' : 'left'
          };
        } else if (className.includes('wp-block-buttons')) {
          blockType = 'cta-group';
          const buttons = [];
          const buttonMatches = element.match(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/g) || [];
          
          for (const buttonMatch of buttonMatches) {
            const urlMatch = buttonMatch.match(/href=["']([^"']*)["']/);
            const textMatch = buttonMatch.match(/>([^<]*)</);
            const isExternal = buttonMatch.includes('target="_blank"');
            
            if (urlMatch && textMatch) {
              buttons.push({
                text: textMatch[1].trim(),
                url: urlMatch[1],
                type: buttonMatch.includes('is-style-outline') ? 'secondary' : 'primary',
                external: isExternal
              });
            }
          }
          
          content = {
            alignment: className.includes('is-content-justification-center') ? 'center' : 'left',
            buttons: buttons
          };
        }
        break;
        
      case 'blockquote':
        blockType = 'quote';
        const citeMatch = element.match(/<cite[^>]*>(.*?)<\/cite>/);
        content = {
          text: element.replace(/<cite[^>]*>.*?<\/cite>/, '').replace(/<[^>]*>/g, '').trim(),
          citation: citeMatch ? citeMatch[1].replace(/<[^>]*>/g, '').trim() : undefined
        };
        break;
        
      case 'ul':
      case 'ol':
        blockType = 'list';
        const items = element.match(/<li[^>]*>(.*?)<\/li>/gs) || [];
        content = {
          ordered: tagName === 'ol',
          items: items.map(item => item.replace(/<\/?li[^>]*>/g, '').replace(/<[^>]*>/g, '').trim())
        };
        break;
        
      case 'hr':
        blockType = 'divider';
        content = {};
        break;
        
      default:
        // Default paragraph handling
        blockType = 'paragraph';
        content = {
          text: element,
          alignment: className.includes('has-text-align-center') ? 'center' :
                    className.includes('has-text-align-right') ? 'right' : 'left'
        };
    }
    
    blocks.push({
      block_type: blockType,
      block_order: blockOrder++,
      content: JSON.stringify(content)
    });
  }
  
  return blocks;
}

/**
 * Download and import featured image to R2
 */
async function importFeaturedImage(
  imageUrl: string, 
  env: any,
  metadata?: { title?: string; alt_text?: string }
): Promise<string | null> {
  try {
    console.log(`Importing featured image: ${imageUrl}`);
    
    const uploadResult = await downloadAndUploadToR2(imageUrl, env, {
      title: metadata?.title || 'Imported featured image',
      alt_text: metadata?.alt_text || '',
      originalPath: imageUrl // Preserve original path structure
    });
    
    // Save to media library
    await env.DB.prepare(`
      INSERT INTO media_files (
        filename, original_filename, title, alt_text, file_path, file_url,
        file_type, file_size, mime_type, width, height, uploaded_by, upload_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
    `).bind(
      uploadResult.filename,
      uploadResult.originalFilename,
      metadata?.title || uploadResult.originalFilename,
      metadata?.alt_text || '',
      uploadResult.filePath,
      uploadResult.fileUrl,
      'image',
      uploadResult.fileSize,
      uploadResult.mimeType,
      uploadResult.width || null,
      uploadResult.height || null
    ).run();
    
    console.log(`✅ Featured image imported: ${uploadResult.fileUrl}`);
    return uploadResult.fileUrl;
    
  } catch (error) {
    console.error(`Failed to import featured image ${imageUrl}:`, error);
    return null;
  }
}

/**
 * Import all images from HTML content to R2 and update URLs
 */
async function importContentImages(
  htmlContent: string, 
  env: any
): Promise<string> {
  try {
    const images = extractImageUrlsFromHtml(htmlContent);
    
    if (images.length === 0) {
      return htmlContent;
    }
    
    console.log(`Found ${images.length} images in content to import`);
    const urlMapping = new Map<string, string>();
    
    // Process images with some rate limiting
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      try {
        console.log(`Importing content image ${i + 1}/${images.length}: ${image.url}`);
        
        const uploadResult = await downloadAndUploadToR2(image.url, env, {
          title: image.title || 'Imported content image',
          alt_text: image.alt || '',
          originalPath: image.url
        });
        
        // Save to media library
        await env.DB.prepare(`
          INSERT INTO media_files (
            filename, original_filename, title, alt_text, file_path, file_url,
            file_type, file_size, mime_type, width, height, uploaded_by, upload_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
        `).bind(
          uploadResult.filename,
          uploadResult.originalFilename,
          image.title || uploadResult.originalFilename,
          image.alt || '',
          uploadResult.filePath,
          uploadResult.fileUrl,
          'image',
          uploadResult.fileSize,
          uploadResult.mimeType,
          uploadResult.width || null,
          uploadResult.height || null
        ).run();
        
        urlMapping.set(image.url, uploadResult.fileUrl);
        console.log(`✅ Content image imported: ${image.url} -> ${uploadResult.fileUrl}`);
        
        // Add delay between images to avoid overwhelming the system
        if (i < images.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.warn(`Failed to import image ${image.url}:`, error);
        // Continue with other images if one fails
      }
    }
    
    // Replace old URLs with new CDN URLs in the content
    const updatedContent = replaceImageUrlsInHtml(htmlContent, urlMapping);
    console.log(`✅ Updated ${urlMapping.size} image URLs in content`);
    
    return updatedContent;
    
  } catch (error) {
    console.error('Error importing content images:', error);
    return htmlContent; // Return original content if import fails
  }
}

/**
 * Create or get category by slug
 */
async function createOrGetCategory(db: D1Database, categorySlug: string, categoryName?: string): Promise<number> {
  // Try to find existing category
  const existingCategory = await db.prepare(
    'SELECT id FROM categories WHERE slug = ?'
  ).bind(categorySlug).first();
  
  if (existingCategory) {
    return existingCategory.id as number;
  }
  
  // Create new category
  const categoryResult = await db.prepare(`
    INSERT INTO categories (name, slug, description, color, created_at, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    categoryName || categorySlug.replace(/-/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase()),
    categorySlug,
    `Category for ${categoryName || categorySlug} posts`,
    '#3B82F6' // Default blue color
  ).run();
  
  return categoryResult.meta.last_row_id as number;
}

/**
 * POST /api/wordpress-import/posts
 * Import WordPress posts with full block mapping and CSS extraction
 */
app.post('/posts', async (c) => {
  try {
    const user = c.get('user');
    const { 
      post_urls, 
      extract_css = true,
      create_categories = true,
      import_images = true,
      batch_size = 5 
    } = await c.req.json();
    
    if (!post_urls || !Array.isArray(post_urls) || post_urls.length === 0) {
      return c.json({ 
        success: false, 
        error: 'post_urls array is required' 
      }, 400);
    }
    
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
      cssElements: 0,
      imagesImported: 0,
      categoriesCreated: [] as string[]
    };
    
    // Process posts in batches
    const batchSizeLimit = Math.min(batch_size, 5);
    
    for (let i = 0; i < post_urls.length; i += batchSizeLimit) {
      const batch = post_urls.slice(i, i + batchSizeLimit);
      
      for (const postUrl of batch) {
        try {
          console.log(`Importing WordPress post: ${postUrl}`);
          
          // Fetch WordPress post data with embedded data
          const wpApiUrl = postUrl.replace('https://cruisemadeeasy.com/', 'https://cruisemadeeasy.com/wp-json/wp/v2/posts?slug=') + '&_embed=1';
          const wpResponse = await fetch(wpApiUrl);
          
          if (!wpResponse.ok) {
            results.errors.push(`Failed to fetch WordPress data for ${postUrl}: ${wpResponse.status}`);
            continue;
          }
          
          const wpPosts = await wpResponse.json();
          
          if (!Array.isArray(wpPosts) || wpPosts.length === 0) {
            results.errors.push(`No WordPress post found for ${postUrl}`);
            continue;
          }
          
          const wpPost: WordPressPost = wpPosts[0];
          
          // Check if post already exists
          const existingPost = await c.env.DB.prepare(
            'SELECT id FROM posts WHERE slug = ?'
          ).bind(wpPost.slug).first();
          
          if (existingPost) {
            results.skipped++;
            continue;
          }
          
          // Handle category
          let categoryId: number | null = null;
          if (create_categories && wpPost._embedded?.['wp:term']?.[0]?.[0]) {
            const wpCategory = wpPost._embedded['wp:term'][0][0];
            categoryId = await createOrGetCategory(c.env.DB, wpCategory.slug, wpCategory.name);
            if (!results.categoriesCreated.includes(wpCategory.slug)) {
              results.categoriesCreated.push(wpCategory.slug);
            }
          }
          
          // Handle featured image - download and upload to R2
          let featuredImageUrl: string | null = null;
          if (wpPost._embedded?.['wp:featuredmedia']?.[0]) {
            const media = wpPost._embedded['wp:featuredmedia'][0];
            const originalImageUrl = media.media_details?.sizes?.full?.source_url || media.source_url;
            
            featuredImageUrl = await importFeaturedImage(originalImageUrl, c.env, {
              title: media.title?.rendered || wpPost.title.rendered,
              alt_text: media.alt_text || ''
            });
          }
          
          // Extract and store CSS if requested
          let cssData = { elementIds: [], cssExtracted: false };
          if (extract_css) {
            cssData = await extractAndStoreCSSForPost(postUrl, c.env.DB);
            results.cssElements += cssData.elementIds.length;
          }
          
          // Create post
          const postResult = await c.env.DB.prepare(`
            INSERT INTO posts (
              slug, title, content, excerpt, status, post_type, persona,
              author_id, category_id, featured_image_url, published_date,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `).bind(
            wpPost.slug,
            wpPost.title.rendered,
            JSON.stringify([]), // Will be replaced by content blocks
            wpPost.excerpt?.rendered || '',
            'published',
            'monday', // Default post type - could be inferred from content
            null, // Default persona
            user.id,
            categoryId,
            featuredImageUrl,
            wpPost.date
          ).run();
          
          const postId = postResult.meta.last_row_id as number;
          
          // Import content images to R2 and update URLs
          const updatedContent = await importContentImages(wpPost.content.rendered, c.env);
          
          // Map WordPress content to blocks using updated content with CDN URLs
          const wpPostWithUpdatedContent = {
            ...wpPost,
            content: { rendered: updatedContent }
          };
          const contentBlocks = mapWordPressContentToBlocks(wpPostWithUpdatedContent, postId);
          
          // Insert content blocks
          for (const block of contentBlocks) {
            await c.env.DB.prepare(`
              INSERT INTO content_blocks (post_id, block_type, block_order, content, created_at)
              VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(
              postId,
              block.block_type,
              block.block_order,
              block.content
            ).run();
          }
          
          // Store WordPress import metadata
          await c.env.DB.prepare(`
            INSERT INTO wp_import_metadata (
              wp_post_id, cme_post_id, wp_category_slug, import_date
            ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          `).bind(
            wpPost.id,
            postId,
            wpPost._embedded?.['wp:term']?.[0]?.[0]?.slug || null
          ).run();
          
          results.imported++;
          console.log(`✅ Imported: ${wpPost.title.rendered} (${contentBlocks.length} blocks, ${cssData.elementIds.length} CSS elements)`);
          
        } catch (error) {
          console.error(`Error importing ${postUrl}:`, error);
          results.errors.push(`Import failed for ${postUrl}: ${error.message}`);
        }
      }
      
      // Add delay between batches
      if (i + batchSizeLimit < post_urls.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return c.json({
      success: true,
      data: results
    });
    
  } catch (error) {
    console.error('WordPress import failed:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Import failed' 
    }, 500);
  }
});

export default app;