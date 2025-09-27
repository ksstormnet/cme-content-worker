# AI Implementation Instructions - CME Content Worker

**Context**: These are copy-paste instructions for AI assistants implementing the CME Content Worker in focused context windows.

## Technical Decisions Applied

✅ **CSS Loading**: CDN CSS Loading from `cdn.cruisemadeeasy.com/blog-css/` (21 files already uploaded)  
✅ **Variable Strategy**: Static variables hardcoded in HTML, ~15 dynamic variables with type safety  
✅ **Template Compiler**: Build-time template bundling with validation and optimization  
✅ **Image Processing**: R2 full-size storage + Cloudflare Image Resizing for all variants  

## Context Window 1: Clean Removal + Template Foundation

**Goal**: Remove all conflicting systems and establish clean template integration

### Pre-Context Instructions
```
You are implementing the CME Content Worker template system. The templates are located in ../cme-posts-abstraction/templates/ and contain:

TEMPLATES:
- page-frame.html (main wrapper with 21 CDN CSS links)  
- seo-meta-template.html (80+ SEO variables)
- header.html, hero.html, blog-cta.html, post-navigation.html, footer.html
- HEAD-TEMPLATE-VARIABLES.md (complete variable documentation)

CSS ARCHITECTURE: 21 files total
- Core WordPress (4): core-blocks.min.css, core-classic-theme.min.css, core-global-styles.min.css, core-variables.css
- Theme (4): theme-main.min.css, theme-inline.min.css, theme-dynamic.min.css, theme-fonts.css
- Plugins (7): plugin-generateblocks.min.css, plugin-fontawesome-*.min.css, plugin-seopress-*.min.css, plugin-dominant-colors.min.css  
- Components (6): component-*.css files

TECHNICAL DECISIONS:
1. CDN CSS Loading: Use cdn.cruisemadeeasy.com/blog-css/ URLs directly (no embedded CSS)
2. Complete Variable Population: All 80+ variables for SEO/metadata completeness  
3. Pre-compiled Templates: Build-time compilation to JavaScript functions
4. R2 + Cloudflare Images: Full-size R2 storage, resize with /cdn-cgi/image/ URLs

CRITICAL: Templates are production-ready with accurate WordPress structure. Do not modify HTML structure.
```

### Context Window 1 Tasks
1. **PHASE 1 - CLEAN REMOVAL**: Delete all conflicting systems (see IMPLEMENTATION_TASK_1.md Step 2)
2. **PHASE 2 - TEMPLATE INTEGRATION**: Copy all templates from `../cme-posts-abstraction/templates/` to `src/templates/`
3. **PHASE 3 - HARDCODE STATIC VARS**: Replace static variables directly in HTML templates
4. **PHASE 4 - TYPE-SAFE VARIABLES**: Create TypeScript interfaces and validation for ~15 dynamic variables
5. **PHASE 5 - BUILD SYSTEM**: Implement build-time template compilation with validation

### Context Window 1 Success Criteria
- [ ] All conflicting files deleted (18+ files removed cleanly)
- [ ] All templates copied to `src/templates/` (7 HTML + 21 CSS files)
- [ ] Static variables hardcoded in seo-meta-template.html and other templates
- [ ] Dynamic variable system created (~15 variables only)
- [ ] Basic template rendering works (page-frame.html + variables)
- [ ] Worker index.ts updated (removed conflicting imports/routes)
- [ ] Clean git commits for removal and addition phases

## Context Window 2: R2 Image Processing System

**Goal**: Implement R2 storage + Cloudflare Image Resizing with all variants

### Pre-Context Instructions  
```
You are implementing the image processing system for CME Content Worker. 

IMAGE STRATEGY: R2 + Cloudflare Image Resizing
- Store ONLY full-size images in R2 bucket (cruisemadeeasy-images)
- Generate all variants using Cloudflare Image Resizing service
- URL pattern: /cdn-cgi/image/width=150,height=150/{image-id}.jpg
- Support WebP conversion, quality optimization, responsive sizes

REQUIRED IMAGE VARIANTS:
- FEATURED_IMAGE_URL: full-size original
- FEATURED_IMAGE_THUMBNAIL: 150x150 thumbnail
- TWITTER_IMAGE_URL: 1024x768 social sharing
- Responsive breakpoints: 320w, 480w, 768w, 1024w, 1200w
- WebP variants for supported browsers

R2 CONFIGURATION:
- Bucket: cruisemadeeasy-images  
- Storage path: /blog-images/{year}/{month}/{unique-id}.{ext}
- Access: Public read via Cloudflare CDN
- Upload: Direct from admin interface

The existing R2 bucket is already configured. Focus on upload logic and URL generation.
```

