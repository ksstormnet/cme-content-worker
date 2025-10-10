# Semantic Block Implementation Plan

**Date**: 2025-10-10
**Project**: CME Content Worker - Semantic Block Enhancements
**Based On**: SEMANTIC_BLOCK_ANALYSIS_REPORT.md findings
**Methodology**: Incremental, safe implementation with validation loops

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Analysis](#architecture-analysis)
3. [Implementation Strategy](#implementation-strategy)
4. [Phase 1: Image Caption Enhancement](#phase-1-image-caption-enhancement)
5. [Phase 2: Callout Type Variants](#phase-2-callout-type-variants)
6. [Phase 3: Section Block](#phase-3-section-block)
7. [Testing & Validation Protocol](#testing--validation-protocol)
8. [Rollback Strategy](#rollback-strategy)
9. [Success Criteria](#success-criteria)

---

## Executive Summary

### Objective
Implement semantic block enhancements identified in pattern analysis while maintaining system stability and ensuring safe, incremental deployment.

### Scope
- **Phase 1 (HIGH)**: Add image caption support (2-4 hours)
- **Phase 2 (HIGH)**: Enhance accent_tip → callout with type variants (4-6 hours)
- **Phase 3 (MEDIUM)**: Add section block with nested block support (8-12 hours)

**Total Estimated Effort**: 14-22 hours across all phases

### Risk Assessment
- **Phase 1**: LOW risk (isolated enhancement, no existing content impact)
- **Phase 2**: MEDIUM risk (database migration required, affects existing content)
- **Phase 3**: HIGH risk (requires nested block support, complex TipTap integration)

### Prerequisites
- Git branch workflow: Feature branches from `dev`
- Development environment: Worker running on `localhost:8787`
- Database: Remote D1 (no local database operations)
- Validation: Test against source WordPress posts

---

## Architecture Analysis

### Current Block System Components

#### 1. **Type Definitions** (`src/types/database.ts`)
```typescript
export interface ContentBlock {
  id: number;
  post_id: number;
  block_type: 'heading' | 'paragraph' | 'image' | 'accent_tip' | 'quote' | 'cta' | 'divider' | 'list' | 'table' | 'columns' | 'column' | 'section' | 'container' | 'cta-group' | 'figure';
  block_order: number;
  content: string; // JSON with block-specific data
  created_at: string;
}

// Block-specific content interfaces
export interface ImageBlockContent {
  url: string;
  alt: string;
  caption?: string;          // ✅ ALREADY EXISTS (not implemented in UI)
  alignment?: 'left' | 'center' | 'right';
  size?: 'thumbnail' | 'medium' | 'large' | 'full';
}

export interface AccentTipBlockContent {
  text: string;
  type?: 'tip' | 'warning' | 'info' | 'success'; // ✅ ALREADY EXISTS (not fully used)
}
```

**Key Finding**: Database schema ALREADY supports captions and callout types! Implementation gap is in:
- TipTap extensions (not exposing caption/type controls)
- Block renderer (not rendering caption/type variants)
- Editor UI (no metadata panel controls)

#### 2. **TipTap Extensions**
Located: `src/react-app/components/editor/extensions/`

**AccentTipExtension.ts** (93 lines):
```typescript
export const AccentTipExtension = Node.create<AccentTipOptions>({
  name: 'accentTip',
  group: 'block',
  content: 'inline*',

  addAttributes() {
    return {
      type: {
        default: 'tip',  // ✅ Type attribute exists!
        parseHTML: element => element.getAttribute('data-type') || 'tip',
        renderHTML: attributes => ({
          'data-type': attributes.type,
        }),
      },
    };
  },

  addCommands() {
    return {
      setAccentTip: (type = 'tip') => ({ commands }) => {
        return commands.setNode(this.name, { type });
      },
      toggleAccentTip: (type = 'tip') => ({ commands }) => {
        return commands.toggleNode(this.name, 'paragraph', { type });
      },
    };
  },
});
```

**Current Capabilities**:
- ✅ Supports `type` attribute (tip, warning, info, success)
- ✅ Has `setAccentTip(type)` command
- ⚠️ Only keyboard shortcuts for 'info' and 'warning'
- ❌ No UI controls in metadata panel

**ImagePlaceholderExtension.ts**:
- Basic image insertion
- No caption editing support
- No metadata panel integration

#### 3. **Block Converter** (`src/react-app/utils/block-converter.ts`)

**tiptapToBlocks()** - Converts editor JSON → ContentBlock:
```typescript
case 'image':
  return {
    block_type: 'image',
    block_order: blockOrder,
    content: JSON.stringify({
      url: node.attrs?.src || '',
      alt: node.attrs?.alt || '',
      caption: node.attrs?.caption,  // ✅ ALREADY CONVERTED
      alignment: node.attrs?.alignment || 'center',
      size: node.attrs?.size || 'large'
    } as ImageBlockContent)
  };

case 'accentTip':
  return {
    block_type: 'accent_tip',
    block_order: blockOrder,
    content: JSON.stringify({
      text: extractTextFromNode(node),
      type: node.attrs?.type || 'tip'  // ✅ ALREADY CONVERTED
    } as AccentTipBlockContent)
  };
```

**Key Finding**: Block converter ALREADY handles caption and type! Gap is in:
- TipTap extension not exposing `caption` attribute
- No UI for editing caption/type
- Block renderer not rendering type variants

#### 4. **Block Renderer** (`src/utils/block-renderer.ts` - 462 lines)

**renderImage()** (src/utils/block-renderer.ts:125):
```typescript
private renderImage(content: ImageBlockContent, blockId: number): string {
  const url = this.resolveImageUrl(content.url);
  const alt = this.escapeHtml(content.alt || '');
  const alignment = content.alignment || 'center';
  const sizeClass = content.size ? `image-${content.size}` : 'image-medium';
  const captionId = content.caption ? `caption-${blockId}` : undefined;

  // ⚠️ Caption ID generated but NOT rendered
  let html = `<figure class="content-image ${sizeClass}" style="text-align: ${alignment}">
  <img src="${url}" alt="${alt}"${lazyLoading}${captionId ? ` aria-describedby="${captionId}"` : ''} />
</figure>`;

  // ❌ Missing: <figcaption id="${captionId}">${caption}</figcaption>
  return html;
}
```

**renderAccentTip()** (src/utils/block-renderer.ts:149):
```typescript
private renderAccentTip(content: AccentTipBlockContent, blockId: number): string {
  const type = content.type || 'tip';  // ✅ Type extracted
  const role = roleMap[type] || 'note';
  const icon = this.getAccentTipIcon(type);  // ✅ Icon mapping exists

  return `<aside class="accent-tip accent-tip--${type}" role="${role}">
    <div class="accent-tip__icon">${icon}</div>
    <div class="accent-tip__content">
      ${this.processTextFormatting(content.text)}
    </div>
  </aside>`;

  // ⚠️ CSS classes for type variants generated
  // ❌ Missing: Actual CSS styles for .accent-tip--warning, etc.
}
```

**Key Finding**: Block renderer PARTIALLY implements caption/type support but incomplete:
- Image caption aria-describedby generated but no `<figcaption>` rendered
- Accent tip type classes generated but CSS styles missing

#### 5. **Editor UI** (`src/react-app/components/PostEditor.tsx`)

**Initialization** (line 108):
```typescript
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
    }),
    Placeholder.configure({
      placeholder: 'Start writing or press Alt+I to insert a block...',
    }),
    Link.configure({ openOnClick: false }),
    AccentTipExtension,          // ✅ Loaded
    CTAExtension,
    ImagePlaceholderExtension,   // ✅ Loaded
  ],
  content: contentBlocks.length > 0 ? blocksToTiptap(contentBlocks) : '',
  onUpdate: ({ editor }) => {
    setIsDirty(true);
    const blocks = tiptapToBlocks(editor.getJSON());
    setContentBlocks(blocks);
  },
  onSelectionUpdate: ({ editor }) => {
    const { $from } = editor.state.selection;
    const node = $from.node($from.depth);
    if (node) {
      setCurrentBlockType(node.type.name);  // ✅ Block type detection
    }
  },
});
```

**BlockSettingsSidebar** (line 80-81):
```typescript
const [settingsSidebarOpen, setSettingsSidebarOpen] = useState(false);
const [currentBlockType, setCurrentBlockType] = useState<string | null>(null);
```

**Key Finding**: Infrastructure for block settings sidebar EXISTS but not implemented:
- `BlockSettingsSidebar` component imported but minimal implementation
- `currentBlockType` state tracking active block
- Need to build actual metadata panel UI

### System Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│ PostEditor.tsx (Main Editor Component)                      │
│  ├─ TipTap Editor Instance                                  │
│  │   ├─ StarterKit (heading, paragraph, list, etc.)       │
│  │   ├─ AccentTipExtension (✅ type support)              │
│  │   ├─ ImagePlaceholderExtension (❌ no caption)         │
│  │   └─ Custom extensions                                  │
│  ├─ BlockSettingsSidebar (⚠️ minimal implementation)       │
│  └─ Content state management                               │
└─────────────────────────────────────────────────────────────┘
              ↓ onUpdate                ↓ onSelectionUpdate
┌──────────────────────────┐    ┌──────────────────────────┐
│ block-converter.ts       │    │ Detect current block     │
│  ├─ tiptapToBlocks()    │    │ Update sidebar state     │
│  └─ blocksToTiptap()    │    └──────────────────────────┘
└──────────────────────────┘
              ↓
┌──────────────────────────────────────────────────────────────┐
│ database.ts (Type Definitions)                               │
│  ├─ ContentBlock interface                                   │
│  ├─ ImageBlockContent (✅ caption field exists)             │
│  └─ AccentTipBlockContent (✅ type field exists)            │
└──────────────────────────────────────────────────────────────┘
              ↓ Stored in D1
┌──────────────────────────────────────────────────────────────┐
│ content_blocks table                                          │
│  └─ content column (JSON with caption/type)                  │
└──────────────────────────────────────────────────────────────┘
              ↓ Retrieved for display
┌──────────────────────────────────────────────────────────────┐
│ block-renderer.ts (Server-Side Rendering)                    │
│  ├─ renderImage() (⚠️ partial caption support)              │
│  └─ renderAccentTip() (⚠️ partial type support)             │
└──────────────────────────────────────────────────────────────┘
```

**Critical Insight**: The ENTIRE data pipeline already supports captions and callout types! Implementation gaps are ONLY in:
1. **Editor UI**: No metadata panel controls for caption/type
2. **Image Extension**: Not exposing caption attribute
3. **Block Renderer**: Incomplete rendering of caption/type variants
4. **CSS**: Missing styles for callout type variants

---

## Implementation Strategy

### Guiding Principles

1. **Incremental Implementation**: One enhancement at a time, fully tested before proceeding
2. **Git Branch Workflow**: Feature branch per enhancement
3. **Commit Before Testing**: Always commit code before running tests
4. **Validation Against Reality**: Test rendered output against WordPress source posts
5. **Rollback Capability**: Maintain ability to revert at any step
6. **Challenge Mode**: Question all implementation decisions before proceeding

### Development Environment Protocol

**MANDATORY**: Worker development server runs in background bash session:
```bash
npm run dev:worker  # Runs on localhost:8787 (background session)
```

**DO NOT** run Vite dev server unless explicitly instructed (frontend builds via Vite but serves through Worker).

### Git Workflow Per Phase

```bash
# Start each phase
git checkout dev
git pull origin dev
git checkout -b feature/[phase-name]

# Implement changes
# ... development work ...

# Commit immediately after writing code (BEFORE testing)
npm run lint  # Run linter during commit
git add .
git commit -m "[phase-name]: [specific change]"

# Test after committing
npm run build      # Test compilation
# ... manual testing on localhost:8787 ...

# Complete phase
git checkout dev
git merge feature/[phase-name]
git branch -d feature/[phase-name]
git push origin dev
```

### File Modification Tracking

Each phase will document:
- Files modified
- Lines changed
- Before/after code comparisons
- Dependencies affected
- Test validation points

---

## Phase 1: Image Caption Enhancement

**Priority**: HIGH
**Risk**: LOW
**Estimated Effort**: 2-4 hours
**Branch Name**: `feature/image-caption-support`

### Objective
Enable users to add, edit, and display captions for image blocks with full accessibility support (WCAG 2.1 compliance).

### Analysis Summary
- ✅ Database schema supports `caption` field (ImageBlockContent interface)
- ✅ Block converter handles caption attribute
- ✅ Block renderer generates `aria-describedby` for caption
- ❌ **Gap**: TipTap ImagePlaceholderExtension doesn't expose caption attribute
- ❌ **Gap**: Block renderer doesn't output `<figcaption>` element
- ❌ **Gap**: No UI controls in metadata panel for editing caption

### Files to Modify

#### 1. **ImagePlaceholderExtension.ts** (ENHANCE)
**Location**: `src/react-app/components/editor/extensions/ImagePlaceholderExtension.ts`

**Current State**: Basic image insertion with src, alt, alignment, size attributes

**Required Changes**:
```typescript
// ADD to addAttributes():
caption: {
  default: null,
  parseHTML: element => element.getAttribute('data-caption'),
  renderHTML: attributes => {
    if (attributes.caption) {
      return { 'data-caption': attributes.caption };
    }
    return {};
  },
},

// ADD to addCommands():
setImageCaption: (caption: string | null) => ({ commands, state }) => {
  const { from } = state.selection;
  return commands.updateAttributes('image', { caption });
},
```

**Validation**: Extension should accept and store caption attribute in editor JSON.

#### 2. **block-renderer.ts** (ENHANCE)
**Location**: `src/utils/block-renderer.ts`
**Function**: `renderImage()` (approx line 125)

**Current Code**:
```typescript
private renderImage(content: ImageBlockContent, blockId: number): string {
  const url = this.resolveImageUrl(content.url);
  const alt = this.escapeHtml(content.alt || '');
  const alignment = content.alignment || 'center';
  const sizeClass = content.size ? `image-${content.size}` : 'image-medium';
  const captionId = content.caption ? `caption-${blockId}` : undefined;

  const lazyLoading = this.options.enableLazyLoading ? ' loading="lazy"' : '';

  let html = `<figure class="content-image ${sizeClass}" style="text-align: ${alignment}">
  <img src="${url}" alt="${alt}"${lazyLoading}${captionId ? ` aria-describedby="${captionId}"` : ''} />
</figure>`;

  return html;
}
```

**Required Changes**:
```typescript
private renderImage(content: ImageBlockContent, blockId: number): string {
  const url = this.resolveImageUrl(content.url);
  const alt = this.escapeHtml(content.alt || '');
  const alignment = content.alignment || 'center';
  const sizeClass = content.size ? `image-${content.size}` : 'image-medium';
  const captionId = content.caption ? `caption-${blockId}` : undefined;

  const lazyLoading = this.options.enableLazyLoading ? ' loading="lazy"' : '';

  let html = `<figure class="content-image ${sizeClass}" style="text-align: ${alignment}">
  <img src="${url}" alt="${alt}"${lazyLoading}${captionId ? ` aria-describedby="${captionId}"` : ''} />`;

  // ADD caption rendering
  if (content.caption) {
    html += `\n  <figcaption id="${captionId}" class="content-image__caption">
    ${this.processTextFormatting(content.caption)}
  </figcaption>`;
  }

  html += '\n</figure>';

  return html;
}
```

**Validation**:
- Images with captions render `<figcaption>` element
- Caption ID matches `aria-describedby` on `<img>`
- Caption text supports formatting (bold, italic, links)

#### 3. **BlockSettingsSidebar.tsx** (ENHANCE)
**Location**: `src/react-app/components/editor/BlockSettingsSidebar.tsx`

**Current State**: Minimal implementation, basic structure exists

**Required UI Controls**:
```typescript
// When currentBlockType === 'image':
<div className="block-settings__section">
  <label htmlFor="image-caption" className="block-settings__label">
    Caption (optional)
  </label>
  <textarea
    id="image-caption"
    className="block-settings__textarea"
    placeholder="Enter image caption..."
    value={imageCaption}
    onChange={(e) => {
      setImageCaption(e.target.value);
      editor?.chain().focus().setImageCaption(e.target.value || null).run();
    }}
    rows={3}
  />
  <p className="block-settings__help">
    Provides context for readers and improves accessibility
  </p>
</div>
```

**State Management**:
```typescript
// Add state for tracking caption
const [imageCaption, setImageCaption] = useState<string>('');

// Sync with editor selection
useEffect(() => {
  if (!editor) return;

  const { node } = editor.state.selection;
  if (node && node.type.name === 'image') {
    setImageCaption(node.attrs.caption || '');
  }
}, [editor, editor?.state.selection]);
```

**Validation**:
- Caption textarea appears when image block selected
- Typing in textarea updates editor content live
- Caption persists when switching between blocks

#### 4. **CSS Styles** (ADD)
**Location**: `src/react-app/components/PostEditor.css` (or dedicated block styles)

**Required Styles**:
```css
/* Image caption styles */
.content-image__caption {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.4;
  color: #666;
  font-style: italic;
  text-align: center;
}

/* Block settings textarea */
.block-settings__textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.875rem;
  resize: vertical;
}

.block-settings__help {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #888;
}
```

### Implementation Steps

#### Step 1: Enhance ImagePlaceholderExtension (30 min)
1. Branch: `git checkout -b feature/image-caption-support`
2. Open `src/react-app/components/editor/extensions/ImagePlaceholderExtension.ts`
3. Add `caption` attribute to `addAttributes()`
4. Add `setImageCaption` command to `addCommands()`
5. Commit: `git commit -m "feat: Add caption attribute to ImagePlaceholderExtension"`
6. Test: Insert image in editor, check TipTap JSON includes caption attribute

#### Step 2: Update Block Renderer (30 min)
1. Open `src/utils/block-renderer.ts`
2. Locate `renderImage()` method (approx line 125)
3. Add `<figcaption>` rendering logic
4. Commit: `git commit -m "feat: Render figcaption for image blocks with captions"`
5. Test: Create post with image + caption, verify published output

#### Step 3: Build Metadata Panel UI (60-90 min)
1. Open `src/react-app/components/editor/BlockSettingsSidebar.tsx`
2. Add image caption textarea control
3. Wire up state management and editor commands
4. Commit: `git commit -m "feat: Add caption editor to BlockSettingsSidebar"`
5. Test: Select image, edit caption, verify live updates

#### Step 4: Add CSS Styles (15 min)
1. Open `src/react-app/components/PostEditor.css`
2. Add caption and UI control styles
3. Commit: `git commit -m "style: Add image caption and metadata panel styles"`
4. Test: Verify styling in editor and published output

#### Step 5: Integration Testing (30 min)
1. Create test post with multiple images
2. Add captions to some images, leave others without
3. Verify accessibility with screen reader or accessibility inspector
4. Check published output against WordPress source posts
5. Validate WCAG 2.1 compliance (alt text + caption)

### Validation Checklist

- [ ] TipTap JSON includes caption attribute for images
- [ ] Block converter preserves caption through conversion
- [ ] Published output includes `<figcaption>` element
- [ ] `aria-describedby` links image to caption
- [ ] Caption supports text formatting (bold, italic, links)
- [ ] Metadata panel caption textarea appears for image blocks
- [ ] Typing in textarea updates editor content live
- [ ] Caption persists when switching between blocks
- [ ] Images without captions render correctly (no empty figcaption)
- [ ] Screen reader announces caption correctly
- [ ] Visual styling matches design expectations

### Rollback Strategy
- Revert commits in reverse order
- Test after each revert to ensure system stability
- If issues persist, `git checkout dev` and restart

### Success Criteria
✅ Images can have optional captions
✅ Captions render with proper semantic HTML (`<figure>` + `<figcaption>`)
✅ WCAG 2.1 accessibility compliance maintained
✅ Metadata panel provides intuitive caption editing
✅ Published output matches expectations

---

## Phase 2: Callout Type Variants

**Priority**: HIGH
**Risk**: MEDIUM
**Estimated Effort**: 4-6 hours
**Branch Name**: `feature/callout-type-variants`

### Objective
Enhance accent_tip block with full type variant support (tip, warning, alert, info, success) with distinct visual styling and metadata panel controls.

### Analysis Summary
- ✅ Database schema supports `type` field (AccentTipBlockContent interface)
- ✅ TipTap extension has `type` attribute and commands
- ✅ Block converter handles type attribute
- ✅ Block renderer generates CSS classes for type variants
- ❌ **Gap**: AccentTipExtension only has keyboard shortcuts for 'info' and 'warning'
- ❌ **Gap**: No UI controls in metadata panel for selecting type
- ❌ **Gap**: CSS styles for type variants don't exist
- ⚠️ **Migration**: May need to update existing accent_tip records (default to 'tip')

### Files to Modify

#### 1. **AccentTipExtension.ts** (ENHANCE)
**Location**: `src/react-app/components/editor/extensions/AccentTipExtension.ts`

**Current State**: Has type attribute, setAccentTip/toggleAccentTip commands, limited keyboard shortcuts

**Required Changes**:
```typescript
// ENHANCE keyboard shortcuts (add all types)
addKeyboardShortcuts() {
  return {
    'Mod-Shift-t': () => this.editor.commands.setAccentTip('tip'),
    'Mod-Shift-w': () => this.editor.commands.setAccentTip('warning'),
    'Mod-Shift-a': () => this.editor.commands.setAccentTip('alert'),
    'Mod-Shift-i': () => this.editor.commands.setAccentTip('info'),
    'Mod-Shift-s': () => this.editor.commands.setAccentTip('success'),
  };
},

// ADD command for updating type of existing block
updateAccentTipType: (type: 'tip' | 'warning' | 'alert' | 'info' | 'success') =>
  ({ commands, state }) => {
    const { from } = state.selection;
    return commands.updateAttributes('accentTip', { type });
  },
```

**Validation**: Commands should update type attribute in editor JSON.

#### 2. **block-renderer.ts** (ENHANCE)
**Location**: `src/utils/block-renderer.ts`
**Function**: `renderAccentTip()` (approx line 149)

**Current Code**:
```typescript
private renderAccentTip(content: AccentTipBlockContent, blockId: number): string {
  const type = content.type || 'tip';
  const roleMap = {
    tip: 'note',
    warning: 'alert',
    info: 'note',
    success: 'status'
  };
  const role = roleMap[type] || 'note';
  const icon = this.getAccentTipIcon(type);

  return `<aside class="accent-tip accent-tip--${type}" role="${role}">
    <div class="accent-tip__icon">${icon}</div>
    <div class="accent-tip__content">
      ${this.processTextFormatting(content.text)}
    </div>
  </aside>`;
}
```

**Required Changes**:
```typescript
// ADD 'alert' to roleMap and getAccentTipIcon
private renderAccentTip(content: AccentTipBlockContent, blockId: number): string {
  const type = content.type || 'tip';
  const roleMap = {
    tip: 'note',
    warning: 'alert',
    alert: 'alert',   // ADD
    info: 'note',
    success: 'status'
  };
  const role = roleMap[type] || 'note';
  const icon = this.getAccentTipIcon(type);
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

  return `<aside class="accent-tip accent-tip--${type}" role="${role}" aria-label="${typeLabel} callout">
    <div class="accent-tip__icon" aria-hidden="true">${icon}</div>
    <div class="accent-tip__content">
      ${this.processTextFormatting(content.text)}
    </div>
  </aside>`;
}

private getAccentTipIcon(type: string): string {
  const icons = {
    tip: '💡',
    warning: '⚠️',
    alert: '🚨',   // ADD
    info: 'ℹ️',
    success: '✅'
  };
  return icons[type as keyof typeof icons] || icons.tip;
}
```

**Validation**: Callout blocks render with correct type class and icon.

#### 3. **BlockSettingsSidebar.tsx** (ENHANCE)
**Location**: `src/react-app/components/editor/BlockSettingsSidebar.tsx`

**Required UI Controls**:
```typescript
// When currentBlockType === 'accentTip':
<div className="block-settings__section">
  <label className="block-settings__label">Callout Type</label>
  <div className="block-settings__button-group">
    {[
      { type: 'tip', label: 'Tip 💡', color: '#e3f2fd' },
      { type: 'warning', label: 'Warning ⚠️', color: '#fff3e0' },
      { type: 'alert', label: 'Alert 🚨', color: '#ffebee' },
      { type: 'info', label: 'Info ℹ️', color: '#e8f5e9' },
      { type: 'success', label: 'Success ✅', color: '#e8f5e9' },
    ].map(({ type, label, color }) => (
      <button
        key={type}
        className={`block-settings__type-button ${calloutType === type ? 'active' : ''}`}
        style={{ backgroundColor: color }}
        onClick={() => {
          setCalloutType(type as any);
          editor?.chain().focus().updateAccentTipType(type as any).run();
        }}
      >
        {label}
      </button>
    ))}
  </div>
  <p className="block-settings__help">
    Choose the semantic meaning of this callout
  </p>
</div>
```

**State Management**:
```typescript
const [calloutType, setCalloutType] = useState<'tip' | 'warning' | 'alert' | 'info' | 'success'>('tip');

// Sync with editor selection
useEffect(() => {
  if (!editor) return;

  const { node } = editor.state.selection;
  if (node && node.type.name === 'accentTip') {
    setCalloutType(node.attrs.type || 'tip');
  }
}, [editor, editor?.state.selection]);
```

#### 4. **CSS Styles** (ADD)
**Location**: `src/react-app/components/PostEditor.css` or dedicated styles

**Required Styles**:
```css
/* Callout type variants */
.accent-tip {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid;
  margin: 1.5rem 0;
}

.accent-tip__icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.accent-tip__content {
  flex: 1;
}

/* Tip (default - blue) */
.accent-tip--tip {
  background-color: #e3f2fd;
  border-left-color: #2196f3;
  color: #0d47a1;
}

/* Warning (orange/yellow) */
.accent-tip--warning {
  background-color: #fff3e0;
  border-left-color: #ff9800;
  color: #e65100;
}

/* Alert (red) */
.accent-tip--alert {
  background-color: #ffebee;
  border-left-color: #f44336;
  color: #b71c1c;
}

/* Info (teal/green) */
.accent-tip--info {
  background-color: #e0f2f1;
  border-left-color: #009688;
  color: #004d40;
}

/* Success (green) */
.accent-tip--success {
  background-color: #e8f5e9;
  border-left-color: #4caf50;
  color: #1b5e20;
}

/* Block settings button group */
.block-settings__button-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.5rem;
}

.block-settings__type-button {
  padding: 0.5rem;
  border: 2px solid transparent;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.block-settings__type-button:hover {
  border-color: #333;
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.block-settings__type-button.active {
  border-color: #000;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
```

### Database Migration Considerations

**Current Situation**: Existing accent_tip blocks may not have `type` field in JSON content.

**Migration Strategy**: NO database migration needed!
- Block renderer defaults to `type: 'tip'` if not present
- Existing blocks render correctly without changes
- Users can update type via metadata panel when editing

**Validation Query** (optional, for verification):
```sql
-- Check existing accent_tip blocks
SELECT id, block_type, content
FROM content_blocks
WHERE block_type = 'accent_tip'
LIMIT 10;
```

### Implementation Steps

#### Step 1: Enhance AccentTipExtension (30 min)
1. Branch: `git checkout -b feature/callout-type-variants`
2. Open `src/react-app/components/editor/extensions/AccentTipExtension.ts`
3. Add keyboard shortcuts for all types
4. Add `updateAccentTipType` command
5. Commit: `git commit -m "feat: Add full type variant support to AccentTipExtension"`
6. Test: Insert callout, change type via keyboard shortcuts

#### Step 2: Update Block Renderer (30 min)
1. Open `src/utils/block-renderer.ts`
2. Add 'alert' to roleMap and getAccentTipIcon
3. Enhance aria-label for accessibility
4. Commit: `git commit -m "feat: Complete callout type rendering with alert support"`
5. Test: Create post with different callout types, verify rendering

#### Step 3: Add CSS Styles (45 min)
1. Open `src/react-app/components/PostEditor.css`
2. Add callout type variant styles
3. Test colors and visual distinction between types
4. Commit: `git commit -m "style: Add CSS styles for callout type variants"`
5. Test: Verify visual styling in published output

#### Step 4: Build Metadata Panel UI (90-120 min)
1. Open `src/react-app/components/editor/BlockSettingsSidebar.tsx`
2. Add callout type button group
3. Wire up state management and editor commands
4. Add button group styling
5. Commit: `git commit -m "feat: Add callout type selector to BlockSettingsSidebar"`
6. Test: Select callout, change type, verify live updates

#### Step 5: Integration Testing (30 min)
1. Create test post with all 5 callout types
2. Verify visual distinction between types
3. Test keyboard shortcuts (Cmd+Shift+T/W/A/I/S)
4. Check published output matches editor preview
5. Validate accessibility (ARIA roles, labels)
6. Test existing posts with old accent_tip blocks (should default to 'tip')

### Validation Checklist

- [ ] TipTap extension supports all 5 callout types
- [ ] Keyboard shortcuts work for all types (Cmd+Shift+T/W/A/I/S)
- [ ] Block converter preserves type through conversion
- [ ] Published output renders correct CSS classes
- [ ] All 5 type variants have distinct visual styling
- [ ] Icons display correctly for each type (💡⚠️🚨ℹ️✅)
- [ ] Metadata panel shows type selector buttons
- [ ] Clicking type button updates callout immediately
- [ ] Active type button has visual indication
- [ ] ARIA roles and labels correct for accessibility
- [ ] Existing accent_tip blocks default to 'tip' type
- [ ] No database errors or migration needed

### Rollback Strategy
- Revert commits in reverse order
- Existing posts continue to work (default to 'tip')
- If CSS issues, remove styles and revert to basic rendering
- Database rollback NOT needed (backward compatible)

### Success Criteria
✅ Callout blocks support 5 distinct types (tip, warning, alert, info, success)
✅ Visual styling clearly distinguishes between types
✅ Metadata panel provides intuitive type selection
✅ Keyboard shortcuts enhance editor efficiency
✅ Accessibility maintained (ARIA roles and labels)
✅ Existing content continues to work without migration

---

## Phase 3: Section Block

**Priority**: MEDIUM
**Risk**: HIGH
**Estimated Effort**: 8-12 hours
**Branch Name**: `feature/section-block`

### Objective
Implement section block with nested block support for semantic HTML5 content organization with styling flexibility.

### Analysis Summary
- ⚠️ Database schema has `section` block type but limited content interface
- ⚠️ TipTap needs container pattern implementation (complex)
- ❌ **Gap**: No TipTap extension for section block
- ❌ **Gap**: Block converter doesn't handle nested blocks
- ⚠️ Block renderer has `renderSection()` but incomplete (no child rendering)
- ⚠️ **Risk**: Nested block support requires significant architecture changes

### Complexity Warning

**This phase is significantly more complex than Phases 1 and 2** because:
1. Requires TipTap nested node support (container pattern)
2. Block converter must handle recursive nesting
3. Database content structure needs nested blocks array
4. Renderer requires recursive child block rendering
5. Editor UI needs drag-and-drop for block organization

### Recommendation: DEFER to separate planning session

Given the complexity and risk, this phase should:
1. Be planned separately with dedicated architecture design
2. Consider using existing TipTap container extensions (e.g., `@tiptap/extension-details`)
3. Prototype in isolated branch before full implementation
4. Require fullstack-developer and context-manager agent coordination

### Deferred Implementation Plan

**If proceeding with Phase 3**, follow this approach:

#### Pre-Implementation Research (2 hours)
1. Study TipTap container patterns: https://tiptap.dev/docs/editor/extensions/custom-extensions/extend-existing#render-html
2. Review `@tiptap/extension-details` source code for nested node handling
3. Analyze block converter recursive logic requirements
4. Design database schema for nested content_blocks

#### Prototype Branch (4-6 hours)
1. Create `prototype/section-block` branch
2. Implement basic SectionExtension with nested node support
3. Test recursive block conversion in isolated environment
4. Validate rendering of nested blocks

#### Full Implementation (6-10 hours)
1. Integrate SectionExtension into main editor
2. Update block converter for nested blocks
3. Enhance block renderer with recursive rendering
4. Build metadata panel for section styling
5. Add CSS for section backgrounds, padding, borders

**Total Phase 3 Estimate**: 12-18 hours (higher than initial estimate)

### Decision Point

**RECOMMENDATION**: Complete Phases 1 and 2 first, then reassess:
- Do user needs justify the complexity of section blocks?
- Can simpler alternatives (styled divs, existing containers) suffice?
- Is nested block architecture needed for other features?

**If YES to all**: Proceed with Phase 3 as separate project
**If NO**: Consider alternative approaches or deprioritize

---

## Testing & Validation Protocol

### Per-Phase Testing

#### Unit Testing
- TipTap extension commands execute correctly
- Block converter preserves attributes through conversion
- Block renderer outputs expected HTML structure

#### Integration Testing
- Editor UI updates reflect in content state
- Metadata panel controls update editor content
- Published output matches editor preview

#### Accessibility Testing
- WCAG 2.1 compliance maintained
- Screen reader announces content correctly
- Keyboard navigation functional
- ARIA attributes correct

#### Cross-Browser Testing
- Chrome/Edge (Chromium)
- Firefox
- Safari (if applicable)

#### Visual Regression Testing
- Compare rendered output to WordPress source posts
- Verify styling matches design expectations
- Check responsive behavior (mobile/tablet/desktop)

### Validation Against WordPress Posts

**Reference Posts**:
- https://cruisemadeeasy.com/the-alaska-2026-ship-selection-strategy/
- https://cruisemadeeasy.com/the-fall-leaf-peeping-secret-most-people-miss/

**Validation Checklist**:
- [ ] Image captions render similarly to source
- [ ] Callout styling matches source visual hierarchy
- [ ] Content structure preserved (headings, paragraphs, lists)
- [ ] No visual regressions in existing blocks

### Performance Testing

- [ ] Editor loads within 2 seconds
- [ ] Content blocks render within 500ms
- [ ] No memory leaks during extended editing
- [ ] Database queries remain efficient

---

## Rollback Strategy

### Git-Based Rollback

**Per-Phase Rollback**:
```bash
# If issues found in testing
git checkout dev
git branch -D feature/[phase-name]

# If issues found after merge
git revert [commit-hash]
git push origin dev
```

**Full Rollback** (all phases):
```bash
# Return to pre-implementation state
git checkout dev
git reset --hard [commit-before-phase-1]
git push --force origin dev  # ⚠️ Use with caution
```

### Database Rollback

**Phase 1 (Image Captions)**: No database changes, no rollback needed

**Phase 2 (Callout Types)**: Backward compatible, no rollback needed
- Existing blocks default to 'tip' if type missing
- No data loss if rolling back code

**Phase 3 (Section Block)**: Requires careful rollback
- May need database migration to remove section blocks
- Check for orphaned nested blocks

### CSS Rollback

All CSS changes are additive, rollback by:
1. Removing new CSS rules
2. Reverting to previous CSS file version
3. No impact on existing content

---

## Success Criteria

### Phase 1: Image Captions
- ✅ Images can have optional captions with rich text formatting
- ✅ Captions render with semantic HTML (`<figure>` + `<figcaption>`)
- ✅ WCAG 2.1 accessibility compliance (aria-describedby)
- ✅ Metadata panel provides caption editing UI
- ✅ Editor preview matches published output

### Phase 2: Callout Types
- ✅ Callout blocks support 5 types (tip, warning, alert, info, success)
- ✅ Visual styling clearly distinguishes types
- ✅ Metadata panel provides type selection UI
- ✅ Keyboard shortcuts functional (Cmd+Shift+T/W/A/I/S)
- ✅ Existing content continues to work (backward compatible)

### Phase 3: Section Block (DEFERRED)
- ⏸️ Implementation deferred pending complexity assessment
- ⏸️ Consider alternative approaches or separate project

### Overall System Health
- ✅ No regressions in existing block functionality
- ✅ Performance maintained (editor load time, render time)
- ✅ Accessibility standards met (WCAG 2.1 AA)
- ✅ Published output matches WordPress source posts
- ✅ Code quality maintained (ESLint passing, TypeScript errors resolved)

---

## Next Steps

### Immediate Actions

1. **Review Plan**: Stakeholder approval of implementation approach
2. **Phase 1 Start**: Branch creation and image caption implementation
3. **Validation**: Test Phase 1 before proceeding to Phase 2

### Post-Implementation

1. **Documentation**: Update README with new block features
2. **User Guide**: Document caption/type controls for content creators
3. **Training**: Brief team on new metadata panel features

### Future Considerations

1. **Phase 3 Planning**: Dedicated architecture session for section blocks
2. **Additional Enhancements**: Consider list emphasis presets, quote callout styles (Priority 3)
3. **AI Content Generation**: Update AI prompts to include caption/type metadata

---

## Appendix: Quick Reference

### File Locations

```
src/types/database.ts                                   # Type definitions
src/utils/block-renderer.ts                             # Server-side rendering
src/react-app/components/editor/extensions/             # TipTap extensions
  ├─ AccentTipExtension.ts                              # Callout block
  ├─ ImagePlaceholderExtension.ts                       # Image block
  └─ CTAExtension.ts                                    # CTA block
src/react-app/components/editor/BlockSettingsSidebar.tsx # Metadata panel
src/react-app/components/PostEditor.tsx                  # Main editor
src/react-app/utils/block-converter.ts                   # TipTap ↔ ContentBlock
src/react-app/components/PostEditor.css                  # Editor styles
```

### Development Commands

```bash
npm run dev:worker          # Start development server (background)
npm run build               # Build for production
npm run lint                # Run ESLint
npm run check               # Full build validation + deployment dry-run

# Database operations
npx wrangler d1 migrations list             # List migrations
npx wrangler d1 migrations apply            # Apply migrations
npx wrangler d1 execute --command="SQL"     # Execute SQL query
```

### Git Workflow

```bash
# Start feature
git checkout dev
git pull origin dev
git checkout -b feature/[name]

# Commit changes
git add .
npm run lint
git commit -m "feat: [description]"

# Complete feature
git checkout dev
git merge feature/[name]
git branch -d feature/[name]
git push origin dev
```

---

**END OF IMPLEMENTATION PLAN**

This plan provides AI with:
- ✅ Complete context of existing architecture
- ✅ Specific files to modify with exact locations
- ✅ Before/after code comparisons
- ✅ Step-by-step implementation instructions
- ✅ Validation checklists for each step
- ✅ Rollback strategies if issues arise
- ✅ Success criteria for each phase

AI should follow this plan incrementally, one phase at a time, with validation at each step.
