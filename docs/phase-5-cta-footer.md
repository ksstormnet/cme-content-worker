# Phase 5: Static CTA & Footer

## Goal
Add call-to-action section and footer from existing templates to complete page shell.

## Duration
1 context window

## Context for AI

### Prerequisites
- Phase 1: R2 CSS foundation established
- Phase 2: Static header integrated
- Phase 3: Dynamic hero block implemented
- Phase 4: Breadcrumbs and content structure completed
- Development servers running: Vite (:5174) + Worker (:8787)

### Static CTA Section
The static CTA is a call-to-action section that appears after the main content.

#### CTA Source & Structure
- **Primary Source**: `src/utils/blog-post-template.ts` lines 178-192
- **CSS Classes**: `.gb-element-718de565`, `.gb-element-c26bb9ef`
- **Content**: "How Can I Help Plan Your Perfect NCL Cruise?"
- **Button**: "Let's Talk Cruises" with cruise ship emoji
- **Link**: External booking widget at GoHighLevel

#### CTA HTML Template Reference
```html
<!-- Call to Action Section -->
<div class="gb-element-718de565">
  <div class="gb-element-c26bb9ef">
    <h3 class="gb-text gb-text-301a7e52">How Can I Help Plan Your Perfect NCL Cruise?</h3>
    <div class="wp-block-buttons alignwide has-custom-font-size has-medium-font-size is-content-justification-center">
      <div class="wp-block-button">
        <a class="wp-block-button__link has-medium-font-size wp-element-button" 
           href="https://connect.cruisemadeeasy.com/widget/bookings/talk_travel" 
           style="border-radius:26px">
          🛳️&nbsp;<strong>Let's Talk Cruises</strong>
        </a>
      </div>
    </div>
  </div>
</div>
```

### Footer Section
The footer contains branding, legal links, and social media.

#### Footer Source & Structure  
- **Primary Source**: `temp-components/footer.html`
- **Alternative**: `public/temp-components/footer.html`
- **Structure**: Three-column layout
- **Content**: Logo, legal navigation, social media links

#### Footer Components
1. **Logo Section**: 
   - Vertical white CME logo
   - Company tagline/description
   - Contact information

2. **Legal Navigation**:
   - Terms of Service
   - Privacy Policy 
   - Full Terms & Conditions
   - Other legal pages

3. **Social Media Links**:
   - Facebook, X (Twitter), Instagram
   - Pinterest, LinkedIn, YouTube
   - Cruise Critic profile
   - Proper social media icons

#### Footer CSS Classes
- `.site-footer` - Main footer container
- `.footer-widgets` - Widget area container
- `.gb-element-*` - GenerateBlocks layout elements
- WordPress footer styling classes

## Implementation Steps

### 1. Create StaticCTA React Component
Create new file: `src/react-app/components/StaticCTA.tsx`

```tsx
import React from 'react';

export function StaticCTA() {
  const handleCTAClick = () => {
    // Track CTA click if analytics are implemented
    // gtag('event', 'click', { event_category: 'CTA' });
    
    // Open booking widget in new tab
    window.open(
      'https://connect.cruisemadeeasy.com/widget/bookings/talk_travel', 
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="gb-element-718de565">
      <div className="gb-element-c26bb9ef">
        
        <h3 className="gb-text gb-text-301a7e52">
          How Can I Help Plan Your Perfect NCL Cruise?
        </h3>
        
        <div className="wp-block-buttons alignwide has-custom-font-size has-medium-font-size is-content-justification-center">
          <div className="wp-block-button">
            <button 
              className="wp-block-button__link has-medium-font-size wp-element-button" 
              onClick={handleCTAClick}
              style={{ borderRadius: '26px' }}
              type="button"
            >
              🛳️&nbsp;<strong>Let's Talk Cruises</strong>
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
```

### 2. Extract Footer Template Content
Read the footer template file:

```bash
# Check footer template locations
cat temp-components/footer.html
# OR
cat public/temp-components/footer.html
```

Analyze the complete footer structure and extract all necessary elements.

### 3. Create Footer React Component  
Create new file: `src/react-app/components/Footer.tsx`

