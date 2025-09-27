# CME Content Worker - Hybrid Architecture Implementation Plan

**PROJECT TRANSFORMATION**: Pure React app → Hybrid architecture with templated public blog + pure React admin

## Architecture Overview

### Current vs Target Architecture

**BEFORE** (Current):
- Single React application serving all routes
- Worker serves API endpoints only
- Blog content rendered client-side
- Layout jumping during component loading

**AFTER** (Target):
- **Admin Interface**: Pure React application (`/admin/*` routes)
- **Public Blog**: Server-rendered HTML templates (`/`, `/category/*`, `/:category/:slug`)
- **Hybrid Content**: Static templates + React server-side rendering for content blocks
- **No Layout Jumps**: Static header/hero/footer components

### Dual Application Architecture

#### 1. Pure React Admin Application
- **Routes**: `/admin/*`
- **Purpose**: Content management, AI generation, media library, user management
- **Technology**: React 19.0.0, client-side routing, dynamic components
- **Authentication**: Cookie-based sessions
- **No Changes**: Preserve all existing admin functionality

#### 2. Hybrid Public Blog Application
- **Routes**: `/`, `/category/*`, `/:category/:slug`
- **Purpose**: Public-facing blog content
- **Technology**: Server-rendered HTML templates + React SSR components
- **Content**: Static layout + dynamic post content + interactive elements
- **SEO Optimized**: Server-side rendering for better search indexing

## Template System Architecture

### HTML Template Structure
- **Location**: Templates extracted to `/templates` directory (already extracted)
- **Format**: Static HTML files with `{{PARAMETER_NAME}}` placeholders
- **Rendering**: Server-side parameter replacement at request time
- **Caching**: Fully cacheable static HTML output

### Template Files (Already Available)
```
/data/Development/repo/Cruise-Made-Easy/cme-posts-abstraction/templates/
├── page-frame.html        # Main page structure
├── header.html           # Navigation and branding
├── hero.html            # Post title and metadata
├── blog-cta.html        # Call-to-action sections
├── post-navigation.html # Previous/next post links
├── footer.html          # Site footer
├── header.css           # Header component styles
├── hero.css            # Hero component styles
├── blog-cta.css        # CTA component styles
└── post-navigation.css  # Navigation component styles
```

### Template Parameter System
- **Page Level**: `{{PAGE_TITLE}}`, `{{BODY_CLASSES}}`
- **Post Data**: `{{POST_TITLE}}`, `{{POST_AUTHOR}}`, `{{POST_CATEGORY}}`, `{{POST_DATE}}`
- **Content**: `{{POST_CONTENT}}` (rendered via React SSR)
- **Navigation**: `{{PREV_POST_URL}}`, `{{NEXT_POST_URL}}`, etc.
- **Components**: `{{HEADER_CONTENT}}`, `{{HERO_CONTENT}}`, `{{FOOTER_CONTENT}}`, etc.

## Asset Management System

### R2 CDN Integration
- **CSS Files**: Upload template CSS files to R2 `css/` folder
- **Images**: Existing R2 image management (no changes)
- **CDN URLs**: Hardcode CDN paths in templates (no runtime overhead)
- **Required CSS**: `page-frame.css`, `footer.css` (missing, need extraction)

### Asset Upload API
- **New Endpoints**: 
  - `POST /api/assets/css/upload` - Upload CSS files to R2
  - `GET /api/assets/css/list` - List CSS files in R2
  - `DELETE /api/assets/css/:filename` - Remove CSS files
- **Admin Integration**: CSS management interface in admin dashboard
- **Template Updates**: Replace relative CSS paths with CDN URLs

## Content Rendering System

### React Server-Side Rendering
- **Content Blocks**: Use existing React components with ReactDOMServer.renderToString()
- **Block Types**: Support all existing types (heading, paragraph, image, accent_tip, quote, cta, divider, list, table, columns, container, section, etc.)
- **Custom Styling**: Preserve inline style attributes and CSS classes from database
- **No Duplication**: Reuse existing React component logic

### Hybrid Rendering Strategy
- **Static Structure**: Header, hero, footer rendered from templates
- **Dynamic Content**: Post content blocks rendered via React SSR
- **Interactive Elements**: Filter buttons pre-rendered with React SSR, enhanced with client-side hydration
- **Layout Stability**: No jumping during load, all layout elements static

## Development Workflow Integration

### Vite Development Environment
- **Current Challenge**: Need Worker rendering in dev for template testing
- **Solution**: New API endpoint `/api/render-template` 
- **Dev Flow**: Vite calls Worker API for server-side rendering preview
- **Fast Iteration**: Maintain Vite HMR while testing actual Worker rendering

