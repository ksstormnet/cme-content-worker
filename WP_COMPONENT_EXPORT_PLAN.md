# WordPress Component Export - Multi-Session Implementation Plan

**Created**: 2025-09-21  
**Status**: Ready for Implementation  
**Context**: Split into 6 independent sessions for Claude context window management

## Overview

Extract WordPress GeneratePress/GenerateBlocks components via REST API and convert to React components for post editor integration. Each session is designed to be self-contained and executable in a single Claude context window.

## Prerequisites

**WordPress Site Access**:
- URL: https://cruisemadeeasy.com/
- REST API: https://cruisemadeeasy.com/wp-json/
- Credentials: support-team / "TMIi 8E5g NPxn 9B7F y4T0 L86q"
- Access Level: Admin rights required

**Project Structure**:
- WordPress exports: `./wp-components/`
- Generated React components: `./src/components/wp-blocks/`
- Utilities: `./src/utils/wp-*.ts`
- Scripts: `./scripts/`

---

## Session 1: WordPress REST API Discovery & Authentication
**Duration**: 1 Claude context window  
**Dependencies**: None  

### Scope
Establish connection to WordPress REST API and discover available endpoints for data export.

### Tasks
1. **API Authentication Setup**
   - Configure Basic Auth with support-team credentials
   - Test connection to https://cruisemadeeasy.com/wp-json/
   - Verify admin-level access permissions

2. **Endpoint Discovery**
   - List all available REST API endpoints
   - Identify GeneratePress/GenerateBlocks specific endpoints
   - Document endpoint capabilities and parameters

3. **Utility Creation**
   - Build authentication helper functions
   - Create API request utilities with error handling
   - Implement rate limiting (2-3 requests/second max)

### Deliverables
- `./wp-components/api-config.json` - Connection settings and credentials
- `./wp-components/endpoints-discovered.json` - Available endpoints list
- `./src/utils/wp-api.ts` - Authentication and request utilities
- Connection test results and permissions verification

### Success Criteria
- Successful authentication to WordPress REST API
- Complete endpoint discovery documented
- Reusable API utilities ready for subsequent sessions

---

## Session 2: Block Types & Patterns Export
**Duration**: 1 Claude context window  
**Dependencies**: Session 1 (API utilities)

### Scope
Export complete WordPress block system including custom GeneratePress/GenerateBlocks.

### Tasks
1. **Block Types Export**
   - GET `/wp/v2/block-types` - All registered block types
   - Filter GenerateBlocks (`generateblocks/*`) and GeneratePress blocks
   - Extract block attributes, supports, and configuration

2. **Block Patterns Export**
   - GET `/wp/v2/block-patterns/patterns` - Reusable block patterns
   - GET `/wp/v2/block-patterns/categories` - Pattern categories
   - Focus on GeneratePress theme patterns

3. **Template Parts Export**
   - GET `/wp/v2/template-parts` - Header, footer, sidebar components
   - GET `/wp/v2/templates` - Full page templates
   - Extract GeneratePress template structure

4. **Data Organization**
   - Separate GeneratePress/GenerateBlocks from core WordPress blocks
   - Validate JSON structure and completeness
   - Create index of available components

### Deliverables
- `./wp-components/block-types.json` - All WordPress block definitions
- `./wp-components/block-patterns.json` - Reusable patterns and templates
- `./wp-components/template-parts.json` - Theme template components
- `./wp-components/generatepress-blocks.json` - Filtered GP/GB blocks only

### Success Criteria
- Complete export of WordPress block ecosystem
- GeneratePress components identified and separated
- Valid JSON structure ready for React conversion

---

## Session 3: Theme Settings & CSS Variables Export
**Duration**: 1 Claude context window  
**Dependencies**: Session 1 (API utilities)

### Scope
Extract GeneratePress theme configuration and CSS variable system.

### Tasks
1. **Theme Settings Export**
   - GET `/wp/v2/settings` - WordPress site settings
   - Extract GeneratePress customizer settings
   - GET GeneratePress theme-specific endpoints if available

2. **CSS Variables Extraction**
   - Extract CSS custom properties from theme settings
   - Map `--accent`, `--base-*`, `--gb-*` variables from inline CSS
   - Document color schemes and typography settings

3. **Theme Configuration Analysis**
   - Parse responsive breakpoints and grid settings
   - Extract layout configurations and spacing
   - Document theme feature toggles and options

4. **Variable Mapping System**
   - Create React-compatible CSS variable mapping
   - Build theme configuration TypeScript interfaces
   - Enable dynamic theming in React components

### Deliverables
- `./wp-components/theme-settings.json` - Complete theme configuration
- `./wp-components/css-variables.json` - CSS custom properties
- `./wp-components/color-schemes.json` - Theme color definitions
- `./src/utils/wp-theme-vars.ts` - React theme variable utilities

### Success Criteria
- Complete GeneratePress theme configuration captured
- CSS variable system ready for React integration
- Theme utilities available for dynamic styling

---

## Session 4: Media Library Export & Download Script
**Duration**: 1 Claude context window  
**Dependencies**: Session 1 (API utilities)

### Scope
Export media library metadata and create bulk download system for overnight processing.

