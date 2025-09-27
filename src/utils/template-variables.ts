import { TemplateVariables, PostData } from '../types/template-variables'
import { Env } from '../types/database'
import { renderContentBlocks } from './block-renderer'

// Generate all template variables for a post
export async function generatePostVariables(
  post: PostData,
  env: Env
): Promise<TemplateVariables> {
  // Get featured image variants if exists
  const imageVariants = post.featured_image_id 
    ? await getImageVariants(post.featured_image_id, env)
    : undefined
  
  // Format dates properly
  const publishedDate = post.published_date ? new Date(post.published_date) : undefined
  const modifiedDate = post.updated_at ? new Date(post.updated_at) : undefined
  
  return {
    PAGE_TITLE: `${post.title} - Cruise Made Easy`,
    META_DESCRIPTION: post.meta_description || post.excerpt.slice(0, 155),
    PAGE_URL: `https://cruisemadeeasy.com/${post.category}/${post.slug}`,
    CANONICAL_URL: `https://cruisemadeeasy.com/${post.category}/${post.slug}`,
    
    POST_CONTENT: await renderContentBlocks(post.content_blocks || []),
    HERO_CONTENT: renderHeroSection(post),
    BLOG_CTA_CONTENT: renderBlogCTA(),
    POST_NAVIGATION_CONTENT: await renderPostNavigation(post, env),
    
    FEATURED_IMAGE_URL: imageVariants?.original,
    FEATURED_IMAGE_THUMBNAIL: imageVariants?.thumbnail,
    FEATURED_IMAGE_SOCIAL: imageVariants?.social,
    FEATURED_IMAGE_ALT: imageVariants?.alt_text || post.title,
    FEATURED_IMAGE_WIDTH: imageVariants?.width?.toString(),
    FEATURED_IMAGE_HEIGHT: imageVariants?.height?.toString(),
    
    PUBLISHED_DATE: publishedDate?.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    }),
    PUBLISHED_DATE_ISO: publishedDate?.toISOString(),
    MODIFIED_DATE: modifiedDate?.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'  
    }),
    MODIFIED_DATE_ISO: modifiedDate?.toISOString(),
    
    // Template conditional flags
    IS_ARTICLE: true,
    HAS_FEATURED_IMAGE: !!imageVariants?.original,
    HAS_TWITTER_IMAGE: !!imageVariants?.social,
    
    // Open Graph variables
    OG_TYPE: 'article',
    OG_TITLE: `${post.title} - Cruise Made Easy`,
    OG_DESCRIPTION: post.meta_description || post.excerpt.slice(0, 155),
    
    // Twitter card variables  
    TWITTER_TITLE: post.title.length > 70 ? `${post.title.slice(0, 67)}...` : post.title,
    TWITTER_DESCRIPTION: (post.meta_description || post.excerpt).slice(0, 200),
    TWITTER_IMAGE_URL: imageVariants?.social,
    
    // Article-specific variables
    ARTICLE_CATEGORY: post.category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    ARTICLE_HEADLINE: post.title,
    SCHEMA_DESCRIPTION: post.meta_description || post.excerpt,
    
    SCHEMA_JSON: generateSchemaJSON(post, imageVariants),
    BREADCRUMBS_JSON: generateBreadcrumbsJSON(post)
  }
}

// Generate template variables for homepage
export async function generateHomepageVariables(
  posts: PostData[],
  categories: any[],
  env: Env
): Promise<TemplateVariables> {
  const featuredPost = posts[0]
  const featuredImage = featuredPost?.featured_image_id 
    ? await getImageVariants(featuredPost.featured_image_id, env)
    : undefined

  return {
    PAGE_TITLE: 'Cruise Smarter with Norwegian: Tips, Tricks & Planning Guides - Cruise Made Easy',
    META_DESCRIPTION: 'Your ultimate resource for Norwegian Cruise Line planning, tips, and guides. From first-time cruisers to seasoned travelers, cruise smarter with expert advice.',
    PAGE_URL: 'https://cruisemadeeasy.com/',
    CANONICAL_URL: 'https://cruisemadeeasy.com/',
    
    POST_CONTENT: renderHomepageContent(posts, categories),
    HERO_CONTENT: renderHomepageHero(),
    BLOG_CTA_CONTENT: renderBlogCTA(),
    POST_NAVIGATION_CONTENT: '',
    
    FEATURED_IMAGE_URL: featuredImage?.original,
    FEATURED_IMAGE_THUMBNAIL: featuredImage?.thumbnail,
    FEATURED_IMAGE_ALT: featuredPost?.title || 'Cruise Made Easy',
    
    // Template conditional flags
    IS_ARTICLE: false,
    HAS_FEATURED_IMAGE: !!featuredImage?.original,
    HAS_TWITTER_IMAGE: !!featuredImage?.social,
    
    // Open Graph variables
    OG_TYPE: 'website',
    OG_TITLE: 'Cruise Made Easy - Your Norwegian Cruise Line Planning Resource',
    OG_DESCRIPTION: 'Your ultimate resource for Norwegian Cruise Line planning, tips, and guides.',
    
    // Twitter card variables
    TWITTER_TITLE: 'Cruise Made Easy - NCL Planning Resource',
    TWITTER_DESCRIPTION: 'Your ultimate resource for Norwegian Cruise Line planning, tips, and guides.',
    TWITTER_IMAGE_URL: featuredImage?.social,
    
    SCHEMA_JSON: generateHomepageSchemaJSON(),
    BREADCRUMBS_JSON: generateHomepageBreadcrumbsJSON()
  }
}