```tsx
import React from 'react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { name: 'Facebook', url: 'https://facebook.com/cruisemadeeasy', icon: 'facebook' },
    { name: 'X', url: 'https://x.com/cruisemadeeasy', icon: 'twitter' },
    { name: 'Instagram', url: 'https://instagram.com/cruisemadeeasy', icon: 'instagram' },
    { name: 'Pinterest', url: 'https://pinterest.com/cruisemadeeasy', icon: 'pinterest' },
    { name: 'LinkedIn', url: 'https://linkedin.com/company/cruisemadeeasy', icon: 'linkedin' },
    { name: 'Cruise Critic', url: 'https://cruisecritic.com', icon: 'anchor' }
  ];

  const legalLinks = [
    { name: 'Terms of Service', url: '/terms/' },
    { name: 'Privacy Policy', url: '/privacy/' },
    { name: 'Full Terms & Conditions', url: '/terms-conditions/' }
  ];

  return (
    <footer className="site-footer">
      <div className="footer-widgets">
        
        {/* Logo and Company Info */}
        <div className="footer-column footer-branding">
          <div className="footer-logo">
            {/* Add logo image once found in templates */}
            <h4>Cruise Made Easy</h4>
            <p>Making cruise planning simple and stress-free.</p>
          </div>
        </div>

        {/* Legal Links */}
        <div className="footer-column footer-legal">
          <h5>Legal</h5>
          <ul>
            {legalLinks.map(link => (
              <li key={link.name}>
                <a href={link.url}>{link.name}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Social Media */}
        <div className="footer-column footer-social">
          <h5>Follow Us</h5>
          <div className="social-links">
            {socialLinks.map(social => (
              <a 
                key={social.name}
                href={social.url} 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label={social.name}
              >
                {/* Add proper social icons */}
                <span>{social.name}</span>
              </a>
            ))}
          </div>
        </div>

      </div>
      
      {/* Copyright */}
      <div className="footer-bottom">
        <p>&copy; {currentYear} Cruise Made Easy. All rights reserved.</p>
      </div>
    </footer>
  );
}
```

### 4. Add Social Media Icons
Extract or implement social media icons from the footer template:

```tsx
// Social icon component
const SocialIcon = ({ type, className }: { type: string; className?: string }) => {
  const icons: Record<string, JSX.Element> = {
    facebook: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    twitter: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
      </svg>
    ),
    // Add other social icons as needed
  };
  
  return icons[type] || null;
};
```

### 5. Integrate Components with PostPage
Add both components to the PostPage layout:

```tsx
// In PostPage.tsx
import { StaticCTA } from './StaticCTA';
import { Footer } from './Footer';

export function PostPage() {
  return (
    <>
      <StickyHeader />
      <HeroBlock post={postData} category={categoryData} />
      
      <div className="site" id="page">
        <div className="site-content" id="content">
          <Breadcrumbs {...breadcrumbProps} />
          
          <div className="content-area" id="primary">
            <main className="site-main" id="main">
              <article className="post-content">
                {/* Existing post content */}
              </article>
            </main>
          </div>
          
        </div>
      </div>

      {/* Add CTA after main content */}
      <StaticCTA />
      
      {/* Add footer at bottom */}
      <Footer />
    </>
  );
}
```

### 6. Test CTA Functionality
Verify the CTA button works correctly:

1. **Click Handler**: Button opens booking widget
2. **External Link**: Opens in new tab with proper security
3. **Styling**: Button matches design specifications
4. **Mobile**: Touch-friendly on mobile devices

### 7. Test Footer Links and Layout
Verify all footer elements function:

1. **Legal Links**: Navigate to correct pages
2. **Social Links**: Open social media profiles in new tabs
3. **Layout**: Three-column layout displays properly
4. **Mobile**: Footer adapts to mobile screens

### 8. Verify Complete Page Layout
Test the complete page structure:

1. **Header**: Sticky header with navigation
2. **Hero**: Dynamic hero with post information  
3. **Breadcrumbs**: Navigation path
4. **Content**: Main post content area
5. **CTA**: Call-to-action section
6. **Footer**: Footer with links and branding

## Logo and Asset Integration

### Find Logo Assets
Check for logo files in templates:

```bash
# Search for logo references in footer template
grep -i logo temp-components/footer.html

# Check for logo files
find . -name "*logo*" -type f
find wp-components/media -name "*logo*" -type f 2>/dev/null
```

### Logo Implementation
```tsx
// Add logo to footer once found
const FooterLogo = () => (
  <div className="footer-logo">
    <img 
      src="/path/to/white-logo.svg" 
      alt="Cruise Made Easy Logo" 
      width="150" 
      height="auto"
    />
  </div>
);
```

## Testing Protocol

### CTA Testing
1. **Button Click**: Verify booking widget opens
2. **External Link Security**: Check `noopener noreferrer` attributes
3. **Mobile Touch**: Ensure button is touch-friendly
4. **Analytics**: If implemented, verify tracking works

### Footer Testing  
1. **Legal Links**: Test all footer navigation links
2. **Social Links**: Verify social media links open correctly
3. **Mobile Layout**: Check footer responsive behavior
4. **Accessibility**: Test with screen readers

### Complete Layout Testing
1. **Visual Flow**: Verify natural page flow from header to footer
2. **Spacing**: Check proper spacing between all sections
3. **Mobile Responsive**: Test complete layout on mobile
4. **Print Styles**: Verify page prints properly if needed

## Required Files to Reference

### Template Sources
- `src/utils/blog-post-template.ts` lines 178-192 - CTA implementation
- `temp-components/footer.html` - Footer HTML structure
- `temp-components/reconstructed-page.html` - Complete page reference

### Logo and Asset Sources
- `wp-components/media/` directories - Logo files
- `public/` directory - Static assets
- R2 bucket - Optimized brand assets

### CSS Dependencies  
- GenerateBlocks CSS for `.gb-element-*` classes
- WordPress button styling for CTA
- Footer and social media styling from theme CSS

## Success Criteria

### CTA Requirements
- [ ] CTA section renders with correct styling
- [ ] Button text and emoji display properly
- [ ] Click handler opens booking widget correctly
- [ ] External link security attributes present

### Footer Requirements
- [ ] Footer displays with proper three-column layout
- [ ] All legal links navigate to correct pages
- [ ] Social media links open in new tabs
- [ ] Footer adapts properly to mobile screens
- [ ] Copyright year updates dynamically

### Integration Requirements
- [ ] No conflicts with existing page components
- [ ] Proper spacing and layout flow maintained
- [ ] CSS from previous phases applies correctly
- [ ] Complete page layout matches target design

## Common Issues & Solutions

### CTA Button Not Styled Correctly
```css
/* Ensure WordPress button classes are applied */
.wp-block-button__link {
  /* WordPress button styles should apply */
}
```

### Footer Layout Issues on Mobile
```css
/* Responsive footer layout */
@media (max-width: 768px) {
  .footer-widgets {
    flex-direction: column;
    text-align: center;
  }
  
  .footer-column {
    margin-bottom: 2rem;
  }
}
```

### Social Icons Not Displaying
```tsx
// Ensure proper icon SVG structure
const socialIcons = {
  facebook: <svg>...</svg>,
  // Include all necessary social icons
};
```

### External Links Security
```tsx
// Proper external link security
<a 
  href={externalUrl}
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Opens in new tab"
>
  Link Text
</a>
```

## Git Workflow
```bash
# Add CTA and footer components
git add src/react-app/components/StaticCTA.tsx
git add src/react-app/components/Footer.tsx
git add src/react-app/components/PostPage.tsx

git commit -m "Phase 5: Add static CTA section and footer

- Create StaticCTA component with booking widget integration
- Implement Footer with three-column layout and social links
- Add legal navigation and company branding
- Integrate components into complete page layout
- Test responsive behavior and external link functionality

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## Validation Checklist
Before moving to Phase 6:
- [ ] CTA button opens booking widget correctly
- [ ] Footer displays with all links functional
- [ ] Complete page layout flows properly
- [ ] Mobile responsive behavior works
- [ ] No console errors or styling conflicts

## Phase 6 Handoff
Prepare for post navigation and final polish:
- Complete page shell established (header, hero, content, CTA, footer)
- All static components integrated and functional
- Ready for dynamic post navigation implementation