### Context Window 2 Tasks
1. Create image processing utilities (`src/utils/image-processing.ts`)
2. Implement R2 upload with unique filename generation and proper paths
3. Create Cloudflare Image Resizing URL generator for all required variants
4. Update image upload API (`src/worker/routes/media.ts`) to use new system
5. Add image management to admin interface (enhance existing MediaLibrary)
6. Integrate image variants into template variable population
7. Test complete workflow: upload → R2 → variants → template variables

### Context Window 2 Success Criteria
- [ ] Images upload successfully to R2 bucket
- [ ] Unique filenames generated (no collisions)
- [ ] Cloudflare Image Resizing URLs generated correctly
- [ ] All required image variants populate template variables
- [ ] Admin interface handles image upload/management
- [ ] WebP conversion works for supported browsers

## Context Window 3: Blog Component Rewrite

**Goal**: Rewrite blog components to render content-only within template slots

### Pre-Context Instructions
```
You are rewriting the blog components to work within the template system architecture.

CURRENT PROBLEM:
- UnifiedBlogView.tsx and PostPage.tsx render complete pages with their own headers/footers
- These conflict with the authoritative templates that provide header/footer/SEO
- Need content-only components that render within template slots

TEMPLATE ARCHITECTURE:
page-frame.html provides the shell:
- {{HEADER_CONTENT}} - Site header, navigation, branding
- {{HERO_CONTENT}} - Post/category hero section
- {{POST_CONTENT}} - Main content area (React components mount here)
- {{BLOG_CTA_CONTENT}} - Call-to-action sections
- {{POST_NAVIGATION_CONTENT}} - Previous/next post navigation
- {{FOOTER_CONTENT}} - Site footer

REACT COMPONENTS SHOULD:
- Render ONLY the main content area
- No headers, footers, navigation, or SEO tags
- Fetch data via API and display content
- Work in both development (full React) and production (template shell)

ROUTING STRATEGY:
- Development: React Router handles everything (current behavior)
- Production: Worker renders template shell, React components populate content slots
```

### Context Window 3 Tasks
1. Analyze current UnifiedBlogView.tsx and PostPage.tsx components
2. Create new BlogContent.tsx component (content-only blog listing)
3. Create new PostContent.tsx component (content-only post rendering)
4. Update React routing to use new content-only components
5. Ensure components work in both development and production modes
6. Test component rendering within template slots
7. Remove or refactor old blog components

### Context Window 3 Success Criteria
- [ ] New BlogContent.tsx renders blog listings content-only
- [ ] New PostContent.tsx renders individual posts content-only
- [ ] Components fetch data via existing APIs
- [ ] React routing updated to use new components
- [ ] Components work in both development and production modes
- [ ] No duplicate headers, footers, or SEO tags in components
- [ ] Old UnifiedBlogView and PostPage properly removed/replaced

## Context Window 4: Template Rendering Engine

**Goal**: Complete template rendering system with Worker integration

### Pre-Context Instructions
```
You are implementing the final template rendering engine for CME Content Worker.

RENDERING ARCHITECTURE:
- Pre-compiled templates as JavaScript functions (build-time compilation)  
- Variable population from database + computed values
- Component assembly: header + hero + content + CTA + navigation + footer
- Full HTML output with CDN CSS links and complete SEO metadata
- Performance target: <50ms template rendering time

TEMPLATE FLOW:
1. Load post data from database (with content blocks)
2. Generate all 80+ template variables  
3. Assemble component templates (header, hero, etc.)
4. Compile final HTML with seo-meta-template
5. Return complete HTML response

PERFORMANCE OPTIMIZATIONS:
- Pre-compiled templates (no runtime parsing)
- Variable computation caching where possible
- Efficient database queries with joins
- Response compression and caching headers

The templates are already integrated and variables defined. Focus on rendering performance.
```

### Context Window 4 Tasks
1. Complete template rendering engine (`src/utils/template-renderer.ts`)
2. Integrate with Worker routes (homepage, category, post routes)
3. Update Worker index.ts to use new template system
4. Remove old template system references completely
5. Test complete rendering: database → variables → template → HTML
6. Add error handling and fallbacks
7. Performance optimization and caching

