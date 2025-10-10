# Semantic Block Analysis Plan

## Objective
Extract all semantic patterns from existing WordPress posts to build a complete semantic block library that covers all real-world use cases.

## The Problem
Current block library (14 types) may be:
- **Incomplete** - Missing patterns actually used in content
- **Over-engineered** - Including blocks never used
- **Wrong abstraction** - Not matching actual semantic needs

## The Solution
Analyze source WordPress posts to discover:
1. **What patterns actually exist** (gradient highlights, photo layouts, callouts, etc.)
2. **How they're styled** (CSS classes, inline styles, structure)
3. **What variations are used** (colors, sizes, alignments, etc.)
4. **What metadata controls are needed** (for right-side panel styling)

---

## Analysis Requirements

### Source Material
**WordPress Posts**: The two example posts you provided earlier
- `https://cruisemadeeasy.com/the-alaska-2026-ship-selection-strategy/`
- `https://cruisemadeeasy.com/the-fall-leaf-peeping-secret-most-people-miss/`

**What to extract from each**:
1. HTML structure for each semantic component
2. CSS classes used (including hash-based GeneratePress classes)
3. Visual patterns (gradients, overlays, layouts)
4. Content structure (text + image combos, callouts, etc.)
5. Responsive behavior (mobile vs desktop)

### Semantic Pattern Discovery

**For each pattern found, document**:
- **Name**: What to call this block type (e.g., "GradientHighlight", "PhotoCallout")
- **Purpose**: Why this pattern exists (emphasis, visual break, etc.)
- **Structure**: Required HTML elements and nesting
- **CSS Requirements**: What classes/styles are needed
- **Content Slots**: What content goes where (text, image, caption, etc.)
- **Variations**: What can be customized (color, size, alignment, etc.)

**Key Question**: What makes these "semantic" vs just "styled divs"?
- **Semantic** = Purpose-driven ("This is a tip", "This is a warning")
- **Not semantic** = Style-driven ("This has a gradient", "This is blue")

---

## Current Block Inventory (Needs Validation)

### Existing 14 Block Types:
1. `heading` - Section headings (H2-H4)
2. `paragraph` - Standard text
3. `image` - Inline images with captions
4. `accent_tip` - Tip/warning/info/success boxes
5. `quote` - Blockquotes with citations
6. `cta` - Call-to-action buttons
7. `divider` - Horizontal rules
8. `list` - Bullet/numbered lists
9. `table` - Data tables
10. `columns` - Multi-column layouts
11. `section` - Content sections
12. `container` - Generic containers
13. `cta-group` - Multiple CTAs together
14. `figure` - Images with complex captions

**Questions to answer**:
- ✅ Which of these are actually used in WordPress posts?
- ❌ Which are missing patterns that DO exist?
- ⚠️ Which need more variations/options?
- 🗑️ Which are unused and can be removed?

---

## Gutenberg-Style Metadata Panel

### The Requirement
> "When inserted a block needs to be able to be styled using the metadata pane on the right, like in the Gutenberg editor"

**This means each block needs**:

1. **Block Settings Panel** (right sidebar in editor)
2. **Per-block customization options**
3. **Visual controls** (dropdowns, color pickers, alignment buttons)
4. **Live preview** of changes

### Example: Gradient Highlight Block

**Metadata Panel Options**:
```
┌─ Gradient Highlight Settings ────┐
│                                   │
│ Background Color:                 │
│ [Color Picker: #faf3e0]         │
│                                   │
│ Blend Mode:                       │
│ ☐ None                           │
│ ☑ Saturation                     │
│ ☐ Multiply                       │
│                                   │
│ Gradient Direction:               │
│ ☑ Vertical                       │
│ ☐ Horizontal                     │
│ ☐ Diagonal                       │
│                                   │
│ Text Alignment:                   │
│ ☐ Left  ☑ Center  ☐ Right       │
│                                   │
│ Padding:                          │
│ [Slider: 20px - 80px]           │
│                                   │
└───────────────────────────────────┘
```

**Current Implementation**:
- `BlockSettingsSidebar.tsx` exists (line 82 in PostEditor.tsx)
- Needs to be enhanced with per-block-type settings

---

## Analysis Workflow

### Phase 1: Pattern Discovery (Web Fetch Analysis)
**Input**: WordPress post URLs
**Process**:
1. Fetch HTML for each post
2. Parse semantic structure
3. Extract CSS classes and patterns
4. Identify unique components
5. Document variations

**Output**: List of discovered patterns with HTML/CSS examples

### Phase 2: Pattern Classification
**Process**:
1. Group similar patterns together
2. Identify semantic meaning (not just visual)
3. Determine if existing block types cover it
4. Identify gaps in current block library

**Output**:
- ✅ Patterns covered by existing blocks
- ❌ Patterns requiring new block types
- ⚠️ Patterns needing enhanced variations

