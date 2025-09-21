/**
 * Static WordPress Template System - Using Real WordPress Content
 * Complete extracted components from actual WordPress page
 */

import { readFileSync } from 'fs';

export interface PostCardData {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  category: string;
  featured_image_url?: string;
  published_date: string;
  author_name?: string;
  meta_description?: string;
}

export interface CategoryData {
  slug: string;
  name: string;
  post_count: number;
}

export class RealStaticTemplate {

  /**
   * Generate post card using the exact GenerateBlocks structure from WordPress
   */
  private generatePostCard(post: PostCardData): string {
    const categoryTitle = post.category
      ? post.category
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : 'Uncategorized';
    
    const publishedDate = new Date(post.published_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Use the exact structure you provided
    return `<article id="post-${post.id}" class="dynamic-content-template post-${post.id} post type-post status-publish format-standard has-post-thumbnail hentry category-${post.category} generate-columns tablet-grid-50 mobile-grid-100 grid-parent grid-50 no-featured-image-padding">
<div class="gb-element-947acc35" style="--inline-bg-image: url(${post.featured_image_url || ''})">
<div class="gb-element-ca29c3cc">
<p class="gb-text gb-text-44279aaa dynamic-term-class"><span>${this.escapeHtml(categoryTitle)}</span></p>

<h2 class="gb-text gb-text-4c89c85f"><a href="/${post.category}/${post.slug}/">${this.escapeHtml(post.title)}</a></h2>

<p class="gb-text gb-text-663e6423">${publishedDate}</p>

<a class="gb-text gb-text-674a334b button" href="/${post.category}/${post.slug}/">View Article</a>
</div>
</div>
</article>`;
  }

  /**
   * Generate category pills HTML with scrollable navigation
   */
  private generateCategoryPills(categories: CategoryData[], currentCategory?: string): string {
    let categoryPills = '';
    
    // Add ALL pill for category pages (not homepage)
    if (currentCategory) {
      const allPillClass = currentCategory === 'all' ? 'category-pill category-pill-active' : 'category-pill';
      categoryPills += `<a href="/" class="${allPillClass}">ALL</a>`;
    }
    
    // Add regular category pills
    const regularPills = categories.map(category => {
      const displayName = category.name.toUpperCase();
      const isActive = currentCategory === category.slug;
      const pillClass = isActive ? 'category-pill category-pill-active' : 'category-pill';
      return `<a href="/category/${category.slug}/" class="${pillClass}">${displayName}</a>`;
    }).join('');
    
    categoryPills += regularPills;
    
    return `<div class="category-pills-container">
  ${categoryPills}
</div>`;
  }


  /**
   * Render complete page with real WordPress content
   */
  renderPage(posts: PostCardData[], cssUrls: string[], categories: CategoryData[] = [], heroText: string = "Cruise Smarter with Norwegian: Tips, Tricks & Planning Guides", currentCategory?: string): string {
    // Generate post cards HTML
    const postCardsHtml = posts.map(post => this.generatePostCard(post)).join('\n\n');
    
    // Generate category pills HTML
    const categoryPillsHtml = categories.length > 0 ? this.generateCategoryPills(categories, currentCategory) : '';
    
    // Add GenerateBlocks inline CSS that was uploaded to R2 with cache busting
    const timestamp = Date.now();
    const generateBlocksCSS = `https://cdn.cruisemadeeasy.com/css/generateblocks-complete.min.css?v=${timestamp}`;
    const allCssUrls = [...cssUrls, generateBlocksCSS];
    
    // Inject CSS URLs into header
    const cssLinks = allCssUrls.map(url => `<link rel="stylesheet" href="${url}">`).join('\n  ');
    
    // Assemble the complete page using the real WordPress structure
    return `${this.getHeader()}
  ${cssLinks}
</head>
<body class="home blog wp-embed-responsive generatepress hfeed no-sidebar">

${this.getHeaderBody()}

${this.getHero(heroText)}

${categoryPillsHtml ? categoryPillsHtml + '\n' : ''}
<div class="site grid-container container hfeed" id="page">
	<div class="site-content" id="content">
		<div class="content-area" id="primary">
			<main class="site-main" id="main">
<div class="generate-columns-container">
${postCardsHtml}
</div>
			</main>
		</div>
	</div>

${this.getFooter()}`;
  }

  /**
   * Real WordPress header with all meta tags and CSS
   */
  private getHeader(): string {
    return `<!DOCTYPE html>
<html lang="en-US">
<head>
	<meta charset="UTF-8">
	<title>Cruise Planning Tips for Norwegian Travelers | Cruise Made EASY</title>
	<style nonce="k8B1Qkyv97xikgRdPfEZXA==" >img:is([sizes="auto" i], [sizes^="auto," i]) { contain-intrinsic-size: 3000px 1500px }</style>
	<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="dc.title" content="Cruise Planning Tips for Norwegian Travelers | Cruise Made EASY">
<meta name="dc.description" content="Discover expert cruise planning tips, packing advice, and insider tricks for your next Norwegian cruise. From choosing the right itinerary to getting the most out of More at Sea — we make cruising easier.">
<meta name="dc.relation" content="https://cruisemadeeasy.com/cruise-planning/">
<meta name="dc.source" content="https://cruisemadeeasy.com/">
<meta name="dc.language" content="en_US">
<meta name="description" content="Discover expert cruise planning tips, packing advice, and insider tricks for your next Norwegian cruise. From choosing the right itinerary to getting the most out of More at Sea — we make cruising easier.">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
<link rel="canonical" href="https://cruisemadeeasy.com/cruise-planning/">
<script nonce="k8B1Qkyv97xikgRdPfEZXA==" id="website-schema" type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"Cruise Made EASY","alternateName":"CME | Cruise Made EASY","description":"Your Cruise, Your Way — Without the Hassle","url":"https://cruisemadeeasy.com"}</script>
<meta property="og:url" content="https://cruisemadeeasy.com/cruise-planning/">
<meta property="og:site_name" content="Cruise Made Easy">
<meta property="og:locale" content="en_US">
<meta property="og:type" content="website">
<meta property="og:title" content="Cruise Planning Tips for Norwegian Travelers | Cruise Made EASY">
<meta property="og:description" content="Discover expert cruise planning tips, packing advice, and insider tricks for your next Norwegian cruise. From choosing the right itinerary to getting the most out of More at Sea — we make cruising easier.">
<meta property="og:image" content="https://cruisemadeeasy.com/wp-content/uploads/2025/07/fb-og-default-image-1.png">
<meta property="og:image:secure_url" content="https://cruisemadeeasy.com/wp-content/uploads/2025/07/fb-og-default-image-1.png">
<meta property="og:image:width" content="1640">
<meta property="og:image:height" content="924">
<meta property="og:image:alt" content="Sunset view from a cruise ship deck">
<meta property="fb:pages" content="107480055526279, 109600461963155">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@CruiseMadeEasy">
<meta name="twitter:creator" content="@CruiseMadeEasy">
<meta name="twitter:title" content="Cruise Planning Tips for Norwegian Travelers | Cruise Made EASY">
<meta name="twitter:description" content="Discover expert cruise planning tips, packing advice, and insider tricks for your next Norwegian cruise. From choosing the right itinerary to getting the most out of More at Sea — we make cruising easier.">
<meta name="twitter:image" content="https://cruisemadeeasy.com/wp-content/uploads/2025/07/fb-og-default-image-1.png">
<link href='https://fonts.gstatic.com' crossorigin rel='preconnect' />
<link href='https://fonts.googleapis.com' crossorigin rel='preconnect' />
<link rel="alternate" type="application/rss+xml" title="Cruise Made Easy » Feed" href="https://cruisemadeeasy.com/feed/" />
<script nonce="k8B1Qkyv97xikgRdPfEZXA==" type="application/ld+json">{"@context":"https://schema.org","@type":"TravelAgency","image":"https://cruisemadeeasy.com/wp-content/uploads/2025/07/seopress-1200x630-2.webp","@id":"https://cruisemadeeasy.com","name":"Cruise Made EASY","telephone":"(316) 375-0200","address":{"@type":"PostalAddress","streetAddress":"4925 S Broadway Ave #3571","addressLocality":"Wichita","addressRegion":"Kansas","postalCode":"67216","addressCountry":"United States"},"openingHoursSpecification":[{"@type":"OpeningHoursSpecification","opens":"12:00:00","closes":"21:00:00","dayOfWeek":"https://schema.org/Monday"},{"@type":"OpeningHoursSpecification","opens":"12:00:00","closes":"21:00:00","dayOfWeek":"https://schema.org/Tuesday"},{"@type":"OpeningHoursSpecification","opens":"12:00:00","closes":"21:00:00","dayOfWeek":"https://schema.org/Wednesday"},{"@type":"OpeningHoursSpecification","opens":"12:00:00","closes":"21:00:00","dayOfWeek":"https://schema.org/Thursday"},{"@type":"OpeningHoursSpecification","opens":"12:00:00","closes":"21:00:00","dayOfWeek":"https://schema.org/Friday"},{"@type":"OpeningHoursSpecification","opens":"10:00:00","closes":"18:00:00","dayOfWeek":"https://schema.org/Saturday"},{"@type":"OpeningHoursSpecification","opens":"14:00:00","closes":"18:00:00","dayOfWeek":"https://schema.org/Sunday"}]}</script>
<script nonce="k8B1Qkyv97xikgRdPfEZXA==" type="application/ld+json">{"@context":"https://schema.org","name":"Breadcrumb","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@type":"WebPage","id":"https://cruisemadeeasy.com/cruise-planning/#webpage","url":"https://cruisemadeeasy.com/cruise-planning/","name":"Cruise Smarter with Norwegian: Tips, Tricks & Planning Guides"}}]}</script>`;
  }

  /**
   * Real WordPress header body with navigation
   */
  private getHeaderBody(): string {
    return `
	<div class="header-wrap"><a class="screen-reader-text skip-link" href="#content" title="Skip to content">Skip to content</a>
<div class="gb-element-6d98b3bd hide-on-mobile">
<div class="gb-element-a31c4cb5">
<div class="gb-element-0db34a8b">
<div class="gb-element-047d3b1f">
<figure class="wp-block-image size-full"><a href="https://cruisemadeeasy.com/"><img alt="" decoding="async" width="132" height="54" sizes="(max-width: 132px) 100vw, 132px" src="https://cruisemadeeasy.com/wp-content/uploads/2025/02/Small-Wrods-White-over-no-color-126x85-1.png" alt="" class="wp-image-5901"/></a></figure>
</div>



<div class="gb-element-7653835a">
<a class="gb-text gb-text-fe08e03c" href="/which-cruiser-are-you">🧭 <strong>Cruise Match Quiz</strong></a>



<a class="gb-text gb-text-c882862d" href="https://cruisemadeeasy.com/cruise-planning-services/"><strong>🧳 <strong>PLan My Cruise</strong></strong></a>



<a class="gb-text gb-text-8e5e6e91" href="/cruise-planning/">🧠 <strong>Tips &amp; Guides</strong></a>



<a class="gb-text gb-text-bcd02962" href="https://connect.cruisemadeeasy.com/widget/bookings/talk_travel" target="_blank" rel="noopener nofollow"><strong>Start the Conversation</strong></a>



<p class="gb-text-bd574af4"><span class="gb-shape"><svg viewBox="0 0 16 16" class="bi bi-phone" fill="currentColor" height="16" width="16" xmlns="https://www.w3.org/2000/svg">   <path d="M11 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h6zM5 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H5z"></path>   <path d="M8 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"></path> </svg></span><span class="gb-text"><a href="tel:+13163750200" data-type="tel" data-id="tel:+13163750200">Call / text (316) 375-0200</a></span></p>
</div>
</div>
</div>
</div>`;
  }

  /**
   * Real WordPress hero section - simplified with reduced height
   */
  private getHero(heroText: string = "Cruise Smarter with Norwegian: Tips, Tricks &#038; Planning Guides"): string {
    return `<div class="gb-element-ba1def1c" style="padding: 120px 30px 60px 30px;">
<div class="gb-element-f90eb26c" style="padding: 80px 30px 40px 30px;">
<h1 class="gb-text gb-text-96e95bfb">${heroText}</h1>
<div style="width: 100px; height: 4px; background-color: var(--accent); margin: 20px auto 0 auto;"></div>
</div>
</div>`;
  }

  /**
   * Real WordPress footer section
   */
  private getFooter(): string {
    return `	<div class="site-footer">
	
<div class="gb-element-8850b7bc  alignwide">
<div>
<div class="gb-element-c56a38e3"></div>



<div>
<div class="gb-element-299e3421">
<div class="gb-element-99528bfa">
<div class="gb-element-e458cc94"><div class="wp-block-image">
<figure class="aligncenter size-full is-resized"><img alt="" loading="lazy" decoding="async" width="1221" height="1112" sizes="auto, (max-width: 1221px) 100vw, 1221px" src="https://cruisemadeeasy.com/wp-content/uploads/2025/07/white-svg-vertical.svg" alt="" class="wp-image-7512" style="object-fit:cover;width:132px;height:107px"/></figure></div>


<p class="has-text-align-center" style="font-size:16px"><strong>Helping You Cruise Smarter,<br>One Trip at a Time</strong></p>
</div>
</div>



<div class="gb-element-02d88715">
<h4 class="gb-text gb-text-1e906952">Legal</h4>


<nav class="is-vertical wp-block-navigation is-layout-flex wp-container-core-navigation-is-layout-8cad6afd wp-block-navigation-is-layout-flex" aria-label="Navigation"><ul class="wp-block-navigation__container  is-vertical wp-block-navigation"><li class=" wp-block-navigation-item wp-block-navigation-link"><a class="wp-block-navigation-item__content"  href="https://cruisemadeeasy.com/client-agreement-summary/"><span class="wp-block-navigation-item__label">Summary of Terms</span></a></li><li class=" wp-block-navigation-item wp-block-navigation-link"><a class="wp-block-navigation-item__content"  href="https://cruisemadeeasy.com/detailed-tracvel-tc/"><span class="wp-block-navigation-item__label">Full Terms &amp; Conditions</span></a></li><li class=" wp-block-navigation-item wp-block-navigation-link"><a class="wp-block-navigation-item__content"  href="https://cruisemadeeasy.com/privacy-policy/"><span class="wp-block-navigation-item__label">Privacy Policy</span></a></li></ul></nav></div>



<div class="gb-element-73c7971f">
<h4 class="gb-text gb-text-1e906952">Connect</h4>


<nav class="is-vertical wp-block-navigation is-layout-flex wp-container-core-navigation-is-layout-9bb33f80 wp-block-navigation-is-layout-flex" aria-label="Navigation"><ul class="wp-block-navigation__container  is-vertical wp-block-navigation"><li class=" wp-block-navigation-item wp-block-navigation-link"><a class="wp-block-navigation-item__content"  href="https://cruisemadeeasy.com/contact/"><span class="wp-block-navigation-item__label">Contact Us</span></a></li><li class=" wp-block-navigation-item wp-block-navigation-link"><a class="wp-block-navigation-item__content"  href="https://www.facebook.com/CruiseMadeEasy/"><span class="wp-block-navigation-item__label">Facebook</span></a></li><li class=" wp-block-navigation-item wp-block-navigation-link"><a class="wp-block-navigation-item__content"  href="https://cruisemadeeasy.com/about-scott/"><span class="wp-block-navigation-item__label">About Scott</span></a></li></ul></nav></div>
</div>



<div class="wp-block-spacer" aria-hidden="true" style="height:30px"></div>



<p class="has-text-align-center">© 2024 Cruise Made EASY • <a href="https://cruisemadeeasy.com/privacy-policy/" data-type="page" data-id="3">Privacy Policy</a></p>
</div>
</div>

		<footer class="site-info">
			<div class="inside-site-info grid-container">
			</div>
		</footer>
	</div>
</div>

<style>
/* Gray text area controls height - image adjusts to fit */
.generate-columns-container {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-gap: 30px;
  margin: 0 30px;
  margin-bottom: 30px; /* Add padding between articles and footer */
  align-items: start; /* Allow items to size naturally */
}

.generate-columns-container article {
  display: block; /* Let content flow naturally */
}

/* Background image container adjusts to content */
.generate-columns-container article .gb-element-947acc35 {
  display: block;
  position: relative;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  min-height: 200px; /* Minimum height for image area */
}

/* Gray text area has equal heights and controls overall card size */
.generate-columns-container article .gb-element-ca29c3cc {
  /* This will be set to equal heights by JavaScript */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px; /* Ensure consistent padding */
  background-color: rgba(36,36,36,0.49);
  border-bottom-right-radius: 10px;
  width: 60%;
  position: relative;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .generate-columns-container {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin: 0 20px;
    grid-gap: 20px;
  }
  
  .generate-columns-container article .gb-element-ca29c3cc {
    width: 90%;
  }
}

@media (max-width: 480px) {
  .generate-columns-container {
    grid-template-columns: 1fr;
    margin: 0 15px;
    grid-gap: 15px;
  }
  
  .generate-columns-container article .gb-element-ca29c3cc {
    width: 100%;
  }
}
</style>

<script>
// Equalize gray text area heights - they control the overall card size
(function() {
  function equalizeGrayTextAreas() {
    console.log('Equalizing gray text areas...');
    
    const textAreas = document.querySelectorAll('.generate-columns-container .gb-element-ca29c3cc');
    console.log('Found gray text areas:', textAreas.length);
    
    if (textAreas.length === 0) return;
    
    // Reset heights first
    textAreas.forEach(area => {
      area.style.height = '';
      area.style.minHeight = '';
    });
    
    // Force layout recalculation
    document.body.offsetHeight;
    
    // Wait a moment, then measure and equalize
    setTimeout(() => {
      let maxHeight = 0;
      const heights = [];
      
      textAreas.forEach((area, index) => {
        const height = area.offsetHeight;
        heights.push(height);
        console.log('Gray text area', index, 'height:', height);
        if (height > maxHeight) {
          maxHeight = height;
        }
      });
      
      console.log('Max gray area height found:', maxHeight);
      console.log('All gray area heights:', heights);
      
      if (maxHeight > 0) {
        textAreas.forEach((area, index) => {
          area.style.height = maxHeight + 'px';
          console.log('Set gray area', index, 'to height:', maxHeight);
        });
        console.log('Equal gray text area heights applied!');
      }
    }, 100);
  }
  
  // Run after DOM and images load
  if (document.readyState === 'complete') {
    equalizeGrayTextAreas();
  } else {
    window.addEventListener('load', equalizeGrayTextAreas);
  }
  
  // Also run after a delay
  setTimeout(equalizeGrayTextAreas, 1500);
  
  // Handle resize
  window.addEventListener('resize', function() {
    setTimeout(equalizeGrayTextAreas, 200);
  });
})();
</script>
</body>
</html>`;
  }

  /**
   * Utility: Escape HTML
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

// Export singleton instance
export const realStaticTemplate = new RealStaticTemplate();