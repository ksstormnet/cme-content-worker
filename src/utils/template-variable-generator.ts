import { TemplateVariables, PostData } from '../types/template-variables'
import { Env } from '../types/database'
import { COMPILED_TEMPLATES } from './compiled-templates'
import { getImageVariants } from './image-processing'
import { getAssetManifestSync } from './asset-resolver'

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

  // Use featured_image_url with Cloudflare Image Resizing
  const featuredImageUrl = post.featured_image_url || ''

  // Generate optimized variants using Cloudflare Image Resizing
  const heroImageUrl = featuredImageUrl
    ? `${featuredImageUrl}/cdn-cgi/image/width=1920,quality=85,format=auto`
    : ''
  const socialImageUrl = featuredImageUrl
    ? `${featuredImageUrl}/cdn-cgi/image/width=1200,height=630,fit=cover,quality=85,format=auto`
    : ''
  const thumbnailUrl = featuredImageUrl
    ? `${featuredImageUrl}/cdn-cgi/image/width=150,height=150,fit=cover,quality=85,format=auto`
    : ''

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
    HERO_CONTENT: renderHeroSection(post, heroImageUrl, categoryDisplayName, publishedDate),
    BLOG_CTA_CONTENT: renderBlogCTA(),
    POST_NAVIGATION_CONTENT: await renderPostNavigation(post, env),

    // Open Graph required fields
    OG_TYPE: 'article',
    OG_TITLE: post.title,
    OG_DESCRIPTION: post.meta_description || post.excerpt || `${post.title} - Cruise Made Easy`,

    // Twitter Card required fields
    TWITTER_TITLE: post.title,
    TWITTER_DESCRIPTION: post.meta_description || post.excerpt || `${post.title} - Cruise Made Easy`,

    // Featured image with Cloudflare Image Resizing for optimal performance
    FEATURED_IMAGE_URL: heroImageUrl,
    FEATURED_IMAGE_THUMBNAIL: thumbnailUrl,
    FEATURED_IMAGE_SOCIAL: socialImageUrl,
    FEATURED_IMAGE_ALT: post.title,
    FEATURED_IMAGE_WIDTH: '1200',
    FEATURED_IMAGE_HEIGHT: '630',

    // Responsive sizes using Cloudflare Image Resizing
    FEATURED_IMAGE_SMALL: featuredImageUrl ? `${featuredImageUrl}/cdn-cgi/image/width=320,quality=85,format=auto` : '',
    FEATURED_IMAGE_MEDIUM: featuredImageUrl ? `${featuredImageUrl}/cdn-cgi/image/width=768,quality=85,format=auto` : '',
    FEATURED_IMAGE_LARGE: heroImageUrl,

    // WebP variants (format=auto handles this)
    FEATURED_IMAGE_WEBP: heroImageUrl,
    FEATURED_IMAGE_WEBP_THUMBNAIL: thumbnailUrl,
    FEATURED_IMAGE_WEBP_SOCIAL: socialImageUrl,

    // Responsive srcset with multiple sizes
    FEATURED_IMAGE_SRCSET: featuredImageUrl
      ? `${featuredImageUrl}/cdn-cgi/image/width=320,quality=85,format=auto 320w, ${featuredImageUrl}/cdn-cgi/image/width=768,quality=85,format=auto 768w, ${featuredImageUrl}/cdn-cgi/image/width=1200,quality=85,format=auto 1200w, ${featuredImageUrl}/cdn-cgi/image/width=1920,quality=85,format=auto 1920w`
      : '',
    FEATURED_IMAGE_SRCSET_WEBP: '',  // format=auto handles WebP automatically

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

    // Twitter-specific (optimized for social sharing)
    TWITTER_IMAGE_URL: socialImageUrl,

    // Template conditional flags
    IS_ARTICLE: true,
    HAS_FEATURED_IMAGE: !!featuredImageUrl,
    HAS_TWITTER_IMAGE: !!featuredImageUrl,

    // Schema.org JSON-LD (use social-optimized image)
    SCHEMA_JSON: generateSchemaJSON(post, socialImageUrl || featuredImageUrl, baseUrl),
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
    }),

    // Site-wide configuration variables
    SITE_URL: 'https://cruisemadeeasy.com/',
    SITE_NAME: 'Cruise Made Easy',
    SITE_LANGUAGE: 'en_US',
    SITE_LOCALE: 'en_US',

    // SEO meta variables
    ROBOTS_CONTENT: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',

    // Twitter/X configuration
    TWITTER_CARD_TYPE: 'summary_large_image',
    TWITTER_SITE: '@CruiseMadeEasy',
    TWITTER_CREATOR: '@CruiseMadeEasy',

    // Feed and social platform IDs
    RSS_FEED_URL: 'https://cruisemadeeasy.com/feed/',
    FACEBOOK_PAGES: '107480055526279, 109600461963155',

    // Author and publisher details
    AUTHOR_NAME: 'Cruise Made EASY',
    AUTHOR_URL: 'https://cruisemadeeasy.com/author/scott/',
    AUTHOR_SOCIAL_URL: 'https://facebook.com/CruiseMadeEASY',
    PUBLISHER_NAME: 'Cruise Made EASY',
    PUBLISHER_SOCIAL_URL: 'https://facebook.com/CruiseMadeEASY',
    PUBLISHER_LOGO_URL: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp',
    PUBLISHER_LOGO_WIDTH: '1200',
    PUBLISHER_LOGO_HEIGHT: '630',

    // Social media URLs
    FACEBOOK_URL: 'https://facebook.com/CruiseMadeEASY',
    TWITTER_URL: 'https://twitter.com/@CruiseMadeEasy',
    PINTEREST_URL: 'https://pinterest.com/CruiseMadeEasy',
    INSTAGRAM_URL: 'https://instagram.com/CruiseMadeEASY',
    YOUTUBE_URL: 'https://youtube.com/@CruiseMadeEASY',
    LINKEDIN_URL: 'https://linkedin.com/company/CruiseMadeEASY',
    ALIGNABLE_URL: 'https://www.alignable.com/wichita-ks/cruise-made-easy'
  }

  return variables
}