// Generate template variables for category pages
export async function generateCategoryVariables(
  categorySlug: string,
  categoryName: string,
  posts: PostData[],
  env: Env
): Promise<TemplateVariables> {
  const featuredPost = posts[0]
  const featuredImage = featuredPost?.featured_image_id 
    ? await getImageVariants(featuredPost.featured_image_id, env)
    : undefined

  const displayName = categoryName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  return {
    PAGE_TITLE: `${displayName} - Cruise Made Easy`,
    META_DESCRIPTION: `Discover expert ${displayName.toLowerCase()} guides and tips for your Norwegian Cruise Line vacation planning.`,
    PAGE_URL: `https://cruisemadeeasy.com/category/${categorySlug}/`,
    CANONICAL_URL: `https://cruisemadeeasy.com/category/${categorySlug}/`,
    
    POST_CONTENT: renderCategoryContent(posts, displayName),
    HERO_CONTENT: renderCategoryHero(displayName),
    BLOG_CTA_CONTENT: renderBlogCTA(),
    POST_NAVIGATION_CONTENT: '',
    
    FEATURED_IMAGE_URL: featuredImage?.original,
    FEATURED_IMAGE_THUMBNAIL: featuredImage?.thumbnail,
    FEATURED_IMAGE_ALT: featuredPost?.title || displayName,
    
    // Template conditional flags
    IS_ARTICLE: false,
    HAS_FEATURED_IMAGE: !!featuredImage?.original,
    HAS_TWITTER_IMAGE: !!featuredImage?.social,
    
    // Open Graph variables
    OG_TYPE: 'website',
    OG_TITLE: `${displayName} - Cruise Made Easy`,
    OG_DESCRIPTION: `Expert ${displayName.toLowerCase()} guides and tips for Norwegian Cruise Line travelers.`,
    
    // Twitter card variables
    TWITTER_TITLE: `${displayName} - Cruise Made Easy`,
    TWITTER_DESCRIPTION: `Expert ${displayName.toLowerCase()} guides for NCL travelers.`,
    TWITTER_IMAGE_URL: featuredImage?.social,
    
    ARTICLE_CATEGORY: displayName,
    
    SCHEMA_JSON: generateCategorySchemaJSON(displayName, categorySlug),
    BREADCRUMBS_JSON: generateCategoryBreadcrumbsJSON(displayName, categorySlug)
  }
}

// Server-side content rendering functions
function renderHeroSection(post: PostData): string {
  return `
    <div class="hero-section">
      <h1>${escapeHtml(post.title)}</h1>
      <div class="post-meta">
        <span class="category">${escapeHtml(post.category)}</span>
        ${post.published_date ? `<time datetime="${post.published_date}">${new Date(post.published_date).toLocaleDateString()}</time>` : ''}
      </div>
    </div>
  `
}

function renderHomepageHero(): string {
  return `
    <div class="hero-section homepage-hero">
      <h1>Cruise Smarter with Norwegian</h1>
      <p class="hero-subtitle">Tips, Tricks &amp; Planning Guides</p>
    </div>
  `
}

function renderCategoryHero(displayName: string): string {
  return `
    <div class="hero-section category-hero">
      <h1>CRUISE MADE EASY: ${displayName.toUpperCase()}</h1>
    </div>
  `
}

function renderBlogCTA(): string {
  return `
    <div class="blog-cta">
      <h3>Ready to Plan Your Perfect Cruise?</h3>
      <p>Get personalized cruise recommendations and expert planning advice.</p>
      <a href="/cruise-planning-services/" class="cta-button">Start Planning</a>
    </div>
  `
}