### Phase 3: Block Specification
**For each required block type, document**:

```markdown
## Block: GradientHighlight

**Semantic Purpose**: Emphasize key content with visual distinction

**HTML Structure**:
```html
<div class="gradient-highlight" style="background: linear-gradient(...)">
  <div class="highlight-content">
    {CONTENT}
  </div>
</div>
```

**Content Slots**:
- `content`: Rich text (can include bold, italic, links)

**Metadata Options**:
- `backgroundColor`: Color picker (default: #faf3e0)
- `blendMode`: Dropdown (none, saturation, multiply)
- `gradientDirection`: Button group (vertical, horizontal, diagonal)
- `textAlignment`: Button group (left, center, right)
- `padding`: Slider (20-80px)

**CSS Classes**:
- Base: `.gradient-highlight`
- Variations: `.blend-saturation`, `.gradient-vertical`, etc.

**TipTap Extension Requirements**:
- Node type: `gradientHighlight`
- Attributes: backgroundColor, blendMode, gradientDirection, textAlignment, padding
- Rendering: Block-level with styling attributes
- Commands: `setGradientHighlight()`, `toggleGradientHighlight()`

**Block Renderer Requirements**:
- Render method: `renderGradientHighlight(content: GradientHighlightContent)`
- CSS generation: Apply background, blend mode, gradient
- Accessibility: Proper semantic HTML, no ARIA needed
```

### Phase 4: Implementation Priority
**Rank blocks by**:
1. **Frequency of use** (how often appears in posts)
2. **Criticality** (required for content vs nice-to-have)
3. **Complexity** (simple text formatting vs complex layout)

**Output**: Prioritized implementation backlog

---

## Technical Implementation Notes

### Where Changes Are Needed

1. **Block Type Definitions** (`src/types/database.ts`)
   - Add new block types to ContentBlock interface
   - Define content structure for each block

2. **TipTap Extensions** (`src/react-app/components/editor/extensions/`)
   - Create extension for each new block type
   - Implement rendering, commands, keyboard shortcuts

3. **Block Browser** (`BlockBrowser.tsx`)
   - Add new blocks to palette
   - Assign icons and hotkeys
   - Categorize appropriately

4. **Block Settings Sidebar** (`BlockSettingsSidebar.tsx`)
   - Build metadata panel UI for each block type
   - Add controls (color pickers, dropdowns, sliders)
   - Wire up to TipTap commands

5. **Block Converter** (`block-converter.ts`)
   - Add conversion logic: TipTap JSON ↔ ContentBlock
   - Handle new block attributes

6. **Block Renderer** (`block-renderer.ts`)
   - Add rendering methods for new blocks
   - Generate HTML with correct CSS classes
   - Apply metadata options to output

### Styling Considerations

**GeneratePress Hash Classes Problem**:
- Source posts use `.gb-element-7f949f67` (random hashes)
- Cannot replicate in semantic blocks
- **Solution**: Extract the actual CSS rules, apply to semantic classes

**Example**:
```css
/* WordPress source (hash-based) */
.gb-element-7f949f67 {
  background: linear-gradient(#faf3e0, var(--base-3));
  background-blend-mode: saturation;
}

/* Semantic equivalent */
.gradient-highlight.blend-saturation {
  background: linear-gradient(#faf3e0, var(--base-3));
  background-blend-mode: saturation;
}
```

---

## Deliverables

### Phase 1 Output: Pattern Analysis Report
- List of all discovered patterns
- HTML/CSS for each pattern
- Screenshots/examples from source posts
- Classification (covered vs gap)

### Phase 2 Output: Block Library Specification
- Complete block type definitions
- Metadata options for each block
- TipTap extension requirements
- Rendering requirements

### Phase 3 Output: Implementation Plan
- Prioritized backlog
- Estimated effort per block
- Dependencies between blocks
- Testing strategy

### Phase 4 Output: Working Implementation
- All blocks implemented
- Metadata panels functional
- Preview matches published output
- Block browser complete

---

## Success Criteria

**When analysis is complete, you should have**:
1. ✅ Every pattern from source posts mapped to semantic blocks
2. ✅ No missing patterns (can recreate all source post layouts)
3. ✅ No unused blocks (every block serves real need)
4. ✅ Metadata panels for all customization needs
5. ✅ Clear semantic meaning for each block type

**When implementation is complete, you should be able to**:
1. ✅ Recreate any source WordPress post structure
2. ✅ Style blocks via right-side metadata panel
3. ✅ Preview matches published output exactly
4. ✅ Insert blocks via Alt+I with appropriate options
5. ✅ Autonomous agents can generate semantically correct content

---

## Next Steps

**Immediate Action Required**:
1. Fetch and analyze the two example WordPress posts
2. Extract all unique semantic patterns
3. Map to existing block types (identify gaps)
4. Prioritize missing blocks for implementation

**Do you want me to start the analysis now, or do you have more source posts to include?**
