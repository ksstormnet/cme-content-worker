# CME Content Worker - Page Layout Implementation

## Overview

This documentation contains a comprehensive 6-phase implementation plan to duplicate the page layout from `https://cruisemadeeasy.com/the-fall-cruise-strategy-most-people-get-wrong/` by integrating static HTML templates with React components in the CME Content Worker system.

## Architecture Strategy

- **Hybrid Approach**: Static HTML shell (header/footer) + React components (dynamic content)
- **CSS Foundation**: 23 optimized files already in R2 bucket (`cruisemadeeasy-images`)
- **Development**: Background sessions required (Vite :5174, Worker :8787)
- **Incremental Workflow**: Add component → test → fix → iterate → next component

## Implementation Phases

Each phase is designed to be completed autonomously within one context window, with complete context and clear success criteria.

### [Phase 1: CSS Foundation Setup](./phase-1-css-foundation.md)
**Goal**: Establish R2 CSS loading and resolve any conflicts with existing React app  
**Duration**: 1 context window  
**Deliverable**: PostPage with proper CSS references, no visual conflicts

- Add R2 CSS link elements to PostPage
- Test for styling conflicts and layout breaks
- Create CSS loading utility function for reuse
- Document any override classes needed

### [Phase 2: Static Header Integration](./phase-2-static-header.md)
**Goal**: Add responsive navigation header from `sticky-header.html` template  
**Duration**: 1 context window  
**Deliverable**: Working header component with mobile navigation and CTAs

- Extract header template from static HTML
- Convert to React component with mobile menu state
- Add sticky positioning with proper z-index
- Test responsive behavior across screen sizes

### [Phase 3: Dynamic Hero Block](./phase-3-dynamic-hero.md)
**Goal**: Create React hero component with dynamic background image, title, metadata  
**Duration**: 1 context window  
**Deliverable**: Hero section matching target layout with dynamic post data

- Implement CSS custom property for background images
- Add responsive text sizing and mobile optimization
- Handle fallback cases for missing featured images
- Wire up to existing PostPage data structure

### [Phase 4: Breadcrumbs & Content Structure](./phase-4-breadcrumbs-structure.md)
**Goal**: Add breadcrumb navigation and proper content container structure  
**Duration**: 1 context window  
**Deliverable**: Complete content area scaffolding with navigation context

- Create Breadcrumbs component with hierarchical navigation
- Implement proper WordPress container structure
- Add semantic HTML with accessibility attributes
- Reorganize PostPage content into structured containers

### [Phase 5: Static CTA & Footer](./phase-5-cta-footer.md)
**Goal**: Add call-to-action section and footer from existing templates  
**Duration**: 1 context window  
**Deliverable**: Complete page shell with all static components

- Create StaticCTA component with booking widget integration
- Implement Footer with three-column layout and social links
- Add legal navigation and company branding
- Test responsive behavior and external link functionality

### [Phase 6: Post Navigation & Polish](./phase-6-navigation-polish.md)
**Goal**: Dynamic prev/next post navigation and final layout refinements  
**Duration**: 1 context window  
**Deliverable**: Fully functional page layout matching target design

- Implement PostNavigation component with prev/next post links
- Add featured image thumbnails with fallback handling
- Create responsive navigation layout with proper arrows
- Perform final testing and layout refinements

## Key Technologies & Assets

### CSS Foundation
- **R2 CDN Assets**: 23 optimized CSS files in `cruisemadeeasy-images` bucket
- **Key Files**: `generatepress-main.min.css`, `wp-block-library.min.css`, `generateblocks-complete.min.css`
- **Dynamic Resolution**: Worker automatically selects appropriate stylesheets

### Template Sources
- `temp-components/sticky-header.html` - Header template
- `temp-components/footer.html` - Footer template  
- `src/utils/blog-post-template.ts` - CTA and navigation templates
- `temp-components/article-card.html` - Hero block reference

### Development Environment
- **Vite Dev Server**: `:5174` (serves ALL routes in development)
- **Worker API Server**: `:8787` (serves ONLY `/api/*` routes in development)
- **Background Sessions**: Both servers MUST run in Claude-controlled background bash sessions

## Development Workflow

### Mandatory Setup
```bash
# CRITICAL: Both must run in background via Bash tool
npm run dev:frontend    # Vite dev server (:5174)
npm run dev:worker      # Worker API server (:8787)
```

### Testing Protocol
- **Primary Testing**: `http://localhost:5174` (Vite serves all routes)
- **API Verification**: `http://localhost:8787/api/css/status`
- **CSS Assets**: Verify loading from `/api/css/css/[filename]`

### Git Workflow
- **Branch**: `feature/page-layout-integration`
- **Commit after each phase** completion
- **Include Claude Code attribution** in commit messages

## Target Layout Components

### Static HTML Templates (from existing files)
1. **Sticky Header** - Navigation, logo, CTAs
2. **Footer** - Legal links, social media, copyright
3. **Static CTA** - "How Can I Help Plan Your Perfect NCL Cruise?"

### React Components (dynamic content)
1. **Hero Block** - Background image, title, date, category, author
2. **Breadcrumbs** - Dynamic navigation path
3. **Content Area** - Existing block-based content system
4. **Post Navigation** - Dynamic prev/next posts with thumbnails

## Success Criteria

### Technical Requirements
- All components render without errors
- CSS loads efficiently from R2 CDN
- No styling conflicts between components
- Mobile responsive across all screen sizes
- Navigation and CTAs function correctly

### Visual Requirements
- Layout matches target design exactly
- Typography and spacing specifications met
- Responsive behavior works on mobile and desktop
- Images load with proper fallbacks
- Interactive elements have appropriate hover states

### Integration Requirements
- Clean integration with existing React app
- No conflicts with current PostPage functionality
- Proper WordPress container structure maintained
- SEO and accessibility standards met

## Agent Requirements

Per project `CLAUDE.md`, utilize these agents throughout the implementation:

- **fullstack-developer**: Backend/frontend integration tasks
- **ui-designer**: Layout and responsive design decisions
- **agent-organizer**: Multi-step task coordination
- **context-manager**: State and data consistency management

## Getting Started

1. **Review Phase 1 document** to understand CSS foundation setup
2. **Ensure development servers** are running in background sessions
3. **Start with Phase 1** and complete each phase sequentially
4. **Test thoroughly** at each phase before moving to the next
5. **Commit changes** after each completed phase

Each phase document contains complete context, implementation steps, testing protocols, and validation checklists for autonomous execution.

---

**The implementation will result in a complete page layout that matches the target design while being fully integrated with your React-based CME Content Worker system and optimized for Cloudflare Workers deployment.**