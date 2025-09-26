# Phase 3: Dynamic Hero Block

## Goal
Create React hero component with dynamic background image, post title, category, and metadata.

## Duration
1 context window

## Context for AI

### Prerequisites
- Phase 1: R2 CSS foundation established
- Phase 2: Static header integrated and working
- Development servers running: Vite (:5174) + Worker (:8787)

### Hero Block Structure
The hero block is the large visual section below the header containing:

#### Visual Elements
- **Background Image**: Dynamic featured image from post data
- **Overlay**: Dark gradient or color overlay for text readability
- **Responsive Sizing**: Adjusts height based on screen size

#### Text Content (Dynamic)
- **Category Pill**: Colored badge with category name
- **Post Title**: Main headline (H1 or H2)
- **Publication Date**: Formatted date display
- **Author Name**: Post author (conditional)

### CSS Classes from Template
Based on `temp-components/article-card.html` and existing blog structure:

#### Container Classes
- `.gb-element-947acc35` - Hero container with background image
- `.gb-element-ca29c3cc` - Content overlay container
- `.gb-element-*` - Additional layout elements

#### Text Styling Classes
- `.gb-text-44279aaa` - Category pill styling
- `.gb-text-4c89c85f` - Main title styling (large, bold)
- `.gb-text-663e6423` - Date/metadata styling
- `.dynamic-term-class` - Dynamic category-specific styling

#### Background Image Implementation
Uses CSS custom properties:
```css
.gb-element-947acc35 {
  background-image: var(--inline-bg-image);
  background-size: cover;
  background-position: center;
}
```

## Data Structure Expected

### Post Data Interface
```typescript
interface PostData {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  featured_image_url?: string;
  published_date: string;
  created_at: string;
  author_name?: string;
  category: string;
  meta_description?: string;
}

interface CategoryData {
  id: number;
  name: string;
  slug: string;
}
```

### Sample Data Format
```javascript
// Example post data structure
const postData = {
  title: "The Fall Cruise Strategy Most People Get Wrong",
  featured_image_url: "https://cruisemadeeasy-images.r2.dev/2025/09/cruise-ship-sunset.jpg",
  published_date: "2025-09-02T10:00:00Z",
  author_name: "Scott",
  category: "cruise-planning-tips"
};

const categoryData = {
  name: "Cruise Planning Tips",
  slug: "cruise-planning-tips"
};
```

## Implementation Steps

### 1. Examine Hero Template Structure
Reference the hero block structure from existing templates:

```bash
# Check for hero examples in templates
grep -r "gb-element-947acc35" temp-components/
grep -r "inline-bg-image" temp-components/
```

Look for the complete hero HTML structure to understand the layout.

### 2. Create HeroBlock React Component
Create new file: `src/react-app/components/HeroBlock.tsx`

```tsx
import React from 'react';

interface HeroBlockProps {
  post: PostData;
  category?: CategoryData;
}

export function HeroBlock({ post, category }: HeroBlockProps) {
  // Format publication date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  // Generate CSS custom property for background image
  const backgroundStyle = post.featured_image_url ? {
    '--inline-bg-image': `url(${post.featured_image_url})`
  } as React.CSSProperties : {};

  return (
    <div className="gb-element-947acc35" style={backgroundStyle}>
      <div className="gb-element-ca29c3cc">
        {/* Hero content goes here */}
      </div>
    </div>
  );
}
```

### 3. Implement Dynamic Content
Add the dynamic text content to the hero:

```tsx
return (
  <div className="gb-element-947acc35" style={backgroundStyle}>
    <div className="gb-element-ca29c3cc">
      
      {/* Category Pill */}
      {category && (
        <p className="gb-text gb-text-44279aaa dynamic-term-class">
          <span>{category.name}</span>
        </p>
      )}
      
      {/* Post Title */}
      <h1 className="gb-text gb-text-4c89c85f">
        {post.title}
      </h1>
      
      {/* Publication Date */}
      <p className="gb-text gb-text-663e6423">
        {formatDate(post.published_date)}
      </p>
      
      {/* Author (conditional) */}
      {post.author_name && (
        <p className="gb-text post-author">
          By {post.author_name}
        </p>
      )}
      
    </div>
  </div>
);
```

### 4. Handle Missing Featured Images
Add fallback handling for posts without featured images:

```tsx
// Fallback background for posts without images
const getBackgroundStyle = () => {
  if (post.featured_image_url) {
    return {
      '--inline-bg-image': `url(${post.featured_image_url})`
    } as React.CSSProperties;
  }
  
  // Fallback: solid color or default image
  return {
    backgroundColor: '#2c5aa0', // CME brand blue
    // OR: '--inline-bg-image': `url(/default-hero-bg.jpg)`
  } as React.CSSProperties;
};

// Use in component
<div className="gb-element-947acc35" style={getBackgroundStyle()}>
```

### 5. Add Category-Specific Styling
Implement dynamic styling based on category:

```tsx
// Generate category-specific classes
const getCategoryClasses = () => {
  const baseClass = 'gb-text gb-text-44279aaa';
  const categorySlug = category?.slug || 'default';
  return `${baseClass} category-${categorySlug}`;
};

// Apply to category pill
<p className={getCategoryClasses()}>
  <span>{category.name}</span>
</p>
```

### 6. Integrate with PostPage
Add HeroBlock to PostPage component:

