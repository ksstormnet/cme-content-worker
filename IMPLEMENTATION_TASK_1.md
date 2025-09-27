# Implementation Task 1: Template Integration and Complete SEO System

**UPDATED**: 2025-09-27 with modernized template architecture and technical decisions

## Task Overview

Implement the complete template system with static variable hardcoding (~15 dynamic variables), CDN CSS integration, R2 image processing, and build-time template bundling. This establishes the foundation for production-quality blog rendering with superior performance.

## Task Objectives

1. **Template System**: Integrate HTML templates with CDN CSS references (21 files already uploaded)
2. **Variable Strategy**: Hardcode static variables, implement ~15 dynamic variables only
3. **Template Compiler**: Build-time template bundling with type safety
4. **R2 Image Processing**: Full-size storage + Cloudflare Image Resizing integration
5. **Performance Optimization**: Full-page caching, compression, CDN optimization

## Implementation Steps

### Step 1: Template System Integration

**Action**: Integrate complete modernized template system with 21 CSS files
```bash
# Copy all templates and CSS
mkdir -p src/templates
cp /data/Development/repo/Cruise-Made-Easy/cme-posts-abstraction/templates/* src/templates/

# Verify complete template system
ls -la src/templates/
# Expected: HTML templates + 21 CSS files (13 minified + 8 components)
```

**Complete Template Files**:
- `page-frame.html` - Main wrapper with CDN CSS references
- `seo-meta-template.html` - Complete SEO metadata (80+ variables)
- `header.html` - Navigation and branding
- `hero.html` - Article hero section  
- `blog-cta.html` - Call-to-action components
- `post-navigation.html` - Previous/next navigation
- `footer.html` - Site footer
- `HEAD-TEMPLATE-VARIABLES.md` - Variable documentation

**Complete CSS Architecture (21 files)**:
- **Core WordPress**: core-blocks.min.css, core-classic-theme.min.css, core-global-styles.min.css, core-variables.css
- **Theme Files**: theme-main.min.css, theme-inline.min.css, theme-dynamic.min.css, theme-fonts.css  
- **Plugins**: plugin-generateblocks.min.css, plugin-fontawesome-*.min.css, plugin-seopress-*.min.css, plugin-dominant-colors.min.css
- **Components**: component-header.css, component-hero.css, component-blog-cta.css, component-post-navigation.css, component-footer.css, component-page-frame.css

### Step 2: Clean Removal of Conflicting Systems

**Action**: Remove all files that conflict with authoritative templates

**Files to DELETE** (Complete removal):
```bash
# Old template systems
rm src/utils/blog-post-template.ts
rm src/utils/component-template.ts  
rm src/utils/html-template.ts
rm src/utils/static-template.ts
rm src/utils/static-template-real.ts

# CSS resolution systems
rm src/utils/css-resolver.ts
rm src/utils/wordpress-css-extractor.ts
rm src/utils/wordpress-generateblocks.ts
rm src/utils/wp-theme-vars.ts

# CSS sync routes
rm src/worker/routes/css-sync.ts
rm src/worker/routes/wordpress-css.ts

# WordPress integration (superseded)
rm src/utils/wp-template-scraper.ts
rm src/utils/wp-api.ts
rm src/utils/wordpress-block-mapper.ts
rm src/worker/routes/wordpress-import.ts
```

**Worker Index Cleanup**: Remove imports and routes for deleted systems:
```typescript
// REMOVE these imports from src/worker/index.ts
// import { cssSyncRoutes } from "./routes/css-sync";
// import wordpressCssRoutes from "./routes/wordpress-css";
// import { htmlTemplateGenerator } from "../utils/html-template";
// import { getCSSMapping } from "../utils/css-resolver";
// import { realStaticTemplate } from "../utils/static-template-real";

// REMOVE these route registrations
// app.route("/api/css", cssSyncRoutes);
// app.route("/api/wordpress-css", wordpressCssRoutes);
```

### Step 3: Template Variable System with Type Safety

**Action**: Create type-safe variable population engine with hardcoded static values

**New File**: `src/types/template-variables.ts`
```typescript
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
}
```

