# Phase 4: Breadcrumbs & Content Structure

## Goal
Add breadcrumb navigation and establish proper content container structure matching target layout.

## Duration
1 context window

## Context for AI

### Prerequisites
- Phase 1: R2 CSS foundation established
- Phase 2: Static header integrated
- Phase 3: Dynamic hero block implemented
- Development servers running: Vite (:5174) + Worker (:8787)

### Breadcrumb Navigation Structure
Based on `src/utils/blog-post-template.ts` lines 123-134, breadcrumbs provide hierarchical navigation:

#### Navigation Path
- **Home** → **Category** → **Current Post**
- Example: Home → Cruise Planning Tips → The Fall Cruise Strategy Most People Get Wrong

#### CSS Classes
- `.breadcrumb-nav` - Navigation container
- `.breadcrumb` - Ordered list element
- Standard list styling for breadcrumb items

#### Accessibility Features
- `aria-label="Breadcrumb"` for screen readers
- `aria-current="page"` for current page indicator
- Semantic HTML with proper navigation structure

### Content Container Structure
Target layout requires proper WordPress-style containers:

#### Page Structure Hierarchy
```html
<div class="site" id="page">
  <div class="site-content" id="content">
    <!-- Breadcrumbs -->
    <!-- Main Content Area -->
  </div>
</div>
```

#### Container Classes (WordPress/GeneratePress)
- `.site` - Top-level page container
- `.site-content` - Main content wrapper
- `.content-area` - Primary content container
- `.site-main` - Main content element

## Data Requirements

### Breadcrumb Data Structure
```typescript
interface BreadcrumbData {
  homeUrl: string;
  categoryName: string;
  categorySlug: string;
  postTitle: string;
}

// Example data
const breadcrumbData = {
  homeUrl: "/",
  categoryName: "Cruise Planning Tips", 
  categorySlug: "cruise-planning-tips",
  postTitle: "The Fall Cruise Strategy Most People Get Wrong"
};
```

### Category Name Formatting
Categories need display name formatting:
- `cruise-planning-tips` → `Cruise Planning Tips`
- `luxury-cruises` → `Luxury Cruises`
- `budget-travel` → `Budget Travel`

## Implementation Steps

### 1. Create Breadcrumbs React Component
Create new file: `src/react-app/components/Breadcrumbs.tsx`

```tsx
import React from 'react';

interface BreadcrumbsProps {
  categoryName: string;
  categorySlug: string;
  postTitle: string;
  homeUrl?: string;
}

export function Breadcrumbs({ 
  categoryName, 
  categorySlug, 
  postTitle, 
  homeUrl = "/" 
}: BreadcrumbsProps) {
  
  const formatCategoryName = (slug: string) => {
    // Convert slug to display name
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const displayCategoryName = categoryName || formatCategoryName(categorySlug);

  return (
    <nav aria-label="Breadcrumb" className="breadcrumb-nav">
      <ol className="breadcrumb">
        <li>
          <a href={homeUrl}>Home</a>
        </li>
        <li>
          <a href={`/category/${categorySlug}/`}>
            {displayCategoryName}
          </a>
        </li>
        <li aria-current="page">
          {postTitle}
        </li>
      </ol>
    </nav>
  );
}
```

### 2. Extract Breadcrumb Template Reference
Check the existing breadcrumb implementation:

```bash
# Find breadcrumb template in blog-post-template.ts
grep -A 10 -B 5 "generateBreadcrumbs" src/utils/blog-post-template.ts
```

Use this as reference for proper HTML structure and CSS classes.

### 3. Add Proper Page Container Structure
Update PostPage to include proper WordPress containers:

```tsx
// In PostPage.tsx
import { Breadcrumbs } from './Breadcrumbs';

export function PostPage() {
  const postData = {
    // Your existing post data
  };

  const categoryData = {
    // Your existing category data
  };

  return (
    <>
      {/* Existing CSS loading */}
      <StickyHeader />
      <HeroBlock post={postData} category={categoryData} />
      
      {/* Add proper site structure */}
      <div className="site" id="page">
        <div className="site-content" id="content">
          
          {/* Breadcrumb navigation */}
          <Breadcrumbs 
            categoryName={categoryData.name}
            categorySlug={categoryData.slug}
            postTitle={postData.title}
          />
          
          {/* Content area */}
          <div className="content-area" id="primary">
            <main className="site-main" id="main">
              
              {/* Move existing PostPage content here */}
              <article className="post-content">
                {/* Your existing post rendering logic */}
              </article>
              
            </main>
          </div>
          
        </div>
      </div>
    </>
  );
}
```

### 4. Implement Navigation Link Handling
Add proper link handling for breadcrumb navigation:

```tsx
// In Breadcrumbs component
const handleCategoryClick = (e: React.MouseEvent) => {
  e.preventDefault();
  // Handle navigation - could be React Router or window.location
  window.location.href = `/category/${categorySlug}/`;
};

const handleHomeClick = (e: React.MouseEvent) => {
  e.preventDefault();
  window.location.href = homeUrl;
};

// Apply to links
<a href={homeUrl} onClick={handleHomeClick}>Home</a>
<a href={`/category/${categorySlug}/`} onClick={handleCategoryClick}>
  {displayCategoryName}
</a>
```

### 5. Add Breadcrumb Styling Support
Ensure breadcrumbs have proper styling from WordPress CSS:

```tsx
// Add any additional classes needed for styling
<nav aria-label="Breadcrumb" className="breadcrumb-nav wp-block-navigation">
  <ol className="breadcrumb wp-block-navigation__responsive-container">
    {/* Breadcrumb items */}
  </ol>
</nav>
```

### 6. Test Content Container Structure
Verify the container structure works properly:

1. **Layout Flow**: Content flows correctly within containers
2. **CSS Inheritance**: WordPress styles apply to nested elements
3. **Responsive Behavior**: Containers adapt to screen sizes
4. **Accessibility**: Proper heading hierarchy and navigation

### 7. Move Existing Content Into Structure
Reorganize existing PostPage content to fit the new structure:

```tsx
// Inside the main content area
<main className="site-main" id="main">
  <article 
    className="post type-post status-publish format-standard has-post-thumbnail"
    itemType="https://schema.org/CreativeWork" 
    itemScope
  >
    <div className="inside-article">
      
      {/* Post content goes here */}
      <div className="entry-content" itemProp="text">
        {/* Your existing block rendering or content */}
      </div>
      
    </div>
  </article>
</main>
```

### 8. Test Navigation Functionality
Verify all navigation elements work correctly:

- **Home Link**: Navigates to homepage
- **Category Link**: Navigates to category archive
- **Current Page**: Properly indicated with `aria-current`
- **Responsive**: Works on mobile and desktop

## WordPress Structure Reference

### From blog-post-template.ts
The existing template shows this structure:
```html
<nav aria-label="Breadcrumb" class="breadcrumb-nav">
  <ol class="breadcrumb">
    <li><a href="/">Home</a></li>
    <li><a href="/category/CATEGORY/">CATEGORY_NAME</a></li>
    <li aria-current="page">POST_TITLE</li>
  </ol>
</nav>
```

### Container Structure Pattern
```html
<div class="site" id="page">
  <div class="site-content" id="content">
    <!-- Breadcrumbs here -->
    <main class="site-main" id="main">
      <article class="post-content">
        <!-- Article content here -->
      </article>
    </main>
  </div>
</div>
```

## Testing Protocol

### Navigation Testing
1. **Home Link**: Click breadcrumb home link
2. **Category Link**: Click category breadcrumb 
3. **Visual Indication**: Verify current page styling
4. **Mobile Layout**: Test breadcrumbs on small screens

### Structure Testing
1. **CSS Application**: Verify WordPress styles apply correctly
2. **Content Flow**: Check content flows within containers
3. **Responsive Design**: Test container behavior on different screens
4. **Accessibility**: Use screen reader or accessibility tools

### Integration Testing
1. **Header Integration**: No conflicts with sticky header
2. **Hero Integration**: Proper spacing after hero block
3. **Content Alignment**: Content aligns properly within containers
4. **Footer Preparation**: Structure ready for footer addition

## Required Files to Reference

### Template References
- `src/utils/blog-post-template.ts` lines 123-134 - Breadcrumb implementation
- `src/utils/shared-components.ts` - Category name formatting utilities
- `temp-components/body.html` - Container structure examples

### CSS Dependencies
- WordPress block library CSS (loaded in Phase 1)
- GeneratePress theme CSS for container styling
- Navigation and breadcrumb styling from WordPress CSS

## Success Criteria

### Functional Requirements
- [ ] Breadcrumbs render with correct navigation path
- [ ] Home and category links navigate properly
- [ ] Current page indicator works correctly
- [ ] Breadcrumbs are accessible with screen readers

### Visual Requirements  
- [ ] Breadcrumbs display with proper styling and spacing
- [ ] Navigation links have appropriate hover states
- [ ] Current page text is visually distinguished
- [ ] Mobile breadcrumbs remain usable and readable

### Structure Requirements
- [ ] Proper WordPress container hierarchy implemented
- [ ] Content flows correctly within new structure
- [ ] CSS from previous phases still applies correctly
- [ ] Page maintains semantic HTML structure

## Common Issues & Solutions

### Breadcrumb Links Not Working
```tsx
// Ensure proper link handling
const navigate = (url: string) => {
  // Use your app's navigation method
  window.location.href = url;
  // OR: router.push(url) for React Router
};
```

### Container CSS Not Applying
```css
/* Verify container classes are correct */
.site {
  /* WordPress site container styles */
}

.site-content {
  /* Content wrapper styles */
}
```

### Category Name Formatting Issues
```tsx
// Robust category name formatting
const formatCategoryName = (slug: string) => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
```

### Mobile Breadcrumb Overflow
```css
/* Handle long breadcrumb text on mobile */
.breadcrumb {
  flex-wrap: wrap;
  gap: 0.5rem;
}

.breadcrumb li {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}
```

## Git Workflow
```bash
# Add breadcrumb and structure changes
git add src/react-app/components/Breadcrumbs.tsx
git add src/react-app/components/PostPage.tsx

git commit -m "Phase 4: Add breadcrumbs and proper content structure

- Create Breadcrumbs component with hierarchical navigation
- Implement proper WordPress container structure
- Add semantic HTML with accessibility attributes
- Reorganize PostPage content into structured containers
- Test navigation functionality and responsive behavior

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## Validation Checklist
Before moving to Phase 5:
- [ ] Breadcrumbs display and navigate correctly
- [ ] Content structure follows WordPress patterns
- [ ] All previous components still work properly
- [ ] Mobile responsive behavior maintained
- [ ] Accessibility attributes function correctly

## Phase 5 Handoff
Prepare for CTA and footer integration:
- Content structure established with proper containers
- Navigation system working correctly
- Page ready for static CTA and footer components