```tsx
// In PostPage.tsx
import { HeroBlock } from './HeroBlock';

export function PostPage() {
  // Get or mock post data
  const postData = {
    // Current post data or mock data for testing
  };
  
  const categoryData = {
    // Current category data or mock data for testing
  };

  return (
    <>
      {/* Existing CSS and header */}
      <StickyHeader />
      
      {/* New hero block */}
      <HeroBlock post={postData} category={categoryData} />
      
      <main className="page-content">
        {/* Existing PostPage content */}
      </main>
    </>
  );
}
```

### 7. Test with Mock Data First
Start with hardcoded test data to verify styling:

```tsx
// Test data for initial implementation
const mockPostData = {
  id: 1,
  title: "Test Hero Title for Layout Verification",
  slug: "test-hero",
  featured_image_url: "https://cruisemadeeasy-images.r2.dev/2025/03/ncl-encore-waterfront.jpg",
  published_date: "2025-01-15T10:00:00Z",
  author_name: "Scott",
  category: "cruise-planning-tips"
};

const mockCategoryData = {
  id: 1,
  name: "Cruise Planning Tips", 
  slug: "cruise-planning-tips"
};
```

### 8. Wire Up Real Post Data
Once styling is confirmed, connect to actual post data:

```tsx
// If PostPage already has post data
const { postData, isLoading } = usePostData(); // or however data is accessed

// Or fetch from API
useEffect(() => {
  fetchPostData(postId).then(setPostData);
}, [postId]);
```

## Responsive Design Considerations

### Mobile Optimization
- **Text Sizing**: Ensure titles scale properly on small screens
- **Background Position**: May need different background positioning
- **Content Padding**: Adequate spacing on mobile devices

### Image Loading
- **Loading States**: Show placeholder while image loads
- **Error Handling**: Fallback for broken image URLs
- **Optimization**: Use appropriate image sizes for different screens

### Typography Scaling
```css
/* Responsive font sizes handled by GenerateBlocks CSS */
.gb-text-4c89c85f {
  /* Title - should scale automatically */
}

.gb-text-663e6423 {
  /* Date - should remain readable on mobile */
}
```

## Testing Protocol

### Visual Testing
1. **Desktop Layout**: Check hero height, text positioning, background image
2. **Mobile Layout**: Verify responsive behavior and text readability
3. **Text Contrast**: Ensure text is readable over background images
4. **Image Fallback**: Test with missing featured images

### Content Testing
1. **Long Titles**: Test with very long post titles
2. **Missing Data**: Test with missing author, category, or image
3. **Date Formatting**: Verify dates display correctly in different locales
4. **Category Names**: Test with different category name lengths

### Performance Testing
1. **Image Loading**: Check for smooth image loading without layout shift
2. **CSS Custom Properties**: Verify background image CSS works across browsers
3. **Rendering Speed**: Ensure component renders quickly

## Required Files to Reference

### Template References
- `temp-components/article-card.html` - Hero block HTML structure
- `temp-components/hero.html` - Alternative hero implementation
- `src/utils/blog-post-template.ts` - Server-side hero generation example

### Styling References
- R2 CSS loaded in Phase 1 provides `.gb-element-*` styling
- GenerateBlocks CSS handles responsive behavior
- WordPress block library CSS for text styling

### Data Sources
- Existing PostPage data structure
- API endpoints for post and category data
- Mock data for testing purposes

## Success Criteria

### Functional Requirements
- [ ] Hero block renders with dynamic background image
- [ ] Post title, date, and author display correctly
- [ ] Category pill shows with appropriate styling
- [ ] Component handles missing data gracefully (no crashes)
- [ ] Background images load and display properly

### Visual Requirements
- [ ] Hero matches target layout height and positioning
- [ ] Text is readable over background images (proper contrast)
- [ ] Category pill has proper color and spacing
- [ ] Typography matches design specifications
- [ ] Responsive behavior works on mobile and desktop

### Integration Requirements
- [ ] No conflicts with header component above
- [ ] Proper spacing with content below
- [ ] CSS custom properties work correctly
- [ ] Component integrates smoothly with PostPage

## Common Issues & Solutions

### Background Image Not Displaying
```tsx
// Ensure CSS custom property syntax is correct
const backgroundStyle = {
  '--inline-bg-image': `url("${imageUrl}")` // Note the quotes
} as React.CSSProperties;
```

### Text Not Readable Over Images
```css
/* Add text shadow or overlay */
.gb-element-ca29c3cc {
  background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4));
}
```

### Mobile Text Too Small
```css
/* Ensure responsive text sizing */
@media (max-width: 768px) {
  .gb-text-4c89c85f {
    font-size: 1.8rem !important;
    line-height: 1.2;
  }
}
```

## Git Workflow
```bash
# Add hero component
git add src/react-app/components/HeroBlock.tsx
git add src/react-app/components/PostPage.tsx

git commit -m "Phase 3: Add dynamic hero block component

- Create HeroBlock component with dynamic background images
- Implement post title, category pill, and metadata display
- Add responsive text sizing and mobile optimization
- Handle fallback cases for missing featured images
- Integrate with PostPage layout structure

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## Validation Checklist
Before moving to Phase 4:
- [ ] Hero block displays with proper background image
- [ ] All text content renders correctly
- [ ] Component handles missing data without errors
- [ ] Mobile and desktop layouts look good
- [ ] Integration with header component works properly

## Phase 4 Handoff
Prepare for breadcrumbs and content structure:
- Hero component completed with dynamic data
- Page layout ready for breadcrumb navigation
- Content area structure needs proper containers