**New File**: `src/utils/template-variables.ts`
```typescript
import { TemplateVariables, PostData } from '../types/template-variables'
import { Env } from '../types/database'
import { renderContentBlocks } from './block-renderer'
import { getImageVariants } from './image-processing'

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
    
    PUBLISHED_DATE: publishedDate?.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    }),
    PUBLISHED_DATE_ISO: publishedDate?.toISOString(),
    MODIFIED_DATE: modifiedDate?.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'  
    }),
    MODIFIED_DATE_ISO: modifiedDate?.toISOString(),
    
    SCHEMA_JSON: generateSchemaJSON(post, imageVariants),
    BREADCRUMBS_JSON: generateBreadcrumbsJSON(post)
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

function renderBlogCTA(): string {
  return `
    <div class="blog-cta">
      <h3>Ready to Plan Your Perfect Cruise?</h3>
      <p>Get personalized cruise recommendations and expert planning advice.</p>
      <a href="/cruise-planning-services/" class="cta-button">Start Planning</a>
    </div>
  `
}

async function renderPostNavigation(post: PostData, env: Env): string {
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
```

### Step 4: Hardcode Static Variables in Templates  

**Action**: Replace template variables with static values directly in HTML

**File**: `src/templates/seo-meta-template.html` and others

**Static Variable Replacements**:
```html
<!-- BEFORE: Dynamic variables -->
<meta property="og:site_name" content="{{SITE_NAME}}">
<meta property="article:publisher" content="{{PUBLISHER_SOCIAL_URL}}">
<meta name="author" content="{{AUTHOR_NAME}}">

<!-- AFTER: Hardcoded values -->
<meta property="og:site_name" content="Cruise Made Easy">
<meta property="article:publisher" content="https://facebook.com/CruiseMadeEASY">
<meta name="author" content="Cruise Made EASY">
```

**Variables to Hardcode** (Never change):
- `{{SITE_NAME}}` → "Cruise Made Easy"
- `{{SITE_URL}}` → "https://cruisemadeeasy.com/"
- `{{PUBLISHER_NAME}}` → "Cruise Made EASY"
- `{{AUTHOR_NAME}}` → "Cruise Made EASY"
- `{{FACEBOOK_URL}}` → "https://facebook.com/CruiseMadeEASY"
- `{{TWITTER_URL}}` → "https://twitter.com/@CruiseMadeEasy"
- All social media URLs and publisher information

**Keep Dynamic** (Change per post):
- `{{PAGE_TITLE}}`, `{{META_DESCRIPTION}}`, `{{PAGE_URL}}`
- `{{POST_CONTENT}}`, `{{HERO_CONTENT}}`, `{{BLOG_CTA_CONTENT}}`
- `{{FEATURED_IMAGE_URL}}`, `{{PUBLISHED_DATE}}`, `{{MODIFIED_DATE}}`

**Result**: Reduce 80+ variables to ~15 dynamic variables

### Step 5: R2 Image Processing System

**Action**: Implement R2 storage + Cloudflare Image Resizing

**New File**: `src/utils/image-processing.ts`
```typescript
import { Env } from '../types/database'

interface ImageVariants {
  original: string
  thumbnail: string      // 150x150
  social: string         // 1024x768 for Twitter/OG
  responsive: {
    small: string        // 320w
    medium: string       // 768w
    large: string        // 1200w
  }
  webp?: {
    original: string
    thumbnail: string
    social: string
  }
}

// Upload image to R2 and generate all variants
export async function uploadImageToR2(
  file: File, 
  env: Env
): Promise<{ id: string, variants: ImageVariants }> {
  // 1. Generate unique filename
  const imageId = generateUniqueId()
  const ext = file.name.split('.').pop()
  const filename = `${imageId}.${ext}`
  
  // 2. Upload full-size to R2
  const r2Key = `blog-images/${new Date().getFullYear()}/${filename}`
  await env.R2_BUCKET.put(r2Key, file.stream())
  
  // 3. Generate Cloudflare Image Resizing URLs
  const baseUrl = `https://cdn.cruisemadeeasy.com/${r2Key}`
  const variants = generateImageVariants(baseUrl)
  
  // 4. Store in database
  await env.DB.prepare(`
    INSERT INTO images (id, filename, r2_key, variants_json)
    VALUES (?, ?, ?, ?)
  `).bind(imageId, filename, r2Key, JSON.stringify(variants)).run()
  
  return { id: imageId, variants }
}

