/**
 * Blog Post Template Generator
 * Generates complete HTML for individual blog post pages
 */

import { SharedComponents } from './shared-components';

interface PostData {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content_html: string;
  category?: string;
  author_name?: string;
  published_date?: string;
  created_at: string;
  featured_image_url?: string;
  meta_description?: string;
}

interface ContentBlock {
  id: number;
  type: string;
  content: any;
  sort_order: number;
}

interface NavigationPost {
  title: string;
  slug: string;
  category: string;
  featured_image_url?: string;
}

export class BlogPostTemplate {
  
  /**
   * Generate complete blog post page HTML
   */
  static generatePostPage(
    post: PostData,
    blocks: ContentBlock[],
    cssUrl: string,
    navigation?: {
      prev?: NavigationPost;
      next?: NavigationPost;
    }
  ): string {
    const metaTags = this.generateMetaTags(post);
    const stickyTopBar = SharedComponents.generateStickyTopBar();
    const siteHeader = SharedComponents.generateSiteHeader();
    const breadcrumbs = this.generateBreadcrumbs(post);
    const mainContent = this.generateMainContent(post, blocks);
    const postNavigation = navigation ? this.generatePostNavigation(navigation) : '';
    const footer = SharedComponents.generateFooter();
    
    return `<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8">
  ${metaTags}
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${cssUrl ? `<link rel="stylesheet" href="${cssUrl}">` : ''}
  <link href="https://fonts.googleapis.com/css?family=Montserrat:400,600,700&display=swap" rel="stylesheet">
</head>
<body class="wp-singular post-template-default single single-post post-image-above-header post-image-aligned-center slideout-enabled slideout-mobile sticky-menu-fade sticky-enabled both-sticky-menu mobile-header mobile-header-logo mobile-header-sticky no-sidebar nav-float-right one-container header-aligned-left dropdown-hover contained-content" itemtype="https://schema.org/Blog" itemscope>
  
  <div class="header-wrap">
    <a class="screen-reader-text skip-link" href="#content" title="Skip to content">Skip to content</a>
    ${stickyTopBar}
    ${siteHeader}
  </div>

  <div class="site" id="page">
    <div class="site-content" id="content">
      ${breadcrumbs}
      ${mainContent}
      ${postNavigation}
    </div>
  </div>

  ${footer}
  
</body>
</html>`;
  }

