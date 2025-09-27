import { TemplateVariables, PostData } from '../types/template-variables'
import { Env } from '../types/database'
import { COMPILED_TEMPLATES } from './compiled-templates'
import { getImageVariants } from './image-processing'

// Generate all template variables for a post
export async function generatePostVariables(
  post: PostData,
  env: Env
): Promise<TemplateVariables> {
  
  // Format dates
  const publishedDate = post.published_date ? new Date(post.published_date) : new Date()
  const modifiedDate = post.updated_at ? new Date(post.updated_at) : publishedDate
  
  // Generate content from content blocks
  const postContent = await renderContentBlocks(post.content_blocks || [])
  
  // Get featured image variants (if available)
  const imageVariants = post.featured_image_id 
    ? await getImageVariants(post.featured_image_id, env)
    : null

  // Generate category display name
  const categoryDisplayName = post.category
    ?.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'General'

  // Base URL for the site
  const baseUrl = 'https://cruisemadeeasy.com'
  const postUrl = `${baseUrl}/${post.category}/${post.slug}/`
  
  // Generate comprehensive template variables
  const variables: TemplateVariables = {
    // Required core variables
    PAGE_TITLE: `${post.title} - Cruise Made Easy`,
    META_DESCRIPTION: post.meta_description || post.excerpt?.slice(0, 155) || `${post.title} - Expert cruise guidance from Cruise Made Easy`,
    PAGE_URL: postUrl,
    CANONICAL_URL: postUrl,
    
    // Content areas
    POST_CONTENT: postContent,
    HERO_CONTENT: renderHeroSection(post, categoryDisplayName, publishedDate),
    BLOG_CTA_CONTENT: renderBlogCTA(),
    POST_NAVIGATION_CONTENT: await renderPostNavigation(post, env),
    
    // Open Graph required fields
    OG_TYPE: 'article',
    OG_TITLE: post.title,
    OG_DESCRIPTION: post.meta_description || post.excerpt || `${post.title} - Cruise Made Easy`,
    
    // Twitter Card required fields  
    TWITTER_TITLE: post.title,
    TWITTER_DESCRIPTION: post.meta_description || post.excerpt || `${post.title} - Cruise Made Easy`,
    
    // Featured image handling with full variant support
    FEATURED_IMAGE_URL: imageVariants?.original || '',
    FEATURED_IMAGE_THUMBNAIL: imageVariants?.thumbnail || '',
    FEATURED_IMAGE_SOCIAL: imageVariants?.social || '',
    FEATURED_IMAGE_ALT: imageVariants?.alt_text || post.title,
    FEATURED_IMAGE_WIDTH: String(imageVariants?.width || '1200'),
    FEATURED_IMAGE_HEIGHT: String(imageVariants?.height || '630'),
    
    // Additional image variants for responsive design
    FEATURED_IMAGE_SMALL: imageVariants?.responsive?.small || imageVariants?.original || '',
    FEATURED_IMAGE_MEDIUM: imageVariants?.responsive?.medium || imageVariants?.original || '',
    FEATURED_IMAGE_LARGE: imageVariants?.responsive?.large || imageVariants?.original || '',
    
    // WebP variants for modern browsers
    FEATURED_IMAGE_WEBP: imageVariants?.webp?.original || '',
    FEATURED_IMAGE_WEBP_THUMBNAIL: imageVariants?.webp?.thumbnail || '',
    FEATURED_IMAGE_WEBP_SOCIAL: imageVariants?.webp?.social || '',
    
    // Responsive srcset attributes
    FEATURED_IMAGE_SRCSET: generateSrcSet(imageVariants),
    FEATURED_IMAGE_SRCSET_WEBP: generateWebPSrcSet(imageVariants),
    
    // Date formatting
    PUBLISHED_DATE: publishedDate.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    }),
    PUBLISHED_DATE_ISO: publishedDate.toISOString(),
    MODIFIED_DATE: modifiedDate.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'  
    }),
    MODIFIED_DATE_ISO: modifiedDate.toISOString(),
    
    // Article-specific variables
    ARTICLE_CATEGORY: categoryDisplayName,
    ARTICLE_HEADLINE: post.title,
    SCHEMA_DESCRIPTION: post.meta_description || post.excerpt || `${post.title} - Cruise Made Easy`,
    
    // Twitter-specific
    TWITTER_IMAGE_URL: imageVariants?.social || imageVariants?.original || '',
    
    // Template conditional flags
    IS_ARTICLE: true,
    HAS_FEATURED_IMAGE: !!imageVariants?.original,
    HAS_TWITTER_IMAGE: !!imageVariants?.social || !!imageVariants?.original,
    
    // Schema.org JSON-LD
    SCHEMA_JSON: generateSchemaJSON(post, imageVariants, baseUrl),
    BREADCRUMBS_JSON: generateBreadcrumbsJSON(post, categoryDisplayName, baseUrl),
    
    // Breadcrumb template variables
    HAS_BREADCRUMBS: true,
    BREADCRUMB_ITEMS: generateBreadcrumbItems(post, categoryDisplayName, baseUrl),
    
    // Additional template variables for hero section compatibility
    POST_TITLE: post.title,
    POST_AUTHOR: post.author_name || 'Cruise Made EASY',
    POST_CATEGORY: categoryDisplayName,
    POST_DATE: publishedDate.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  }
  
  return variables
}

