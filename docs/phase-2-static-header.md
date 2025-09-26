# Phase 2: Static Header Integration

## Goal
Extract and integrate responsive navigation header from existing HTML templates into the React application.

## Duration
1 context window

## Context for AI

### Prerequisites
- Phase 1 completed: R2 CSS foundation established in PostPage
- Development servers running in background: Vite (:5174) + Worker (:8787)
- CSS loading infrastructure in place

### Header Template Source
- **Primary Template**: `temp-components/sticky-header.html`
- **Alternative**: `public/temp-components/sticky-header.html`
- **Fallback Reference**: `src/utils/blog-post-template.ts` (SharedComponents.generateSiteHeader)

### Header Component Structure
The sticky header contains these key elements:

#### CSS Classes (GenerateBlocks)
- `.header-wrap` - Main header container
- `.gb-element-6d98b3bd` - Primary header element
- `.gb-element-a31c4cb5` - Header content container
- `.gb-element-*` - Various nested elements for logo, navigation, CTAs

#### Responsive Components
- **Desktop Navigation**: Horizontal menu with logo and CTA buttons
- **Mobile Navigation**: Hamburger menu that slides out from right
- **Sticky Behavior**: Header sticks to top on scroll with fade transition

#### Logo & Branding
- **Main Logo**: CME logo with proper positioning and responsive sizing
- **Brand Colors**: Consistent with CME brand guidelines
- **Mobile Logo**: Optimized size for mobile screens

#### Call-to-Action Buttons
- **Cruise Match Quiz**: Link to quiz functionality
- **Plan My Cruise**: Main conversion CTA
- **Tips & Guides**: Content navigation
- **Start Conversation**: Contact CTA
- **Phone Number**: Click-to-call functionality

### Mobile Menu System
- **Hamburger Icon**: Three-line menu icon for mobile
- **Slide Animation**: Menu slides in from right side
- **Overlay**: Dark overlay behind menu when open
- **Close Functionality**: X button and overlay click to close

## Implementation Steps

### 1. Read Header Template File
```bash
# Primary template location
cat temp-components/sticky-header.html

# Or public directory
cat public/temp-components/sticky-header.html
```

Extract the complete HTML structure and understand the component hierarchy.

### 2. Create StickyHeader React Component
Create new file: `src/react-app/components/StickyHeader.tsx`

```tsx
import React, { useState } from 'react';

interface StickyHeaderProps {
  // Add any props needed for customization
}

export function StickyHeader({}: StickyHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="header-wrap">
      {/* Extract and convert HTML structure here */}
    </div>
  );
}
```

### 3. Convert HTML to JSX
Transform HTML template to React JSX:

#### Key Conversions Needed
- `class=""` → `className=""`
- `style=""` → `style={{}}` (object syntax)
- Self-closing tags: `<img />`, `<br />`, `<hr />`
- Event handlers: `onclick` → `onClick`
- Boolean attributes: `checked` → `checked={true}`

#### SVG Icon Handling
Convert SVG icons to inline JSX:
```tsx
// Example hamburger icon
<svg viewBox="0 0 24 24" className="hamburger-icon">
  <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" />
</svg>
```

### 4. Implement Mobile Menu State
Add state management for mobile menu:

```tsx
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

const toggleMobileMenu = () => {
  setMobileMenuOpen(!mobileMenuOpen);
};

// Apply conditional classes
<div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
  {/* Mobile menu content */}
</div>
```

### 5. Add Click Handlers and Navigation
Implement navigation functionality:

```tsx
// CTA button handlers
const handleCruiseQuiz = () => {
  window.open('/cruise-match-quiz', '_blank');
};

const handlePlanCruise = () => {
  window.open('https://connect.cruisemadeeasy.com/widget/bookings/talk_travel', '_blank');
};

// Apply to buttons
<button onClick={handleCruiseQuiz} className="cta-button">
  Cruise Match Quiz
</button>
```

### 6. Integrate with PostPage
Add StickyHeader to PostPage component:

```tsx
// In PostPage.tsx
import { StickyHeader } from './StickyHeader';

export function PostPage() {
  return (
    <>
      {/* Existing CSS loading */}
      <StickyHeader />
      <main className="page-content">
        {/* Existing PostPage content */}
      </main>
    </>
  );
}
```

### 7. Test Responsive Behavior
- Test desktop layout and navigation
- Verify mobile hamburger menu functionality
- Check sticky behavior on scroll
- Validate all CTA links work correctly