### Tasks
1. **Media Library Export**
   - GET `/wp/v2/media` - Complete media library with pagination
   - Extract metadata: titles, alt text, captions, file paths
   - Document image sizes and responsive variants

2. **File Inventory Creation**
   - Create comprehensive file list with URLs and metadata
   - Map WordPress upload directory structure
   - Calculate total download size and file counts

3. **Bulk Download Script**
   - Build Node.js/TypeScript download manager
   - Implement parallel downloads with rate limiting
   - Add progress tracking and error handling with retry logic

4. **Download Management**
   - Create resume capability for interrupted downloads
   - Implement file validation and integrity checking
   - Generate download logs and success/failure reports

### Deliverables
- `./wp-components/media-library.json` - Complete media metadata
- `./scripts/download-media.ts` - Overnight bulk download script
- `./wp-components/media/` - Directory structure for downloads
- Download progress and logging system

### Success Criteria
- Complete media library inventory exported
- Functional overnight download script ready
- Error handling and progress tracking implemented

---

## Session 5: Block-to-React Component Generation
**Duration**: 1 Claude context window  
**Dependencies**: Sessions 2 & 3 (block data and theme settings)

### Scope
Convert WordPress block configurations to functional React components.

### Tasks
1. **Block Parser Development**
   - Build JSON-to-React conversion system
   - Parse block attributes and convert to React props
   - Handle block validation and default values

2. **Component Generation**
   - Generate React component for each WordPress block type
   - Create TypeScript interfaces for block attributes
   - Implement WordPress block rendering behavior

3. **Styling Integration**
   - Extract CSS from block configurations
   - Convert WordPress styles to CSS-in-JS or CSS modules
   - Integrate theme variables and responsive breakpoints

4. **Component Library Structure**
   - Organize components by category (GeneratePress, GenerateBlocks, Core)
   - Create component index and documentation
   - Build component testing framework

### Deliverables
- `./src/components/wp-blocks/` - Generated React components directory
- `./src/types/wp-blocks.ts` - TypeScript block definitions
- `./src/utils/block-parser.ts` - Block conversion utilities
- Component documentation and usage examples

### Success Criteria
- All WordPress blocks converted to React components
- Styling matches original WordPress appearance
- Components ready for post editor integration

---

## Session 6: Post Editor Block Integration
**Duration**: 1 Claude context window  
**Dependencies**: Session 5 (React components)

### Scope
Integrate WordPress blocks into React post editor with full editing capabilities.

### Tasks
1. **Block Picker Interface**
   - Create WordPress-style block inserter UI
   - Implement search and categorization
   - Add drag-and-drop block insertion

2. **Block Configuration System**
   - Build attribute editing panels for each block type
   - Create property controls (colors, spacing, typography)
   - Implement live preview updates

3. **Editor Integration**
   - Integrate block system with existing FreeFormEditor
   - Add block manipulation (move, copy, delete)
   - Implement undo/redo for block operations

4. **Preview & Validation**
   - Create live styled preview system
   - Validate block configurations against WordPress schema
   - Test complete editing workflow

### Deliverables
- `./src/components/BlockPicker.tsx` - WordPress-style block inserter
- `./src/components/BlockConfigPanel.tsx` - Block attribute editor
- `./src/components/BlockPreview.tsx` - Live preview system
- Updated `./src/components/FreeFormEditor.tsx` with WordPress blocks

### Success Criteria
- Complete WordPress-compatible block editing interface
- Live preview matches WordPress Gutenberg experience
- Seamless integration with existing post editor

---

## Implementation Guidelines

### Session Handoffs
Each session should:
1. **Start** by reading relevant deliverables from previous sessions
2. **Validate** input data structure and completeness
3. **Create** all specified deliverables with proper error handling
4. **Document** any issues or deviations from plan
5. **Test** deliverables before session completion

### File Organization
```
./wp-components/          # WordPress export data
├── api-config.json
├── block-types.json
├── block-patterns.json
├── template-parts.json
├── generatepress-blocks.json
├── theme-settings.json
├── css-variables.json
├── color-schemes.json
├── media-library.json
└── media/                # Downloaded files

./src/components/wp-blocks/  # Generated React components
├── generatepress/
├── generateblocks/
├── core/
└── index.ts

./src/utils/              # WordPress utilities
├── wp-api.ts
├── wp-theme-vars.ts
├── block-parser.ts
└── wp-types.ts

./scripts/                # Automation scripts
└── download-media.ts
```

### Error Handling
- Implement exponential backoff for API requests
- Validate all JSON exports before saving
- Log errors with context for debugging
- Provide fallback behavior for missing data

### Rate Limiting
- Maximum 2-3 requests per second to WordPress API
- Implement request queuing for bulk operations
- Add delay between paginated requests
- Monitor for rate limiting responses

## Final Integration

After all sessions complete, the system will provide:
- Complete WordPress block library in React
- WordPress-compatible post editor interface
- All media assets available locally
- Theme styling preserved and functional
- Seamless editing experience matching Gutenberg

This plan enables systematic extraction and conversion of the complete WordPress component ecosystem while respecting Claude's context window limitations.