### Template Rendering API
```typescript
POST /api/render-template
{
  "template": "post" | "category" | "homepage",
  "data": {
    "page_title": string,
    "body_classes": string,
    "post": { /* post data */ },
    "navigation": { /* prev/next */ },
    "custom_css": string // optional inline styles
  }
}

Response: Complete rendered HTML string
```

## API Cleanup Requirements

### Deprecated Endpoints (Remove)
- **CSS Scraping Routes**: Remove CSS monitoring and scraping functionality
- **Bulk Image Upload**: Remove bulk upload routes (replaced by standard upload)
- **Legacy Routes**: Any routes related to pure React blog rendering

### Enhanced Endpoints (Modify)
- **Asset Management**: Add R2 CSS upload/management capabilities
- **Template Rendering**: New `/api/render-template` endpoint
- **Content APIs**: Ensure compatibility with template parameter needs

## Route Architecture

### Development Routing (Background Sessions Required)
```
Vite Server (localhost:5174):
├── /admin/* → React Router (admin interface)
├── / → React Router → fetch data via API → render blog homepage
├── /category/* → React Router → fetch data via API → render category pages  
├── /:category/:slug → React Router → fetch data via API → render post pages
└── /api/* → Proxy to Worker

Worker Server (localhost:8787):
├── /api/* → API endpoints only
└── /api/render-template → Template rendering for Vite preview
```

### Production Routing
```
Worker (blog.cruisemadeeasy.com):
├── /admin/* → Serve React build files (static)
├── /assets/* → Serve React build assets (static)
├── / → Server-rendered blog homepage (template)
├── /category/* → Server-rendered category pages (template)
├── /:category/:slug → Server-rendered post pages (template)
└── /api/* → API endpoints
```

## Implementation Task Breakdown

This implementation is divided into multiple task documents:

### Task 1: Template Integration and Asset Management
- Copy templates to project
- Implement R2 CSS upload system
- Create asset management API endpoints
- Update template CSS references to CDN URLs
- Admin interface for CSS management

### Task 2: Template Rendering Engine
- Implement `/api/render-template` endpoint
- Parameter replacement system
- React SSR integration for content blocks
- Template loading and caching

### Task 3: Route Architecture Transformation  
- Implement production blog routing in Worker
- Server-side template rendering for public routes
- Preserve admin React routing
- Update development proxy configuration

### Task 4: Content Block SSR System
- React server-side rendering setup
- All content block types support
- Custom styling preservation (inline styles)
- Component logic reuse

### Task 5: Filter Button Enhancement
- Pre-render category filter buttons
- Client-side hydration for interactivity
- Layout stability improvements
- React component enhancement

### Task 6: API Cleanup and Testing
- Remove deprecated CSS scraping routes
- Remove bulk image upload routes
- End-to-end testing of hybrid architecture
- Performance optimization

## Critical Success Factors

### Layout Stability (Primary Goal)
- **Static Layout**: Header, hero, footer prevent jumping
- **Pre-rendered Elements**: Filter buttons rendered server-side
- **No Client Loading**: Essential layout elements available immediately

### Development Experience
- **Fast Iteration**: Vite HMR maintained for admin development
- **Template Testing**: `/api/render-template` provides real Worker rendering in dev
- **Background Sessions**: Prevent Claude session hijacking during development

### Content Quality Preservation
- **React Components**: Reuse existing component logic exactly
- **All Block Types**: Support complete content block system
- **Custom Styling**: Preserve all styling from admin interface
- **HTML Fidelity**: Keep extracted templates unchanged

### Performance Optimization
- **Caching**: Static HTML fully cacheable
- **CDN Assets**: CSS and images served from R2
- **Server Rendering**: Eliminate client-side layout calculations
- **Progressive Enhancement**: Base functionality works without JavaScript

## Implementation Guidelines

### Phase Approach
1. **Template Integration** (Task 1) - Foundation setup
2. **Rendering Engine** (Task 2) - Core functionality  
3. **Route Architecture** (Task 3) - Production routing
4. **Content System** (Task 4) - Complex content blocks
5. **Interactive Enhancement** (Task 5) - User experience
6. **Cleanup & Testing** (Task 6) - Production readiness

### Quality Standards
- **No Template Changes**: Keep extracted HTML exactly as provided
- **Component Reuse**: Never duplicate React component logic
- **Layout Stability**: Zero layout shift during page load
- **Admin Preservation**: No changes to admin interface functionality
- **Performance**: Improve page load speed and caching

### Testing Approach
- **Development**: Use Vite + `/api/render-template` for template testing
- **Template Accuracy**: Compare rendered output with original WordPress
- **Admin Functionality**: Ensure no regression in admin features
- **Route Handling**: Test all public and admin routes
- **Content Rendering**: Verify all block types render correctly

---

**NEXT STEPS**: Review this plan, then proceed with Task 1 implementation document creation.