async function renderPostNavigation(post: PostData, env: Env): Promise<string> {
  // Get previous/next posts in same category
  const navPosts = await env.DB.prepare(`
    SELECT title, slug, category FROM posts 
    WHERE category = ? AND status = 'published' AND id != ?
    ORDER BY published_date DESC LIMIT 2
  `).bind(post.category, post.id).all()
  
  if (!navPosts.results || navPosts.results.length === 0) return ''
  
  return `
    <nav class="post-navigation">
      ${navPosts.results.map(navPost => `
        <a href="/${navPost.category}/${navPost.slug}" class="nav-post">
          <span class="nav-label">Next Article</span>
          <span class="nav-title">${escapeHtml(navPost.title)}</span>
        </a>
      `).join('')}
    </nav>
  `
}

function renderHomepageContent(posts: PostData[], categories: any[]): string {
  return `
    <div class="homepage-content">
      <div class="posts-grid">
        ${posts.map(post => renderPostCard(post)).join('')}
      </div>
    </div>
  `
}

function renderCategoryContent(posts: PostData[], categoryName: string): string {
  return `
    <div class="category-content">
      <h2>${categoryName} Articles</h2>
      <div class="posts-grid">
        ${posts.map(post => renderPostCard(post)).join('')}
      </div>
    </div>
  `
}

function renderPostCard(post: PostData): string {
  return `
    <article class="post-card">
      ${post.featured_image_id ? `
        <div class="post-thumbnail">
          <a href="/${post.category}/${post.slug}">
            <img src="${post.featured_image_id}" alt="${escapeHtml(post.title)}" loading="lazy">
          </a>
        </div>
      ` : ''}
      <div class="post-content">
        <h3><a href="/${post.category}/${post.slug}">${escapeHtml(post.title)}</a></h3>
        <p class="post-excerpt">${escapeHtml(post.excerpt.slice(0, 150))}...</p>
        <div class="post-meta">
          <span class="category">${escapeHtml(post.category)}</span>
          ${post.published_date ? `<time datetime="${post.published_date}">${new Date(post.published_date).toLocaleDateString()}</time>` : ''}
        </div>
      </div>
    </article>
  `
}

// Utility functions
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function generateSchemaJSON(post: PostData, imageVariants?: any): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.meta_description || post.excerpt,
    datePublished: post.published_date,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: 'Cruise Made EASY'
    },
    publisher: {
      '@type': 'Organization', 
      name: 'Cruise Made EASY',
      logo: {
        '@type': 'ImageObject',
        url: 'https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://cruisemadeeasy.com/${post.category}/${post.slug}`
    }
  }
  
  if (imageVariants?.original) {
    schema['image'] = imageVariants.original
  }
  
  return JSON.stringify(schema)
}

function generateBreadcrumbsJSON(post: PostData): string {
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://cruisemadeeasy.com/'
      },
      {
        '@type': 'ListItem', 
        position: 2,
        name: post.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        item: `https://cruisemadeeasy.com/category/${post.category}/`
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

function generateHomepageSchemaJSON(): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Cruise Made Easy',
    url: 'https://cruisemadeeasy.com/',
    description: 'Your ultimate resource for Norwegian Cruise Line planning, tips, and guides.',
    publisher: {
      '@type': 'Organization',
      name: 'Cruise Made EASY'
    }
  }
  
  return JSON.stringify(schema)
}

function generateHomepageBreadcrumbsJSON(): string {
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home'
      }
    ]
  }
  
  return JSON.stringify(breadcrumbs)
}

function generateCategorySchemaJSON(displayName: string, categorySlug: string): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${displayName} - Cruise Made Easy`,
    url: `https://cruisemadeeasy.com/category/${categorySlug}/`,
    description: `Expert ${displayName.toLowerCase()} guides and tips for Norwegian Cruise Line travelers.`,
    publisher: {
      '@type': 'Organization',
      name: 'Cruise Made EASY'
    }
  }
  
  return JSON.stringify(schema)
}

function generateCategoryBreadcrumbsJSON(displayName: string, categorySlug: string): string {
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://cruisemadeeasy.com/'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: displayName
      }
    ]
  }
  
  return JSON.stringify(breadcrumbs)
}

// Get image variants from database or generate them
async function getImageVariants(imageId: string, env: Env): Promise<any> {
  // Use the centralized getImageVariants function from image-processing
  const { getImageVariants: getVariants } = await import('./image-processing')
  return await getVariants(imageId, env)
}