### 8. Fix Layout and Styling Issues
Address common integration issues:

#### Z-index Problems
```css
.header-wrap {
  z-index: 9999;
  position: sticky;
  top: 0;
}
```

#### Mobile Menu Positioning
```css
.mobile-menu.open {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 300px;
  transform: translateX(0);
}
```

## Required Files to Reference

### Template Files
- `temp-components/sticky-header.html` - Primary header template
- `temp-components/head.html` - For any additional CSS requirements
- `src/utils/shared-components.ts` - Existing header generation logic

### Styling References
- R2 CSS files loaded in Phase 1 provide the styling
- GenerateBlocks classes: `.gb-element-*` provide layout and styling
- GeneratePress theme CSS handles responsive behavior

### Logo Assets
Check for logo files in:
- `public/` directory for logos
- `wp-components/media/` for brand assets
- R2 bucket for optimized logo files

## Testing Protocol

### Desktop Testing
1. **Navigation Layout**: Verify horizontal menu displays properly
2. **Logo Positioning**: Check logo size and alignment
3. **CTA Buttons**: Test all button clicks and links
4. **Sticky Behavior**: Scroll page to verify header sticks to top
5. **Hover States**: Check button and link hover effects

### Mobile Testing (Browser Dev Tools)
1. **Responsive Breakpoints**: Test at 768px, 480px, 320px widths
2. **Hamburger Menu**: Click to open mobile menu
3. **Menu Animation**: Verify slide-in animation works
4. **Close Functionality**: Test X button and overlay click
5. **Touch Targets**: Ensure buttons are large enough for touch

### Cross-Browser Testing
- Chrome/Chromium
- Firefox
- Safari (if available)
- Mobile browsers via dev tools

## Common Issues & Solutions

### Header Not Sticky
```css
.header-wrap {
  position: sticky;
  top: 0;
  z-index: 999;
}
```

### Mobile Menu Not Sliding
Check CSS transitions and transform properties:
```css
.mobile-menu {
  transform: translateX(100%);
  transition: transform 0.3s ease-in-out;
}
.mobile-menu.open {
  transform: translateX(0);
}
```

### Logo Size Issues
Adjust logo sizing for responsive display:
```css
.header-logo img {
  max-height: 60px;
  width: auto;
}

@media (max-width: 768px) {
  .header-logo img {
    max-height: 45px;
  }
}
```

### CTA Button Styling
Ensure buttons inherit proper GenerateBlocks styling:
```tsx
<button className="gb-element-button wp-element-button">
  CTA Text
</button>
```

## Success Criteria

### Functional Requirements
- [ ] Header renders with logo, navigation, and CTAs
- [ ] Mobile hamburger menu opens and closes properly
- [ ] All navigation links and buttons work correctly
- [ ] Header maintains sticky position on scroll
- [ ] Responsive behavior works across screen sizes

### Visual Requirements
- [ ] Header matches target layout from reference site
- [ ] Logo displays at correct size and positioning
- [ ] CTA buttons have proper styling and hover states
- [ ] Mobile menu slides smoothly and positions correctly
- [ ] Typography and spacing match design specifications

### Integration Requirements
- [ ] No conflicts with existing PostPage content
- [ ] Proper z-index layering (header above content)
- [ ] No console errors or warnings
- [ ] CSS from Phase 1 applies correctly to header elements

## Next Phase Preparation
- Document header component structure for future reference
- Note any custom styling or overrides needed
- Prepare for hero block integration below header

## Git Workflow
```bash
# Create component file and integrate
git add src/react-app/components/StickyHeader.tsx
git add src/react-app/components/PostPage.tsx

git commit -m "Phase 2: Add responsive sticky header component

- Extract header template from static HTML
- Convert to React component with mobile menu state
- Integrate hamburger navigation and CTA buttons
- Add sticky positioning with proper z-index
- Test responsive behavior across screen sizes

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## Validation Checklist
Before moving to Phase 3:
- [ ] Header displays correctly on desktop and mobile
- [ ] All navigation elements function properly
- [ ] Mobile menu animation works smoothly
- [ ] No styling conflicts with existing content
- [ ] Git commit completed with proper attribution

## Phase 3 Handoff
Prepare for hero block integration:
- Header component completed and tested
- Page structure ready for hero section below header
- CSS foundation supports dynamic background images