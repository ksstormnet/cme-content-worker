// Edge case handling utilities for robust content delivery

import { Env } from '../types/database'
import { TemplateVariables } from '../types/template-variables'

export interface EdgeCaseResult {
  handled: boolean
  response?: Response
  fallbackData?: any
  shouldContinue: boolean
}

export class EdgeCaseHandler {
  
  // Handle missing or invalid post data
  static handleMissingPost(
    category: string, 
    slug: string, 
    env: Env
  ): EdgeCaseResult {
    // Log the 404 for analytics
    console.warn(`404: Post not found - /${category}/${slug}/`)
    
    // Generate a helpful 404 response
    const html = this.generate404Page(category, slug)
    
    return {
      handled: true,
      response: new Response(html, {
        status: 404,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300' // Cache 404s briefly
        }
      }),
      shouldContinue: false
    }
  }
  
  // Handle missing category
  static handleMissingCategory(categorySlug: string): EdgeCaseResult {
    console.warn(`404: Category not found - /category/${categorySlug}/`)
    
    const html = this.generateCategoryNotFoundPage(categorySlug)
    
    return {
      handled: true,
      response: new Response(html, {
        status: 404,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300'
        }
      }),
      shouldContinue: false
    }
  }
  
  // Handle corrupted content blocks
  static handleCorruptedContentBlocks(blocks: any[]): EdgeCaseResult {
    const validBlocks = []
    let corruptedCount = 0
    
    for (const block of blocks) {
      try {
        // Validate block structure
        if (!block.block_type || !block.content) {
          corruptedCount++
          continue
        }
        
        // Try to parse content if it's a string
        if (typeof block.content === 'string') {
          try {
            block.content = JSON.parse(block.content)
          } catch (error) {
            // If JSON parsing fails, treat as plain text
            block.content = { text: block.content }
          }
        }
        
        validBlocks.push(block)
        
      } catch (error) {
        corruptedCount++
        console.warn('Corrupted content block detected:', error)
      }
    }
    
    if (corruptedCount > 0) {
      console.warn(`Removed ${corruptedCount} corrupted content blocks`)
    }
    
    return {
      handled: true,
      fallbackData: validBlocks,
      shouldContinue: true
    }
  }
  
  // Handle missing or corrupted featured images
  static async handleMissingFeaturedImage(
    imageId: string | null, 
    postTitle: string,
    env: Env
  ): Promise<EdgeCaseResult> {
    if (!imageId) {
      // No featured image specified - use default
      return {
        handled: true,
        fallbackData: {
          original: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp',
          thumbnail: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp',
          social: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp',
          alt_text: `${postTitle} - Cruise Made Easy`,
          width: 1200,
          height: 630
        },
        shouldContinue: true
      }
    }
    
    try {
      // Check if image exists in database
      const imageRecord = await env.DB.prepare(`
        SELECT id, variants_json, alt_text FROM images WHERE id = ?
      `).bind(imageId).first()
      
      if (!imageRecord) {
        console.warn(`Featured image not found in database: ${imageId}`)
        
        // Use default image
        return {
          handled: true,
          fallbackData: {
            original: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp',
            thumbnail: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp',
            social: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp',
            alt_text: `${postTitle} - Cruise Made Easy`,
            width: 1200,
            height: 630
          },
          shouldContinue: true
        }
      }
      
      // Image exists but may have corrupted variants
      let variants = null
      try {
        variants = JSON.parse(imageRecord.variants_json as string)
      } catch (error) {
        console.warn(`Corrupted image variants for ${imageId}:`, error)
        
        // Reconstruct basic variants
        variants = {
          original: `https://cruisemadeeasy.com/blog-images/${imageId}`,
          thumbnail: `https://cruisemadeeasy.com/cdn-cgi/image/width=150,height=150/${imageId}`,
          social: `https://cruisemadeeasy.com/cdn-cgi/image/width=1024,height=768/${imageId}`,
          alt_text: imageRecord.alt_text || `${postTitle} - Cruise Made Easy`
        }
      }
      
      return {
        handled: true,
        fallbackData: variants,
        shouldContinue: true
      }
      
    } catch (error) {
      console.error(`Error handling featured image ${imageId}:`, error)
      
      return {
        handled: true,
        fallbackData: {
          original: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp',
          thumbnail: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp',
          social: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp',
          alt_text: `${postTitle} - Cruise Made Easy`,
          width: 1200,
          height: 630
        },
        shouldContinue: true
      }
    }
  }
  
  // Handle incomplete template variables
  static handleIncompleteVariables(variables: Partial<TemplateVariables>): EdgeCaseResult {
    const defaults = {
      PAGE_TITLE: 'Cruise Made Easy - Norwegian Cruise Line Experts',
      META_DESCRIPTION: 'Expert Norwegian Cruise Line guidance, tips, and planning services.',
      PAGE_URL: 'https://cruisemadeeasy.com/',
      CANONICAL_URL: 'https://cruisemadeeasy.com/',
      POST_CONTENT: '<p>Content is being loaded...</p>',
      HERO_CONTENT: '<h1>Cruise Made Easy</h1>',
      BLOG_CTA_CONTENT: '',
      POST_NAVIGATION_CONTENT: '',
      OG_TYPE: 'website',
      OG_TITLE: 'Cruise Made Easy',
      OG_DESCRIPTION: 'Expert Norwegian Cruise Line guidance and planning',
      TWITTER_TITLE: 'Cruise Made Easy',
      TWITTER_DESCRIPTION: 'Expert Norwegian Cruise Line guidance and planning',
      FEATURED_IMAGE_URL: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp',
      FEATURED_IMAGE_THUMBNAIL: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp',
      FEATURED_IMAGE_SOCIAL: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp',
      FEATURED_IMAGE_ALT: 'Cruise Made Easy - Norwegian Cruise Line Experts',
      FEATURED_IMAGE_WIDTH: '1200',
      FEATURED_IMAGE_HEIGHT: '630',
      IS_ARTICLE: false,
      HAS_FEATURED_IMAGE: true,
      HAS_TWITTER_IMAGE: true,
      TWITTER_IMAGE_URL: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp'
    }
    
    // Fill in missing variables with defaults
    const completedVariables = { ...defaults, ...variables }
    
    // Count how many defaults were used
    let defaultsUsed = 0
    for (const key of Object.keys(defaults)) {
      if (!variables[key as keyof TemplateVariables]) {
        defaultsUsed++
      }
    }
    
    if (defaultsUsed > 0) {
      console.warn(`Used ${defaultsUsed} default values for incomplete template variables`)
    }
    
    return {
      handled: true,
      fallbackData: completedVariables,
      shouldContinue: true
    }
  }
  
  // Handle rate limiting scenarios
  static handleRateLimit(requestIp?: string): EdgeCaseResult {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Too Many Requests - Cruise Made Easy</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin: 40px; }
          .rate-limit { color: #e74c3c; }
        </style>
      </head>
      <body>
        <h1>Too Many Requests</h1>
        <p class="rate-limit">Please slow down and try again in a moment.</p>
        <p><a href="/">Return to Homepage</a></p>
      </body>
      </html>
    `
    
    return {
      handled: true,
      response: new Response(html, {
        status: 429,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Retry-After': '60'
        }
      }),
      shouldContinue: false
    }
  }
  
  // Generate user-friendly 404 page
  private static generate404Page(category: string, slug: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Page Not Found - Cruise Made Easy</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 600px;
            margin: 20px;
          }
          h1 { color: #333; font-size: 2.5em; margin-bottom: 20px; }
          .subtitle { color: #666; font-size: 1.2em; margin-bottom: 30px; }
          .suggestions { text-align: left; margin: 30px 0; }
          .suggestions h3 { color: #333; }
          .suggestions ul { padding-left: 20px; }
          .suggestions li { margin: 10px 0; }
          .actions { margin-top: 30px; }
          .btn {
            display: inline-block;
            padding: 12px 24px;
            margin: 0 10px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            transition: all 0.3s ease;
          }
          .btn-primary { background: #667eea; color: white; }
          .btn-secondary { background: transparent; color: #667eea; border: 2px solid #667eea; }
          .btn:hover { transform: translateY(-2px); }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🗺️ Page Not Found</h1>
          <div class="subtitle">
            The page <strong>/${category}/${slug}/</strong> doesn't exist or has been moved.
          </div>
          
          <div class="suggestions">
            <h3>What would you like to do?</h3>
            <ul>
              <li><a href="/">Visit our homepage</a> for latest cruise content</li>
              <li><a href="/category/${category}/">Browse ${category} articles</a></li>
              <li><a href="/cruise-planning/">Check out our cruise planning guides</a></li>
              <li><a href="/which-cruiser-are-you/">Take our Cruise Match Quiz</a></li>
            </ul>
          </div>
          
          <div class="actions">
            <a href="/" class="btn btn-primary">← Homepage</a>
            <a href="/category/${category}/" class="btn btn-secondary">${category.charAt(0).toUpperCase() + category.slice(1)}</a>
          </div>
        </div>
      </body>
      </html>
    `
  }
  
  // Generate category not found page
  private static generateCategoryNotFoundPage(categorySlug: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Category Not Found - Cruise Made Easy</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 600px;
            margin: 20px;
          }
          h1 { color: #333; font-size: 2.5em; margin-bottom: 20px; }
          .subtitle { color: #666; font-size: 1.2em; margin-bottom: 30px; }
          .categories { margin: 30px 0; }
          .categories h3 { color: #333; margin-bottom: 20px; }
          .category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
          .category-card { padding: 15px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef; }
          .category-card a { text-decoration: none; color: #667eea; font-weight: bold; }
          .category-card:hover { background: #e9ecef; }
          .btn { 
            display: inline-block;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📂 Category Not Found</h1>
          <div class="subtitle">
            The category <strong>${categorySlug}</strong> doesn't exist.
          </div>
          
          <div class="categories">
            <h3>Popular Categories</h3>
            <div class="category-grid">
              <div class="category-card">
                <a href="/category/cruise-planning/">Cruise Planning</a>
              </div>
              <div class="category-card">
                <a href="/category/cruise-tips/">Cruise Tips</a>
              </div>
              <div class="category-card">
                <a href="/category/destinations/">Destinations</a>
              </div>
              <div class="category-card">
                <a href="/category/ship-reviews/">Ship Reviews</a>
              </div>
            </div>
          </div>
          
          <a href="/" class="btn">← Return to Homepage</a>
        </div>
      </body>
      </html>
    `
  }
}

// Export edge case handling utilities
export const edgeCaseHandler = EdgeCaseHandler