### Context Window 4 Success Criteria
- [ ] Template rendering engine works with all templates
- [ ] Worker routes use new template system (/, /category/:slug, /:category/:slug)
- [ ] All old template system references removed from Worker
- [ ] Complete HTML pages render with CDN CSS
- [ ] Template variables populate correctly from database
- [ ] Error handling for missing templates/variables
- [ ] Performance meets targets (<50ms rendering, <2s page load)

## Context Window 5: SEO System & Final Integration

**Goal**: Complete SEO metadata system and final testing

### Pre-Context Instructions
```
You are completing the SEO system and final integration for CME Content Worker.

SEO REQUIREMENTS:
Since most variables are now hardcoded in templates, focus on:
- Dynamic SEO variables: PAGE_TITLE, META_DESCRIPTION, PAGE_URL
- Featured image integration with all variants
- Published/modified dates and ISO formatting
- Schema.org structured data for BlogPosting
- Breadcrumb generation for posts and categories

FINAL INTEGRATION:
- Complete end-to-end testing (database → template → HTML)
- SEO validation with testing tools
- Performance optimization and monitoring
- Error handling and edge cases
- Production deployment preparation

The system should now render WordPress-quality pages with superior performance.
```

### Context Window 5 Tasks
1. Implement remaining SEO features (breadcrumbs, schema.org structured data)
2. Complete featured image integration with R2/Cloudflare variants
3. Add published/modified date handling and ISO formatting
4. Create comprehensive testing for all routes and components
5. SEO validation with testing tools (Google Rich Results, social media debuggers)
6. Performance optimization and final benchmarking
7. Production deployment preparation and documentation

### Context Window 5 Success Criteria
- [ ] Complete SEO system working (breadcrumbs, schema.org, metadata)
- [ ] Featured images working with all R2/Cloudflare variants
- [ ] All routes rendering correctly (/, /category/:slug, /:category/:slug)
- [ ] SEO validation tools show complete metadata
- [ ] Performance targets met (page load <2s, template rendering <50ms)
- [ ] Error handling and edge cases covered
- [ ] Production deployment ready with documentation

## Critical Implementation Notes

### **PRODUCTION-ONLY DEVELOPMENT**
**MANDATORY ARCHITECTURE CHANGE**: Eliminate dev/prod parity by developing in production mode.

- **Blog Development**: Always use production Worker with template rendering
- **Admin Development**: Vite for admin interface only (`/admin/*`)
- **Server-Side Rendering**: Worker renders complete HTML with full-page caching
- **Build-Time Templates**: Templates bundled into Worker for maximum performance

### Background Session Management
**MANDATORY**: All development servers must run in Claude-controlled background sessions:
```bash
# Session 1: Worker in production mode (blog templates + API)
npm run dev:worker    # Background: true, ENVIRONMENT=production

# Session 2: Vite for admin interface only  
npm run dev:frontend  # Background: true, admin routes only
```

### Environment Setup Required
**CRITICAL**: Complete `ENVIRONMENT_CONFIGURATION.md` checklist before implementation:
- Cloudflare Worker, D1, R2 configuration
- CDN CSS file uploads (21 files)
- Image Resizing verification
- Database schema migrations

### Commit Protocol
**REQUIRED**: Frequent commits after each major change:
```bash
git add [files]
git commit -m "Descriptive message

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Environment Variables Required
```bash
# R2 Configuration
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key  
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=cruisemadeeasy-images

# CDN Configuration
CDN_BASE_URL=https://cdn.cruisemadeeasy.com
BLOG_CSS_BASE_URL=https://cdn.cruisemadeeasy.com/blog-css
```

### File Structure Overview
```
src/
├── templates/              # All HTML templates + CSS files
├── utils/
│   ├── template-compiler.ts    # Template compilation system
│   ├── template-variables.ts   # Variable population engine  
│   ├── seo-generator.ts        # SEO metadata generation
│   └── template-renderer.ts    # Final rendering engine
├── worker/routes/
│   ├── images.ts              # Image upload/management API
│   └── render.ts              # Template rendering endpoints
└── react-app/components/
    └── ImageManager.tsx       # Image management interface
```

---

**These instructions ensure each context window has complete context and clear deliverables for focused, efficient implementation.**