// Generate variables for homepage/category listing
export async function generateBlogListingVariables(
  categorySlug?: string,
  categoryName?: string
): Promise<TemplateVariables> {
  const baseUrl = 'https://cruisemadeeasy.com'
  const isCategory = !!categorySlug
  
  const pageTitle = isCategory 
    ? `${categoryName || categorySlug} - Cruise Made Easy`
    : 'Cruise Made Easy - Your Norwegian Cruise Line Experts'
    
  const pageUrl = isCategory 
    ? `${baseUrl}/category/${categorySlug}/`
    : baseUrl
    
  const description = isCategory
    ? `Expert ${categoryName || categorySlug} advice and tips for Norwegian Cruise Line cruises. Plan your perfect cruise with Cruise Made Easy.`
    : 'Expert Norwegian Cruise Line guidance, tips, and planning services. Your trusted cruise planning experts since 2020.'
  
  return {
    PAGE_TITLE: pageTitle,
    META_DESCRIPTION: description,
    PAGE_URL: pageUrl,
    CANONICAL_URL: pageUrl,
    
    POST_CONTENT: '', // Will be populated by React component in production
    HERO_CONTENT: renderBlogHero(categoryName),
    BLOG_CTA_CONTENT: renderBlogCTA(),
    POST_NAVIGATION_CONTENT: '',
    
    OG_TYPE: 'website',
    OG_TITLE: pageTitle,
    OG_DESCRIPTION: description,
    
    TWITTER_TITLE: pageTitle,
    TWITTER_DESCRIPTION: description,
    
    // Default featured image for blog listings
    FEATURED_IMAGE_URL: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp',
    FEATURED_IMAGE_THUMBNAIL: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp',
    FEATURED_IMAGE_SOCIAL: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp',
    FEATURED_IMAGE_ALT: 'Cruise Made Easy - Norwegian Cruise Line Experts',
    FEATURED_IMAGE_WIDTH: '1200',
    FEATURED_IMAGE_HEIGHT: '630',
    
    IS_ARTICLE: false,
    HAS_FEATURED_IMAGE: true,
    HAS_TWITTER_IMAGE: true,
    
    TWITTER_IMAGE_URL: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp',
    
    // Breadcrumb template variables for listings
    HAS_BREADCRUMBS: !!isCategory,
    BREADCRUMB_ITEMS: isCategory ? generateBreadcrumbItemsForCategory(categorySlug, categoryName, baseUrl) : []
  }
}

// Render content blocks to HTML
async function renderContentBlocks(blocks: any[]): Promise<string> {
  if (!blocks || blocks.length === 0) {
    return '<p>Content coming soon...</p>'
  }
  
  const sortedBlocks = blocks.sort((a, b) => (a.block_order || 0) - (b.block_order || 0))
  const htmlBlocks = await Promise.all(sortedBlocks.map(renderBlock))
  
  return htmlBlocks.join('\n')
}