// Generate all Cloudflare Image Resizing URLs
function generateImageVariants(baseUrl: string): ImageVariants {
  return {
    original: baseUrl,
    thumbnail: `${baseUrl}/cdn-cgi/image/width=150,height=150,fit=cover`,
    social: `${baseUrl}/cdn-cgi/image/width=1024,height=768,fit=cover`,
    responsive: {
      small: `${baseUrl}/cdn-cgi/image/width=320,quality=85`,
      medium: `${baseUrl}/cdn-cgi/image/width=768,quality=85`, 
      large: `${baseUrl}/cdn-cgi/image/width=1200,quality=85`
    },
    webp: {
      original: `${baseUrl}/cdn-cgi/image/format=webp,quality=85`,
      thumbnail: `${baseUrl}/cdn-cgi/image/width=150,height=150,format=webp`,
      social: `${baseUrl}/cdn-cgi/image/width=1024,height=768,format=webp`
    }
  }
}
```

### Step 6: Build-Time Template Compiler with Optimization

**Action**: Create build-time template bundling with validation and optimization

**New File**: `build/template-compiler.js`
```javascript
// Build-time template compiler
const fs = require('fs')
const path = require('path')
const minify = require('html-minifier-terser')

const TEMPLATE_DIR = path.join(__dirname, '../src/templates')
const OUTPUT_FILE = path.join(__dirname, '../src/utils/compiled-templates.ts')

// HTML minification options
const minifyOptions = {
  collapseWhitespace: true,
  removeComments: true,
  removeEmptyAttributes: true,
  removeRedundantAttributes: true,
  useShortDoctype: true,
  minifyCSS: false, // Keep CSS references intact
  minifyJS: false   // Keep any inline JS intact
}

