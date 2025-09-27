// Type-safe template variables interface
export interface TemplateVariables {
  // Dynamic variables only (static variables hardcoded in HTML)
  PAGE_TITLE: string
  META_DESCRIPTION: string
  PAGE_URL: string
  CANONICAL_URL: string
  
  // Content areas (server-side rendered)
  POST_CONTENT: string
  HERO_CONTENT: string
  BLOG_CTA_CONTENT: string
  POST_NAVIGATION_CONTENT: string
  
  // Featured image with all variants
  FEATURED_IMAGE_URL?: string
  FEATURED_IMAGE_THUMBNAIL?: string
  FEATURED_IMAGE_SOCIAL?: string
  FEATURED_IMAGE_ALT?: string
  
  // Dates with proper formatting
  PUBLISHED_DATE?: string
  PUBLISHED_DATE_ISO?: string
  MODIFIED_DATE?: string
  MODIFIED_DATE_ISO?: string
  
  // SEO metadata
  SCHEMA_JSON?: string
  BREADCRUMBS_JSON?: string
  
  // Template conditional flags
  IS_ARTICLE?: boolean
  HAS_FEATURED_IMAGE?: boolean
  HAS_TWITTER_IMAGE?: boolean
  
  // Open Graph specific
  OG_TYPE: string
  OG_TITLE: string
  OG_DESCRIPTION: string
  
  // Twitter card specific
  TWITTER_TITLE: string
  TWITTER_DESCRIPTION: string
  TWITTER_IMAGE_URL?: string
  
  // Article-specific dynamic variables
  ARTICLE_CATEGORY?: string
  ARTICLE_HEADLINE?: string
  SCHEMA_DESCRIPTION?: string
  
  // Image dimensions
  FEATURED_IMAGE_WIDTH?: string
  FEATURED_IMAGE_HEIGHT?: string
  
  // Additional template variables for compatibility
  BODY_CLASSES?: string
  POST_TITLE?: string
  POST_AUTHOR?: string
  POST_CATEGORY?: string
  POST_DATE?: string
}

// Post data interface
export interface PostData {
  id: string
  title: string
  slug: string
  excerpt: string
  content_blocks: any[]
  category: string
  featured_image_id?: string
  published_date?: string
  updated_at?: string
  meta_description?: string
  author_name?: string
}

// Category data interface
export interface CategoryData {
  id: number
  name: string
  slug: string
  post_count?: number
}

// Template validation interface
export interface TemplateValidation {
  isValid: boolean
  missingRequired: string[]
  warnings: string[]
}

// Required fields for template rendering
export const REQUIRED_TEMPLATE_VARIABLES: (keyof TemplateVariables)[] = [
  'PAGE_TITLE',
  'META_DESCRIPTION', 
  'PAGE_URL',
  'POST_CONTENT',
  'OG_TYPE',
  'OG_TITLE',
  'OG_DESCRIPTION',
  'TWITTER_TITLE',
  'TWITTER_DESCRIPTION'
]