  /**
   * Generate meta tags for the post
   */
  private static generateMetaTags(post: PostData): string {
    const title = `${post.title} - Cruise Made Easy`;
    const description = post.meta_description || post.excerpt || '';
    const publishedDate = post.published_date || post.created_at;
    const imageUrl = post.featured_image_url || '';
    
    return `
  <title>${this.escapeHtml(title)}</title>
  <meta name="description" content="${this.escapeHtml(description)}">
  <meta property="og:title" content="${this.escapeHtml(title)}">
  <meta property="og:description" content="${this.escapeHtml(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://cruisemadeeasy.com/${post.category}/${post.slug}/">
  <meta property="og:site_name" content="Cruise Made Easy">
  ${imageUrl ? `<meta property="og:image" content="${imageUrl}">` : ''}
  <meta property="article:published_time" content="${publishedDate}">
  ${post.author_name ? `<meta property="article:author" content="${post.author_name}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@CruiseMadeEasy">
  <meta name="twitter:title" content="${this.escapeHtml(title)}">
  <meta name="twitter:description" content="${this.escapeHtml(description)}">
  ${imageUrl ? `<meta name="twitter:image" content="${imageUrl}">` : ''}
  <link rel="canonical" href="https://cruisemadeeasy.com/${post.category}/${post.slug}/">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
    `.trim();
  }


  /**
   * Generate breadcrumb navigation
   */
  private static generateBreadcrumbs(post: PostData): string {
    const categoryName = post.category ? SharedComponents.formatCategoryName(post.category) : 'Tips & Guides';
    
    return `
<nav aria-label="Breadcrumb" class="breadcrumb-nav">
  <ol class="breadcrumb">
    <li><a href="/">Home</a></li>
    <li><a href="/category/${post.category}/">${categoryName}</a></li>
    <li aria-current="page">${SharedComponents.escapeHtml(post.title)}</li>
  </ol>
</nav>`;
  }

  /**
   * Generate main content area
   */
  private static generateMainContent(post: PostData, blocks: ContentBlock[]): string {
    const publishedDate = post.published_date || post.created_at;
    const formattedDate = new Date(publishedDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return `
<main class="site-main" id="main">
  <article id="post-${post.id}" class="post-${post.id} post type-post status-publish format-standard has-post-thumbnail hentry category-${post.category} no-featured-image-padding" itemtype="https://schema.org/CreativeWork" itemscope>
    <div class="inside-article">
      
      <header class="entry-header">
        <h1 class="entry-title" itemprop="headline">${SharedComponents.escapeHtml(post.title)}</h1>
        <div class="entry-meta">
          <time datetime="${publishedDate}" itemprop="datePublished">${formattedDate}</time>
          ${post.author_name ? `<span class="post-author" itemprop="author" itemscope itemtype="http://schema.org/Person">
            By <span itemprop="name">${SharedComponents.escapeHtml(post.author_name)}</span>
          </span>` : ''}
        </div>
      </header>

      <div class="entry-content" itemprop="text">
        ${post.content_html}
      </div>

      <footer class="entry-meta" aria-label="Entry meta">
        ${post.category ? `<span class="cat-links">
          <span class="gp-icon icon-categories">
            <svg viewBox="0 0 512 512" aria-hidden="true" width="1em" height="1em">
              <path d="M0 112c0-26.51 21.49-48 48-48h110.014a48 48 0 0143.592 27.907l12.349 26.791A16 16 0 00228.486 128H464c26.51 0 48 21.49 48 48v224c0 26.51-21.49 48-48 48H48c-26.51 0-48-21.49-48-48V112z" />
            </svg>
          </span>
          <span class="screen-reader-text">Categories </span>
          <a href="/category/${post.category}/" rel="category tag">${SharedComponents.formatCategoryName(post.category)}</a>
        </span>` : ''}
      </footer>

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

    </div>
  </article>
</main>`;
  }

  /**
   * Generate post navigation (prev/next posts)
   */
  private static generatePostNavigation(navigation: { prev?: NavigationPost; next?: NavigationPost }): string {
    if (!navigation.prev && !navigation.next) return '';

    return `
<div class="paging-navigation">
  <div class="gb-element-d1372a50">
    <div class="gb-element-8babdb99">
      
      ${navigation.prev ? `
      <div class="gb-element-2245e1ea">
        <a href="/${navigation.prev.category}/${navigation.prev.slug}/">
          ${navigation.prev.featured_image_url ? `
          <img width="100" height="100" 
               src="${navigation.prev.featured_image_url}" 
               class="dynamic-featured-image wp-post-image" 
               alt="" decoding="async" />
          ` : ''}
        </a>
        <p class="gb-text-df52da50">
          <span class="gb-shape">
            <svg viewBox="0 0 16 16" class="bi bi-arrow-left" fill="currentColor" height="16" width="16">
              <path d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" fill-rule="evenodd"></path>
            </svg>
          </span>
          <span class="gb-text">
            <a href="/${navigation.prev.category}/${navigation.prev.slug}/">
              ${SharedComponents.escapeHtml(navigation.prev.title)}
            </a>
          </span>
        </p>
      </div>
      ` : '<div class="gb-element-2245e1ea"></div>'}
      
      ${navigation.next ? `
      <div class="gb-element-3a7edbd3">
        <p class="gb-text-9a551628">
          <span class="gb-shape">
            <svg viewBox="0 0 16 16" class="bi bi-arrow-right" fill="currentColor" height="16" width="16">
              <path d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" fill-rule="evenodd"></path>
            </svg>
          </span>
          <span class="gb-text">
            <a href="/${navigation.next.category}/${navigation.next.slug}/">
              ${SharedComponents.escapeHtml(navigation.next.title)}
            </a>
          </span>
        </p>
        <a href="/${navigation.next.category}/${navigation.next.slug}/">
          ${navigation.next.featured_image_url ? `
          <img width="100" height="100" 
               src="${navigation.next.featured_image_url}" 
               class="dynamic-featured-image wp-post-image" 
               alt="" decoding="async" />
          ` : ''}
        </a>
      </div>
      ` : '<div class="gb-element-3a7edbd3"></div>'}
      
    </div>
  </div>
</div>`;
  }

}