async function compileTemplates() {
  console.log('🔄 Compiling templates...')
  
  const templates = {}
  const templateFiles = [
    'page-frame.html',
    'seo-meta-template.html', 
    'header.html',
    'hero.html',
    'blog-cta.html',
    'post-navigation.html',
    'footer.html'
  ]
  
  for (const file of templateFiles) {
    const filePath = path.join(TEMPLATE_DIR, file)
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Template file not found: ${file}`)
    }
    
    const content = fs.readFileSync(filePath, 'utf8')
    const minified = await minify.minify(content, minifyOptions)
    const key = file.replace('.html', '').replace('-', '_').toUpperCase()
    
    templates[key] = minified
    console.log(`✅ Compiled ${file} (${content.length} → ${minified.length} chars)`)
  }
  
  // Generate TypeScript file
  const tsContent = `// Auto-generated template bundle - DO NOT EDIT
// Generated at: ${new Date().toISOString()}

export const COMPILED_TEMPLATES = ${JSON.stringify(templates, null, 2)} as const

export type TemplateNames = keyof typeof COMPILED_TEMPLATES

// Template validation
const REQUIRED_TEMPLATES: TemplateNames[] = [
  'PAGE_FRAME',
  'SEO_META_TEMPLATE', 
  'HEADER',
  'HERO',
  'BLOG_CTA',
  'POST_NAVIGATION',
  'FOOTER'
]

// Validate all required templates are present
for (const template of REQUIRED_TEMPLATES) {
  if (!COMPILED_TEMPLATES[template]) {
    throw new Error(\`Missing required template: \${template}\`)
  }
}

console.log('✅ All templates compiled and validated')
`
  
  fs.writeFileSync(OUTPUT_FILE, tsContent)
  console.log(`📦 Templates bundled to: ${OUTPUT_FILE}`)
  console.log(`📊 Total templates: ${Object.keys(templates).length}`)
  
  return templates
}

if (require.main === module) {
  compileTemplates().catch(console.error)
}

module.exports = { compileTemplates }
```

**New File**: `src/utils/template-renderer.ts`
```typescript
import { TemplateVariables } from '../types/template-variables'
import { COMPILED_TEMPLATES, TemplateNames } from './compiled-templates'

// Template rendering with validation and optimization
export class TemplateRenderer {
  private static instance: TemplateRenderer
  
  static getInstance(): TemplateRenderer {
    if (!TemplateRenderer.instance) {
      TemplateRenderer.instance = new TemplateRenderer()
    }
    return TemplateRenderer.instance
  }
  
  // Render complete page with validation
  renderPage(variables: TemplateVariables): string {
    try {
      // Validate required variables
      this.validateVariables(variables)
      
      // 1. Render SEO metadata with variables
      const seoMeta = this.renderTemplate('SEO_META_TEMPLATE', variables)
      
      // 2. Load static components (header, footer)
      const header = this.getTemplate('HEADER')
      const footer = this.getTemplate('FOOTER')
      
      // 3. Assemble complete page variables
      const pageVariables = {
        ...variables,
        SEO_META_CONTENT: seoMeta,
        HEADER_CONTENT: header,
        FOOTER_CONTENT: footer
      }
      
      // 4. Render final page
      const html = this.renderTemplate('PAGE_FRAME', pageVariables)
      
      // 5. Validate output
      this.validateOutput(html)
      
      return html
      
    } catch (error) {
      console.error('Template rendering error:', error)
      return this.renderErrorPage(error, 'page rendering')
    }
  }
  
  // Safe template rendering with variable substitution
  private renderTemplate(templateName: TemplateNames, variables: Record<string, any>): string {
    const template = this.getTemplate(templateName)
    
    return template.replace(/\{\{([\w_]+)\}\}/g, (match, key) => {
      const value = variables[key]
      
      if (value === undefined || value === null) {
        console.warn(`Missing template variable: ${key} in ${templateName}`)
        return '' // Return empty string for missing variables
      }
      
      // Ensure value is string and escape if needed
      return String(value)
    })
  }
  
  // Get compiled template with validation
  private getTemplate(templateName: TemplateNames): string {
    const template = COMPILED_TEMPLATES[templateName]
    
    if (!template) {
      throw new Error(`Template not found: ${templateName}`)
    }
    
    return template
  }
  
  // Validate required variables are present
  private validateVariables(variables: TemplateVariables): void {
    const required = ['PAGE_TITLE', 'META_DESCRIPTION', 'PAGE_URL', 'POST_CONTENT']
    
    for (const field of required) {
      if (!variables[field]) {
        throw new Error(`Missing required template variable: ${field}`)
      }
    }
  }
  
  // Validate rendered HTML output
  private validateOutput(html: string): void {
    // Basic HTML validation
    if (!html.includes('<!DOCTYPE html>')) {
      throw new Error('Invalid HTML: Missing DOCTYPE')
    }
    
    if (!html.includes('<title>')) {
      throw new Error('Invalid HTML: Missing title tag')
    }
    
    if (html.length < 1000) {
      console.warn('HTML output seems too short:', html.length, 'characters')
    }
  }
  
  // Error page rendering
  private renderErrorPage(error: Error, context: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Unavailable - Cruise Made Easy</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
    .error { color: #666; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>Page Temporarily Unavailable</h1>
  <p class="error">We're having trouble loading this page. Please try again in a few moments.</p>
  <p><a href="/">← Return to Homepage</a></p>
  <!-- Error: ${error.message} in ${context} -->
</body>
</html>`
  }
}

// Export singleton instance
export const templateRenderer = TemplateRenderer.getInstance()
```

**Update Package.json Scripts**:
```json
{
  "scripts": {
    "build:templates": "node build/template-compiler.js",
    "build:worker": "npm run build:templates && wrangler deploy",
    "dev:worker": "npm run build:templates && wrangler dev --local",
    "prebuild": "npm run build:templates"
  },
  "devDependencies": {
    "html-minifier-terser": "^7.2.0"
  }
}
```

### Step 7: Blog Component Rewrite

**Action**: Rewrite blog components to work within template slots

**File**: `src/react-app/components/BlogContent.tsx` (NEW - replaces UnifiedBlogView)
```typescript
import React, { useEffect, useState } from 'react'

// This component renders ONLY the blog content area
// Template provides header, footer, SEO automatically
export default function BlogContent({ 
  category, 
  postSlug 
}: { 
  category?: string
  postSlug?: string 
}) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Fetch blog data via API
  useEffect(() => {
    fetchBlogData()
  }, [category, postSlug])
  
  // This renders ONLY the content area
  // No header, footer, or SEO - template handles that
  return (
    <div className="blog-content-area">
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="posts-grid">
          {posts.map(post => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
```

**File**: `src/react-app/components/PostContent.tsx` (NEW - replaces PostPage)
```typescript
// Renders individual post content within template
export default function PostContent({ 
  category, 
  slug 
}: { 
  category: string
  slug: string 
}) {
  // Fetch post content and render within POST_CONTENT slot
  // Template handles header, footer, SEO, navigation
}
```

**Update Routes**: Modify routing to use new components for content-only rendering

## Development Workflow

### **CRITICAL UPDATE**: Production-Only Development
**Architecture Change**: Eliminate dev/prod parity issues by developing in production mode.

- **Blog Development**: Always use production Worker (template rendering, full-page caching)
- **Admin Development**: Vite for admin interface only (`/admin/*` routes)
- **No Hybrid Routing**: Single rendering path eliminates complexity

### Background Session Setup
```bash
# UPDATED: Production-only development approach
npm run dev:worker    # Background session 1 - Worker in production mode
npm run dev:frontend  # Background session 2 - Vite for admin interface only

# Environment setup REQUIRED before development
# See ENVIRONMENT_CONFIGURATION.md for complete checklist
```

### Testing Approach
1. **Template Loading**: Verify templates load correctly from `src/templates/`
2. **API Endpoints**: Test CSS upload/list/delete endpoints
3. **R2 Integration**: Confirm files upload to correct R2 paths
4. **CDN Access**: Verify CSS files accessible via CDN URLs
5. **Admin Interface**: Test CSS management UI functionality

### Validation Criteria
- [ ] All template files copied to `src/templates/`
- [ ] R2 asset management API endpoints functional
- [ ] CSS files successfully upload to R2 `css/` directory  
- [ ] Template CSS references updated to CDN URLs
- [ ] Admin interface CSS management working
- [ ] All template CSS files accessible via CDN
- [ ] Template loading system implemented
- [ ] No changes made to template HTML content (only CSS hrefs)

## File Structure After Task 1

```
src/
├── templates/              # NEW: Authoritative templates
│   ├── page-frame.html        # Main page wrapper
│   ├── seo-meta-template.html # Complete SEO (static vars hardcoded)
│   ├── header.html            # Site header
│   ├── hero.html              # Post hero section  
│   ├── blog-cta.html          # Call-to-action
│   ├── post-navigation.html   # Previous/next navigation
│   ├── footer.html            # Site footer
│   ├── HEAD-TEMPLATE-VARIABLES.md # Variable documentation
│   └── *.css                  # 21 CSS files from CDN
├── utils/
│   ├── template-variables.ts  # NEW: Variable population
│   ├── template-renderer.ts   # NEW: Template rendering engine
│   ├── image-processing.ts    # NEW: R2 + Cloudflare images
│   └── block-renderer.ts      # Updated: Template-compatible
├── worker/
│   └── index.ts              # Updated: Remove conflicting imports
└── react-app/
    └── components/
        ├── BlogContent.tsx    # NEW: Content-only blog component
        ├── PostContent.tsx    # NEW: Content-only post component
        └── [admin components] # Unchanged: Independent React

# REMOVED FILES:
# - All old template systems (blog-post-template.ts, etc.)
# - CSS resolution systems (css-resolver.ts, etc.)
# - WordPress integration (wp-template-scraper.ts, etc.)
# - Conflicting routes (css-sync.ts, wordpress-css.ts)
```

## Success Metrics

1. **Clean Removal**: All conflicting systems deleted without breaking existing functionality
2. **Template Integration**: Authoritative templates copied and loading correctly
3. **Variable Reduction**: 80+ variables reduced to ~15 dynamic variables via hardcoding
4. **Image Processing**: R2 upload + Cloudflare Image Resizing working
5. **Component Separation**: Blog components render content-only within template slots
6. **Admin Independence**: Admin interface remains completely separate from templates

## Next Steps

After Task 1 completion:
- **Task 2**: Template Rendering Engine - Implement `/api/render-template` endpoint and parameter replacement system
- **Task 3**: Route Architecture - Production blog routing implementation
- **Task 4**: Content Block SSR - React server-side rendering for complex content

---

**CRITICAL REMINDERS**:
- **DELETE first, build second**: Remove all conflicting systems before adding new ones
- **Templates are authoritative**: Use exactly as provided from cme-posts-abstraction
- **Hardcode static variables**: Reduce template complexity by embedding static values
- **Content-only components**: React components render ONLY within template content slots
- **Admin stays independent**: No template inheritance for admin interface
- **Use background Claude sessions**: All development servers in background
- **Commit frequently**: Each major deletion/addition gets its own commit