// Render individual content block
async function renderBlock(block: any): Promise<string> {
  try {
    const content = typeof block.content === 'string' 
      ? JSON.parse(block.content) 
      : block.content
    
    switch (block.block_type) {
      case 'heading':
        const level = Math.min(6, Math.max(1, content.level || 2))
        return `<h${level}>${escapeHtml(content.text || content.content || '')}</h${level}>`
        
      case 'paragraph':
        return `<p>${content.text || content.content || ''}</p>`
        
      case 'image':
        const img = `<img src="${content.url || content.src || ''}" alt="${escapeHtml(content.alt_text || content.alt || '')}" loading="lazy">`
        const caption = content.caption ? `<figcaption>${escapeHtml(content.caption)}</figcaption>` : ''
        return `<figure>${img}${caption}</figure>`
        
      case 'accent_tip':
        const icon = content.icon ? `<span class="accent-icon">${content.icon}</span>` : ''
        const title = content.title ? `<h4>${escapeHtml(content.title)}</h4>` : ''
        return `<div class="accent-tip">${icon}<div class="accent-content">${title}<p>${content.text || content.content || ''}</p></div></div>`
        
      case 'quote':
        const attribution = content.attribution ? `<cite>— ${escapeHtml(content.attribution)}</cite>` : ''
        return `<blockquote><p>${content.text || content.quote || content.content || ''}</p>${attribution}</blockquote>`
        
      case 'cta':
        const ctaTitle = content.title ? `<h3>${escapeHtml(content.title)}</h3>` : ''
        const ctaText = content.text ? `<p>${escapeHtml(content.text)}</p>` : ''
        const ctaButton = (content.button_text && content.button_url) 
          ? `<a href="${content.button_url}" class="cta-button" ${content.open_new_tab ? 'target="_blank" rel="noopener"' : ''}>${escapeHtml(content.button_text)}</a>`
          : ''
        return `<div class="call-to-action">${ctaTitle}${ctaText}${ctaButton}</div>`
        
      case 'divider':
        return `<hr class="divider ${content.style || 'default'}">`
        
      case 'list':
        const listTag = content.type === 'ordered' ? 'ol' : 'ul'
        const items = (content.items || []).map((item: string) => `<li>${item}</li>`).join('')
        return `<${listTag}>${items}</${listTag}>`
        
      case 'table':
        const headers = content.headers ? `<thead><tr>${content.headers.map((h: string) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>` : ''
        const rows = (content.rows || []).map((row: string[]) => 
          `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
        ).join('')
        return `<table>${headers}<tbody>${rows}</tbody></table>`
        
      default:
        console.warn(`Unknown block type: ${block.block_type}`)
        return typeof content === 'string' 
          ? `<div class="unknown-block">${content}</div>`
          : `<div class="unknown-block"><pre>${JSON.stringify(content, null, 2)}</pre></div>`
    }
  } catch (error) {
    console.error('Error rendering block:', error, block)
    return '<div class="error-block">Error rendering content block</div>'
  }
}

// Render hero section for individual posts
function renderHeroSection(post: PostData, categoryDisplayName: string, publishedDate: Date): string {
  return `
    <div class="hero-container">
      <div class="gb-element-65aa24d4">
        <h1 class="gb-text gb-text-74f92ea1">${escapeHtml(post.title)}</h1>
        <div class="gb-element-c208d8e1">
          <p class="gb-text-cd6c9335">
            <span class="gb-shape">
              <svg viewBox="0 0 3 36.7" xmlns="https://www.w3.org/2000/svg"><path d="M0 0h3v36.7H0z"></path></svg>
            </span>
            <span class="gb-text">${escapeHtml(post.author_name || 'Cruise Made EASY')}</span>
          </p>
          <p class="gb-text-42e4a7df">
            <span class="gb-shape">
              <svg viewBox="0 0 3 36.7" xmlns="https://www.w3.org/2000/svg"><path d="M0 0h3v36.7H0z"></path></svg>
            </span>
            <span class="gb-text"><span>${escapeHtml(categoryDisplayName)}</span></span>
          </p>
          <p class="gb-text-12f7e1fd">
            <span class="gb-shape">
              <svg viewBox="0 0 3 36.7" xmlns="https://www.w3.org/2000/svg"><path d="M0 0h3v36.7H0z"></path></svg>
            </span>
            <span class="gb-text">${publishedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </p>
        </div>
      </div>
    </div>
  `
}

// Render hero section for blog listings
function renderBlogHero(categoryName?: string): string {
  const title = categoryName 
    ? `CRUISE MADE EASY: ${categoryName.toUpperCase()}`
    : 'Cruise Smarter with Norwegian: Tips, Tricks & Planning Guides'
    
  return `
    <div class="hero-container">
      <div class="gb-element-65aa24d4">
        <h1 class="gb-text gb-text-74f92ea1">${escapeHtml(title)}</h1>
      </div>
    </div>
  `
}

// Render blog CTA section
function renderBlogCTA(): string {
  return `
    <div class="gb-element-718de565">
      <div class="gb-element-c26bb9ef">
        <h3 class="gb-text gb-text-301a7e52">How Can I Help Plan Your Perfect NCL Cruise?</h3>
        <div class="wp-block-buttons alignwide has-custom-font-size has-medium-font-size is-content-justification-center is-layout-flex wp-container-core-buttons-is-layout-16018d1d wp-block-buttons-is-layout-flex">
          <div class="wp-block-button">
            <a class="wp-block-button__link has-medium-font-size has-custom-font-size wp-element-button" href="https://a.gocme.link/widget/bookings/talk-cruises" style="border-radius:26px">
              🛳️&nbsp;<strong>Let's Talk Cruises</strong>
            </a>
          </div>
        </div>
      </div>
    </div>
  `
}

// Render post navigation
async function renderPostNavigation(post: PostData, env: Env): Promise<string> {
  try {
    // Get previous post (older)
    const prevPostResult = await env.DB.prepare(`
      SELECT title, slug, category, featured_image_id FROM posts 
      WHERE category = ? AND status = 'published' 
      AND published_date < ? 
      ORDER BY published_date DESC LIMIT 1
    `).bind(post.category, post.published_date).first()
    
    // Get next post (newer)
    const nextPostResult = await env.DB.prepare(`
      SELECT title, slug, category, featured_image_id FROM posts 
      WHERE category = ? AND status = 'published' 
      AND published_date > ? 
      ORDER BY published_date ASC LIMIT 1
    `).bind(post.category, post.published_date).first()
    
    // If no navigation posts, return empty
    if (!prevPostResult && !nextPostResult) {
      return ''
    }
    
    // Generate navigation variables
    const navVariables: Record<string, any> = {}
    
    if (prevPostResult) {
      const prevImageVariants = prevPostResult.featured_image_id 
        ? await getImageVariants(String(prevPostResult.featured_image_id), env)
        : null
        
      navVariables.HAS_PREV_POST = true
      navVariables.PREV_POST_URL = `/${prevPostResult.category}/${prevPostResult.slug}/`
      navVariables.PREV_POST_TITLE = prevPostResult.title
      navVariables.PREV_POST_IMAGE_URL = prevImageVariants?.thumbnail || 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp'
      navVariables.PREV_POST_ALT = `${prevPostResult.title} - Cruise Made Easy`
      navVariables.PREV_POST_DOMINANT_COLOR = prevImageVariants?.dominant_color || '#1e3a8a'
    } else {
      navVariables.HAS_PREV_POST = false
    }
    
    if (nextPostResult) {
      const nextImageVariants = nextPostResult.featured_image_id 
        ? await getImageVariants(String(nextPostResult.featured_image_id), env)
        : null
        
      navVariables.HAS_NEXT_POST = true
      navVariables.NEXT_POST_URL = `/${nextPostResult.category}/${nextPostResult.slug}/`
      navVariables.NEXT_POST_TITLE = nextPostResult.title
      navVariables.NEXT_POST_IMAGE_URL = nextImageVariants?.thumbnail || 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp'
      navVariables.NEXT_POST_ALT = `${nextPostResult.title} - Cruise Made Easy`
      navVariables.NEXT_POST_DOMINANT_COLOR = nextImageVariants?.dominant_color || '#1e3a8a'
    } else {
      navVariables.HAS_NEXT_POST = false
    }
    
    // Load and render post navigation template
    const template = await loadTemplate('POST_NAVIGATION')
    return renderTemplateString(template, navVariables)
    
  } catch (error) {
    console.error('Error rendering post navigation:', error)
    return ''
  }
}


// Generate Schema.org JSON-LD
function generateSchemaJSON(post: PostData, imageVariants: any, baseUrl: string): string {
  const schema = {
    '@context': 'https://schema.org/',
    '@type': 'BlogPosting',
    'datePublished': post.published_date,
    'dateModified': post.updated_at || post.published_date,
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `${baseUrl}/${post.category}/${post.slug}/`
    },
    'headline': post.title,
    'author': {
      '@type': 'Person',
      'name': 'Cruise Made EASY',
      'url': 'https://cruisemadeeasy.com/author/scott/'
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Cruise Made EASY',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp',
        'width': '1200',
        'height': '630'
      },
      'sameAs': [
        'https://facebook.com/CruiseMadeEASY',
        'https://twitter.com/@CruiseMadeEasy',
        'https://pinterest.com/CruiseMadeEasy',
        'https://instagram.com/CruiseMadeEASY',
        'https://youtube.com/@CruiseMadeEASY',
        'https://linkedin.com/company/CruiseMadeEASY',
        'https://www.alignable.com/wichita-ks/cruise-made-easy'
      ]
    },
    'description': post.meta_description || post.excerpt || post.title
  }
  
  if (imageVariants?.original) {
    schema['image'] = imageVariants.original
  }
  
  return JSON.stringify(schema)
}

// Generate breadcrumbs JSON-LD
function generateBreadcrumbsJSON(post: PostData, categoryDisplayName: string, baseUrl: string): string {
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl
      },
      {
        '@type': 'ListItem', 
        position: 2,
        name: categoryDisplayName,
        item: `${baseUrl}/category/${post.category}/`
      },
      {
        '@type': 'ListItem',
        position: 3, 
        name: post.title
      }
    ]
  }
  
  return JSON.stringify(breadcrumbs)
}

// Generate breadcrumb items for template rendering
function generateBreadcrumbItems(post: PostData, categoryDisplayName: string, baseUrl: string): any[] {
  return [
    {
      POSITION: 1,
      URL: baseUrl,
      NAME: 'Home',
      NOT_LAST: true
    },
    {
      POSITION: 2,
      URL: `${baseUrl}/category/${post.category}/`,
      NAME: categoryDisplayName,
      NOT_LAST: true
    },
    {
      POSITION: 3,
      URL: `${baseUrl}/${post.category}/${post.slug}/`,
      NAME: post.title,
      NOT_LAST: false
    }
  ]
}

// Generate breadcrumb items for category pages
function generateBreadcrumbItemsForCategory(categorySlug?: string, categoryName?: string, baseUrl: string = 'https://cruisemadeeasy.com'): any[] {
  if (!categorySlug || !categoryName) {
    return []
  }
  
  return [
    {
      POSITION: 1,
      URL: baseUrl,
      NAME: 'Home',
      NOT_LAST: true
    },
    {
      POSITION: 2,
      URL: `${baseUrl}/category/${categorySlug}/`,
      NAME: categoryName,
      NOT_LAST: false
    }
  ]
}

// Template loading helper
async function loadTemplate(templateName: string): Promise<string> {
  const template = COMPILED_TEMPLATES[templateName as keyof typeof COMPILED_TEMPLATES]
  
  if (!template) {
    console.error(`Template not found: ${templateName}. Available templates:`, Object.keys(COMPILED_TEMPLATES))
    return `<!-- Template ${templateName} not found -->`
  }
  
  return template
}

// Simple template variable substitution with conditional support
function renderTemplateString(template: string, variables: Record<string, any>): string {
  // First handle conditional blocks with array iteration {{#ARRAY}}...{{/ARRAY}}
  template = template.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, condition, content) => {
    const conditionValue = variables[condition]
    
    // Handle arrays - iterate and render each item
    if (Array.isArray(conditionValue)) {
      return conditionValue.map((item, index) => {
        // Replace variables within the array item content
        return content.replace(/\{\{([\w_]+)\}\}/g, (varMatch, varKey) => {
          const itemValue = item[varKey]
          return itemValue !== undefined ? String(itemValue) : ''
        })
      }).join('')
    }
    
    // Handle boolean/simple conditionals
    if (conditionValue && conditionValue !== '' && conditionValue !== '#') {
      return content
    }
    
    return '' // Hide content if condition is falsy or empty
  })
  
  // Then handle regular variable substitutions
  return template.replace(/\{\{([\w_]+)\}\}/g, (match, key) => {
    const value = variables[key]
    
    if (value === undefined || value === null || value === '') {
      return '' // Return empty string for missing/empty variables
    }
    
    return String(value)
  })
}

// Generate responsive srcset attribute
function generateSrcSet(imageVariants: any): string {
  if (!imageVariants?.responsive) {
    return imageVariants?.original || ''
  }
  
  const srcsetParts: string[] = []
  
  if (imageVariants.responsive.small) {
    srcsetParts.push(`${imageVariants.responsive.small} 320w`)
  }
  if (imageVariants.responsive.medium) {
    srcsetParts.push(`${imageVariants.responsive.medium} 768w`)
  }
  if (imageVariants.responsive.large) {
    srcsetParts.push(`${imageVariants.responsive.large} 1200w`)
  }
  
  return srcsetParts.length > 0 ? srcsetParts.join(', ') : (imageVariants.original || '')
}

// Generate WebP responsive srcset attribute
function generateWebPSrcSet(imageVariants: any): string {
  if (!imageVariants?.webp || !imageVariants?.responsive) {
    return imageVariants?.webp?.original || ''
  }
  
  const srcsetParts: string[] = []
  const baseUrl = imageVariants.original
  
  if (baseUrl) {
    srcsetParts.push(`${baseUrl}/cdn-cgi/image/width=320,format=webp,quality=85 320w`)
    srcsetParts.push(`${baseUrl}/cdn-cgi/image/width=768,format=webp,quality=85 768w`)
    srcsetParts.push(`${baseUrl}/cdn-cgi/image/width=1200,format=webp,quality=85 1200w`)
  }
  
  return srcsetParts.length > 0 ? srcsetParts.join(', ') : (imageVariants?.webp?.original || '')
}

// HTML escape utility
function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') return ''
  
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}