// Generate variables for homepage/category listing
export async function generateBlogListingVariables(
  categorySlug?: string,
  categoryName?: string,
  env?: Env
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

  // Get current asset filenames dynamically
  const assets = getAssetManifestSync()

  return {
    PAGE_TITLE: pageTitle,
    META_DESCRIPTION: description,
    PAGE_URL: pageUrl,
    CANONICAL_URL: pageUrl,

    POST_CONTENT: isCategory
      ? `<div id="react-blog-content" class="blog-listing-container">
           <p>Loading ${categoryName || categorySlug} articles...</p>
         </div>
         <script type="module" crossorigin src="${assets.jsFile}"></script>
         <link rel="stylesheet" crossorigin href="${assets.cssFile}">
         <script type="text/javascript">
           window.BLOG_CONFIG = {
             category: '${categorySlug}',
             categoryName: '${categoryName || categorySlug}'
           };
         </script>`
      : `<div id="react-blog-content" class="blog-listing-container">
           <p>Loading latest cruise articles...</p>
         </div>
         <script type="module" crossorigin src="${assets.jsFile}"></script>
         <link rel="stylesheet" crossorigin href="${assets.cssFile}">
         <script type="text/javascript">
           window.BLOG_CONFIG = {
             category: null,
             categoryName: null
           };
         </script>`,
    HERO_CONTENT: renderBlogHero(categoryName),

    // Template variables for hero (even though it's not a post)
    POST_TITLE: isCategory ? (categoryName || categorySlug) : 'Cruise Made Easy',
    POST_AUTHOR: '',
    POST_CATEGORY: '',
    POST_DATE: '',
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

    // Date fields (use current date for listings)
    PUBLISHED_DATE: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    PUBLISHED_DATE_ISO: new Date().toISOString(),
    MODIFIED_DATE: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    MODIFIED_DATE_ISO: new Date().toISOString(),

    // Schema.org for listings (minimal)
    SCHEMA_JSON: '',

    // Breadcrumb template variables for listings
    HAS_BREADCRUMBS: !!isCategory,
    BREADCRUMB_ITEMS: isCategory ? generateBreadcrumbItemsForCategory(categorySlug, categoryName, baseUrl) : [],

    // Site-wide configuration variables
    SITE_URL: 'https://cruisemadeeasy.com/',
    SITE_NAME: 'Cruise Made Easy',
    SITE_LANGUAGE: 'en_US',
    SITE_LOCALE: 'en_US',

    // SEO meta variables
    ROBOTS_CONTENT: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',

    // Twitter/X configuration
    TWITTER_CARD_TYPE: 'summary_large_image',
    TWITTER_SITE: '@CruiseMadeEasy',
    TWITTER_CREATOR: '@CruiseMadeEasy',

    // Feed and social platform IDs
    RSS_FEED_URL: 'https://cruisemadeeasy.com/feed/',
    FACEBOOK_PAGES: '107480055526279, 109600461963155',

    // Author and publisher details
    AUTHOR_NAME: 'Cruise Made EASY',
    AUTHOR_URL: 'https://cruisemadeeasy.com/author/scott/',
    AUTHOR_SOCIAL_URL: 'https://facebook.com/CruiseMadeEASY',
    PUBLISHER_NAME: 'Cruise Made EASY',
    PUBLISHER_SOCIAL_URL: 'https://facebook.com/CruiseMadeEASY',
    PUBLISHER_LOGO_URL: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp',
    PUBLISHER_LOGO_WIDTH: '1200',
    PUBLISHER_LOGO_HEIGHT: '630',

    // Social media URLs
    FACEBOOK_URL: 'https://facebook.com/CruiseMadeEASY',
    TWITTER_URL: 'https://twitter.com/@CruiseMadeEasy',
    PINTEREST_URL: 'https://pinterest.com/CruiseMadeEasy',
    INSTAGRAM_URL: 'https://instagram.com/CruiseMadeEASY',
    YOUTUBE_URL: 'https://youtube.com/@CruiseMadeEASY',
    LINKEDIN_URL: 'https://linkedin.com/company/CruiseMadeEASY',
    ALIGNABLE_URL: 'https://www.alignable.com/wichita-ks/cruise-made-easy'
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
function renderHeroSection(post: PostData, heroImageUrl: string, categoryDisplayName: string, publishedDate: Date): string {
  // Use optimized hero image URL (1920px wide, compressed)
  // Include critical inline styles to prevent layout shift during CSS load
  const heroStyle = heroImageUrl
    ? `style="--hero-bg-image: url('${heroImageUrl}'); min-height: 280px;"`
    : 'style="min-height: 280px;"';

  return `
    <div class="hero-container" ${heroStyle}>
      <div class="hero__content-wrapper">
        <h1 class="gb-text hero__title">${escapeHtml(post.title)}</h1>
        <div class="hero__metadata-group">
          <p class="hero__metadata-item--author">
            <span class="gb-shape">
              <svg viewBox="0 0 3 36.7" xmlns="https://www.w3.org/2000/svg"><path d="M0 0h3v36.7H0z"></path></svg>
            </span>
            <span class="gb-text">${escapeHtml(post.author_name || 'Cruise Made EASY')}</span>
          </p>
          <p class="hero__metadata-item--category">
            <span class="gb-shape">
              <svg viewBox="0 0 3 36.7" xmlns="https://www.w3.org/2000/svg"><path d="M0 0h3v36.7H0z"></path></svg>
            </span>
            <span class="gb-text"><span>${escapeHtml(categoryDisplayName)}</span></span>
          </p>
          <p class="hero__metadata-item--date">
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

  const heroBackgroundImage = 'https://cruisemadeeasy.com/wp-content/uploads/2025/03/ncl_Dawn_Wake.jpeg'

  return `
    <div class="hero-container" style="--hero-bg-image: url('${heroBackgroundImage}');">
      <div class="hero__content-wrapper">
        <h1 class="gb-text hero__title">${escapeHtml(title)}</h1>
      </div>
    </div>
  `
}

// Render blog CTA section
function renderBlogCTA(): string {
  return `
    <div class="blog-cta__container">
      <div class="blog-cta__content">
        <h3 class="gb-text blog-cta__heading">How Can I Help Plan Your Perfect NCL Cruise?</h3>
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
function generateSchemaJSON(post: PostData, featuredImageUrl: string, baseUrl: string): string {
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

  if (featuredImageUrl) {
    schema['image'] = featuredImageUrl
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
// Generate server-side blog cards (no React needed)
async function generateServerSideBlogCards(env: Env, categorySlug?: string): Promise<string> {
  try {
    // Build query for posts (accounting for database schema issues)
    // Start with minimal columns to see what exists
    const query = `
      SELECT id, title, slug
      FROM posts
      LIMIT 5
    `

    // Remove all filtering temporarily to test basic query
    const postsResult = await env.DB.prepare(query).all()

    if (!postsResult.results || postsResult.results.length === 0) {
      return `
        <div class="blog-listing-container generate-columns-container">
          <p style="text-align: center; padding: 2rem;">No articles found. Check back soon for new content!</p>
        </div>
      `
    }

    // Generate blog cards HTML
    const cards = postsResult.results.map((post: any) => {
      // Handle missing category column gracefully
      const category = post.category || 'cruise-planning'
      const categoryTitle = category
        .split('-')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      const publishedDate = post.published_date
        ? new Date(post.published_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : 'Recent'

      // Use default featured image since column may not exist
      const featuredImageUrl = 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp'
      const postUrl = `/${category}/${post.slug}/`

      return `
        <article
          id="post-${post.id}"
          class="dynamic-content-template post-${post.id} post type-post status-publish format-standard has-post-thumbnail hentry category-${category} generate-columns tablet-grid-50 mobile-grid-100 grid-parent grid-50 no-featured-image-padding"
        >
          <div class="story-card__image-container" style="background-image: url('${featuredImageUrl}');">
            <div class="story-card__content-overlay">
              <p class="gb-text story-card__category-badge dynamic-term-class">
                <span>${escapeHtml(categoryTitle)}</span>
              </p>

              <h2 class="gb-text story-card__title">
                <a href="${postUrl}">${escapeHtml(post.title)}</a>
              </h2>

              <p class="gb-text story-card__date">${publishedDate}</p>

              <a class="gb-text story-card__cta-button button" href="${postUrl}">
                View Article
              </a>
            </div>
          </div>
        </article>
      `
    }).join('\n')

    return `
      <div class="blog-listing-container story-grid">
        ${cards}
      </div>
    `

  } catch (error) {
    console.error('Error generating server-side blog cards:', error)
    return `
      <div class="blog-listing-container generate-columns-container">
        <p style="text-align: center; padding: 2rem; color: #666;">
          Unable to load articles at this time. Please try again later.
        </p>
      </div>
    `
  }
}

function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') return ''

  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
