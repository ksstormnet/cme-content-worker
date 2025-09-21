/**
 * HTML Template Generator - Creates complete SEO-optimized HTML documents
 * Supports homepage, category, and single post layouts with proper meta tags
 */

export interface HTMLTemplateData {
  // Page content
  title: string;
  content_html: string;
  
  // SEO metadata
  meta_title?: string;
  meta_description?: string;
  keywords?: string[];
  canonical_url: string;
  
  // Styling and assets
  css_url?: string; // Legacy single CSS URL (deprecated)
  css_urls?: string[]; // Multiple CSS URLs in loading order
  additional_css?: string[];
  
  // Layout configuration
  layout_type: 'homepage' | 'category' | 'post';
  
  // Schema.org structured data
  schema_data?: object;
  
  // Open Graph / Social media
  og_image?: string;
  og_type?: string;
  
  // Page-specific data
  author?: string;
  published_date?: string;
  modified_date?: string;
  category?: string;
  
  // Site configuration
  site_name?: string;
  site_url?: string;
  
  // Performance
  preload_resources?: string[];
  
  // Analytics/Tracking
  analytics_id?: string;
}

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

export class HTMLTemplateGenerator {
  private defaultSiteName = "Cruise Made Easy";
  private defaultSiteUrl = "https://blog.cruisemadeeasy.com";

  /**
   * Generate complete HTML document
   */
  generateHTML(data: HTMLTemplateData): string {
    const siteName = data.site_name || this.defaultSiteName;
    const siteUrl = data.site_url || this.defaultSiteUrl;
    const pageTitle = data.meta_title || data.title;
    const fullTitle = data.layout_type === 'homepage' 
      ? `${pageTitle} - ${siteName}`
      : `${pageTitle} | ${siteName}`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <meta name="googlebot" content="index, follow">
  
  <!-- Primary Meta Tags -->
  <title>${this.escapeHtml(fullTitle)}</title>
  ${data.meta_description ? `<meta name="description" content="${this.escapeHtml(data.meta_description)}">` : ''}
  ${data.keywords?.length ? `<meta name="keywords" content="${data.keywords.map(k => this.escapeHtml(k)).join(', ')}">` : ''}
  ${data.author ? `<meta name="author" content="${this.escapeHtml(data.author)}">` : ''}
  
  <!-- Canonical URL -->
  <link rel="canonical" href="${this.escapeHtml(data.canonical_url)}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${data.og_type || this.getOGType(data.layout_type)}">
  <meta property="og:title" content="${this.escapeHtml(pageTitle)}">
  ${data.meta_description ? `<meta property="og:description" content="${this.escapeHtml(data.meta_description)}">` : ''}
  <meta property="og:url" content="${this.escapeHtml(data.canonical_url)}">
  <meta property="og:site_name" content="${this.escapeHtml(siteName)}">
  ${data.og_image ? `<meta property="og:image" content="${this.escapeHtml(data.og_image)}">` : ''}
  ${data.og_image ? `<meta property="og:image:alt" content="${this.escapeHtml(data.title)}">` : ''}
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${this.escapeHtml(pageTitle)}">
  ${data.meta_description ? `<meta name="twitter:description" content="${this.escapeHtml(data.meta_description)}">` : ''}
  ${data.og_image ? `<meta name="twitter:image" content="${this.escapeHtml(data.og_image)}">` : ''}
  
  <!-- Article metadata (for posts) -->
  ${this.generateArticleMeta(data)}
  
  <!-- Preload critical resources -->
  ${this.generatePreloadLinks(data)}
  
  <!-- Schema.org JSON-LD -->
  ${data.schema_data ? this.generateSchemaScript(data.schema_data) : ''}
  
  <!-- WordPress CSS files in loading order -->
  ${data.css_urls?.map(css => `<link rel="stylesheet" href="${this.escapeHtml(css)}">`).join('\n  ') || ''}
  ${data.css_url ? `<link rel="stylesheet" href="${this.escapeHtml(data.css_url)}">` : ''}
  
  <!-- Additional stylesheets -->
  ${data.additional_css?.map(css => `<link rel="stylesheet" href="${this.escapeHtml(css)}">`).join('\n  ') || ''}
  
  <!-- Fallback CSS (inline) - temporary until external CSS issue is resolved -->
  ${(data as any).fallback_css ? `<style>${(data as any).fallback_css}</style>` : ''}
  
  <!-- Favicon and app icons -->
  ${this.generateFaviconLinks(siteUrl)}
  
  ${data.analytics_id ? this.generateAnalytics(data.analytics_id) : ''}
</head>
<body class="home blog ${data.layout_type} wp-embed-responsive generatepress hfeed no-sidebar">
  <!-- Skip to main content for accessibility -->
  <a href="#main-content" class="skip-link" aria-label="Skip to main content">Skip to content</a>
  
  ${data.content_html}
  
  <!-- Performance and UX scripts -->
  ${this.generateFooterScripts(data)}
</body>
</html>`;
  }

  /**
   * Generate homepage HTML with post cards
   */
  generateHomepage(posts: PostCardData[], cssUrls: string[], additionalData?: Partial<HTMLTemplateData>): string {
    const contentHtml = this.renderPostCards(posts);
    
    const templateData: HTMLTemplateData = {
      title: "Expert Cruise Planning Tips & Guides",
      meta_title: "Cruise Made Easy - Your Ultimate Cruise Planning Resource",
      meta_description: "Discover expert cruise planning tips, destination guides, and insider secrets to make your next cruise vacation unforgettable. From Norwegian Cruise Line to luxury voyages.",
      keywords: ["cruise planning", "cruise tips", "Norwegian Cruise Line", "cruise vacation", "cruise guide"],
      canonical_url: "https://blog.cruisemadeeasy.com/",
      css_urls: cssUrls,
      layout_type: "homepage",
      content_html: contentHtml,
      schema_data: this.generateHomepageSchema(posts),
      og_type: "website",
      og_image: posts.find(p => p.featured_image_url)?.featured_image_url,
      ...additionalData
    };

    return this.generateHTML(templateData);
  }

  /**
   * Generate category archive page
   */
  generateCategoryPage(category: string, posts: PostCardData[], cssUrl: string, additionalData?: Partial<HTMLTemplateData>): string {
    const categoryTitle = this.formatCategoryTitle(category);
    const contentHtml = this.renderCategoryArchive(category, posts);
    
    const templateData: HTMLTemplateData = {
      title: `${categoryTitle} Cruise Tips & Guides`,
      meta_title: `${categoryTitle} - Cruise Made Easy`,
      meta_description: `Expert ${categoryTitle.toLowerCase()} cruise tips, guides, and insights. Everything you need to know about ${categoryTitle.toLowerCase()} for your perfect cruise vacation.`,
      keywords: [categoryTitle.toLowerCase(), "cruise tips", "cruise planning", "cruise guide"],
      canonical_url: `https://blog.cruisemadeeasy.com/${category}/`,
      css_url: cssUrl,
      layout_type: "category",
      content_html: contentHtml,
      category,
      schema_data: this.generateCategorySchema(category, posts),
      og_type: "website",
      og_image: posts.find(p => p.featured_image_url)?.featured_image_url,
      ...additionalData
    };

    return this.generateHTML(templateData);
  }

  /**
   * Generate single post page
   */
  generatePostPage(post: any, contentBlocks: any[], cssUrl: string, additionalData?: Partial<HTMLTemplateData>): string {
    // Note: contentBlocks would be rendered using the BlockRenderer
    const contentHtml = `<article class="post-content">
      <header class="post-header">
        <h1>${this.escapeHtml(post.title)}</h1>
        ${this.generatePostMeta(post)}
      </header>
      <div class="post-body">
        ${additionalData?.content_html || '<!-- Content blocks would be rendered here -->'}
      </div>
    </article>`;
    
    const templateData: HTMLTemplateData = {
      title: post.title,
      meta_title: post.meta_title || post.title,
      meta_description: post.meta_description,
      keywords: post.keywords ? JSON.parse(post.keywords) : [],
      canonical_url: `https://blog.cruisemadeeasy.com/${post.category}/${post.slug}/`,
      css_url: cssUrl,
      layout_type: "post",
      content_html: contentHtml,
      author: post.author_name,
      published_date: post.published_date,
      modified_date: post.updated_at,
      category: post.category,
      og_image: post.featured_image_url,
      schema_data: this.generatePostSchema(post),
      ...additionalData
    };

    return this.generateHTML(templateData);
  }

  /**
   * Render post cards for homepage/category pages (with full WordPress wrapper)
   */
  renderPostCards(posts: PostCardData[]): string {
    console.log('renderPostCards called with posts:', posts);
    console.log('Posts length:', posts.length);
    
    if (!posts.length) {
      console.log('No posts found, returning no-posts div');
      return '<div class="no-posts">No posts found</div>';
    }

    const cardsHtml = posts.map(post => this.renderPostCard(post)).join('\n');
    console.log('Generated cards HTML length:', cardsHtml.length);
    
    return `<div id="page" class="site">
  <header class="site-header">
    <div class="inside-header grid-container">
      <div class="site-branding">
        <h1 class="site-title">
          <a href="/" rel="home">Cruise Made Easy</a>
        </h1>
        <p class="site-description">Your ultimate guide to unforgettable cruise vacations</p>
      </div>
    </div>
  </header>

  <div id="content" class="site-content">
    <div class="content-area">
      <main id="main" class="site-main">
        <div class="inside-article">
          <div class="wp-block-post-content">
            <div class="is-layout-flow wp-block-post-content">
              <div class="wp-block-query">
                <div class="wp-block-post-template is-layout-grid columns-3">
                  ${cardsHtml}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</div>`;
  }

  /**
   * Render just the post cards content (for template replacement)
   */
  renderPostCardsOnly(posts: PostCardData[]): string {
    console.log('renderPostCardsOnly called with posts:', posts);
    console.log('Posts length:', posts.length);
    
    if (!posts.length) {
      return '<div class="no-posts">No posts found</div>';
    }

    const cardsHtml = posts.map(post => this.renderPostCard(post)).join('\n');
    console.log('Generated cards-only HTML length:', cardsHtml.length);
    
    return cardsHtml;
  }

  /**
   * Render single post card optimized for CSS Grid layout
   */
  private renderGridPostCard(post: PostCardData): string {
    const categoryTitle = this.formatCategoryTitle(post.category);
    const publishedDate = new Date(post.published_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `<article class="cme-post-card" itemscope itemtype="http://schema.org/BlogPosting">
    ${post.featured_image_url ? `
    <div class="post-image">
      <a href="/${post.category}/${post.slug}/">
        <img src="${this.escapeHtml(post.featured_image_url)}" 
             alt="${this.escapeHtml(post.title)}" 
             loading="lazy"
             itemprop="image"
             style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">
      </a>
    </div>` : ''}
    
    <div class="post-content" style="padding: 1rem 0;">
      <h3 class="post-title" itemprop="headline" style="margin: 0 0 0.5rem 0; font-size: 1.25rem; line-height: 1.4;">
        <a href="/${post.category}/${post.slug}/" rel="bookmark" itemprop="url" style="color: #333; text-decoration: none;">
          ${this.escapeHtml(post.title)}
        </a>
      </h3>
      
      <div class="post-meta" style="font-size: 0.875rem; color: #666; margin-bottom: 0.75rem;">
        <time datetime="${post.published_date}" itemprop="datePublished">
          ${publishedDate}
        </time>
        <span style="margin: 0 0.5rem;">•</span>
        <a href="/${post.category}/" style="color: #0073aa; text-decoration: none;">${this.escapeHtml(categoryTitle)}</a>
      </div>
      
      ${post.excerpt || post.meta_description ? `
      <div class="post-excerpt" itemprop="description" style="font-size: 0.875rem; line-height: 1.5; margin-bottom: 1rem;">
        <p style="margin: 0;">${this.escapeHtml((post.excerpt || post.meta_description || '').substring(0, 120))}...</p>
      </div>` : ''}
      
      <a href="/${post.category}/${post.slug}/" class="read-more" style="color: #0073aa; text-decoration: none; font-weight: 600; font-size: 0.875rem;">
        Read More →
      </a>
    </div>
</article>`;
  }

  /**
   * Render single post card (original GeneratePress style)
   */
  private renderPostCard(post: PostCardData): string {
    const categoryTitle = this.formatCategoryTitle(post.category);
    const publishedDate = new Date(post.published_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `<article class="post-${post.id} post type-post status-publish format-standard has-post-thumbnail hentry generate-columns tablet-grid-50 mobile-grid-100 grid-parent grid-50" itemscope itemtype="http://schema.org/BlogPosting">
    ${post.featured_image_url ? `
    <div class="post-image">
      <a href="/${post.category}/${post.slug}/">
        <img src="${this.escapeHtml(post.featured_image_url)}" 
             alt="${this.escapeHtml(post.title)}" 
             loading="lazy"
             itemprop="image"
             class="attachment-full size-full wp-post-image"
             width="640"
             height="360">
      </a>
    </div>` : ''}
    
    <div class="inside-article">
      <header class="entry-header">
        <h2 class="entry-title" itemprop="headline">
          <a href="/${post.category}/${post.slug}/" rel="bookmark" itemprop="url">
            ${this.escapeHtml(post.title)}
          </a>
        </h2>
        
        <div class="entry-meta">
          <span class="posted-on">
            <time datetime="${post.published_date}" itemprop="datePublished" class="entry-date published">
              ${publishedDate}
            </time>
          </span>
          <span class="byline">
            <span class="author vcard" itemprop="author" itemscope itemtype="https://schema.org/Person">
              <span itemprop="name">${this.escapeHtml(post.author_name || 'Cruise Made Easy')}</span>
            </span>
          </span>
          <span class="cat-links">
            <a href="/${post.category}/" rel="category tag">${this.escapeHtml(categoryTitle)}</a>
          </span>
        </div>
      </header>
      
      ${post.excerpt || post.meta_description ? `
      <div class="entry-summary" itemprop="description">
        <p>${this.escapeHtml(post.excerpt || post.meta_description || '')}</p>
        <div class="read-more-container">
          <a href="/${post.category}/${post.slug}/" class="read-more">Read more</a>
        </div>
      </div>` : ''}
    </div>
</article>`;
  }

  /**
   * Render category archive page
   */
  private renderCategoryArchive(category: string, posts: PostCardData[]): string {
    const categoryTitle = this.formatCategoryTitle(category);
    const cardsHtml = posts.map(post => this.renderPostCard(post)).join('\n');

    return `<main id="main-content" role="main">
  <header class="category-header">
    <nav aria-label="Breadcrumb">
      <ol class="breadcrumb">
        <li><a href="/">Home</a></li>
        <li aria-current="page">${this.escapeHtml(categoryTitle)}</li>
      </ol>
    </nav>
    
    <h1>${this.escapeHtml(categoryTitle)} Cruise Guides</h1>
    <p class="category-description">Expert tips and insights for ${categoryTitle.toLowerCase()} cruise planning</p>
  </header>
  
  <section class="posts-grid" aria-label="${categoryTitle} cruise guides">
    ${cardsHtml}
  </section>
</main>`;
  }

  /**
   * Utility methods
   */

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private formatCategoryTitle(category: string): string {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private getOGType(layoutType: string): string {
    return layoutType === 'post' ? 'article' : 'website';
  }

  private generateArticleMeta(data: HTMLTemplateData): string {
    if (data.layout_type !== 'post') return '';
    
    let meta = '';
    if (data.published_date) {
      meta += `<meta property="article:published_time" content="${data.published_date}">
  `;
    }
    if (data.modified_date) {
      meta += `<meta property="article:modified_time" content="${data.modified_date}">
  `;
    }
    if (data.author) {
      meta += `<meta property="article:author" content="${this.escapeHtml(data.author)}">
  `;
    }
    if (data.category) {
      meta += `<meta property="article:section" content="${this.escapeHtml(data.category)}">
  `;
    }
    
    return meta;
  }

  private generatePreloadLinks(data: HTMLTemplateData): string {
    let preloads = `<link rel="preload" href="${data.css_url}" as="style">`;
    
    if (data.preload_resources?.length) {
      preloads += '\n  ' + data.preload_resources
        .map(resource => `<link rel="preload" href="${this.escapeHtml(resource)}" as="style">`)
        .join('\n  ');
    }
    
    return preloads;
  }

  private generateSchemaScript(schemaData: object): string {
    return `<script type="application/ld+json">
${JSON.stringify(schemaData, null, 2)}
</script>`;
  }

  private generateFaviconLinks(siteUrl: string): string {
    return `<!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="${siteUrl}/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="${siteUrl}/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="${siteUrl}/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="${siteUrl}/apple-touch-icon.png">`;
  }

  private generateAnalytics(analyticsId: string): string {
    return `<!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${analyticsId}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${analyticsId}');
  </script>`;
  }

  private generateFooterScripts(data: HTMLTemplateData): string {
    return `<!-- Performance optimization scripts -->
  <script>
    // Lazy loading fallback for older browsers
    if ('loading' in HTMLImageElement.prototype === false) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/lazysizes@5.3.2/lazysizes.min.js';
      document.head.appendChild(script);
    }
  </script>`;
  }

  private generatePostMeta(post: any): string {
    const publishedDate = new Date(post.published_date || post.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `<div class="post-meta">
      <div class="post-date">
        <time datetime="${post.published_date || post.created_at}" itemprop="datePublished">
          ${publishedDate}
        </time>
      </div>
      ${post.author_name ? `
      <div class="post-author" itemprop="author" itemscope itemtype="http://schema.org/Person">
        By <span itemprop="name">${this.escapeHtml(post.author_name)}</span>
      </div>` : ''}
      ${post.category ? `
      <div class="post-category">
        <a href="/${post.category}/">${this.formatCategoryTitle(post.category)}</a>
      </div>` : ''}
    </div>`;
  }

  // Schema.org generators
  private generateHomepageSchema(posts: PostCardData[]): object {
    return {
      "@context": "http://schema.org",
      "@type": "Blog",
      "name": "Cruise Made Easy",
      "description": "Expert cruise planning tips and guides for unforgettable cruise vacations",
      "url": "https://blog.cruisemadeeasy.com",
      "blogPost": posts.slice(0, 5).map(post => ({
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.meta_description || post.excerpt,
        "url": `https://blog.cruisemadeeasy.com/${post.category}/${post.slug}/`,
        "datePublished": post.published_date,
        "author": {
          "@type": "Person",
          "name": post.author_name || "Cruise Made Easy Team"
        }
      }))
    };
  }

  private generateCategorySchema(category: string, posts: PostCardData[]): object {
    return {
      "@context": "http://schema.org",
      "@type": "CollectionPage",
      "name": `${this.formatCategoryTitle(category)} - Cruise Made Easy`,
      "description": `${this.formatCategoryTitle(category)} cruise planning tips and guides`,
      "url": `https://blog.cruisemadeeasy.com/${category}/`,
      "mainEntity": {
        "@type": "Blog",
        "blogPost": posts.map(post => ({
          "@type": "BlogPosting",
          "headline": post.title,
          "description": post.meta_description || post.excerpt,
          "url": `https://blog.cruisemadeeasy.com/${post.category}/${post.slug}/`,
          "datePublished": post.published_date
        }))
      }
    };
  }

  private generatePostSchema(post: any): object {
    return {
      "@context": "http://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.meta_description,
      "url": `https://blog.cruisemadeeasy.com/${post.category}/${post.slug}/`,
      "datePublished": post.published_date || post.created_at,
      "dateModified": post.updated_at || post.published_date || post.created_at,
      "author": {
        "@type": "Person",
        "name": post.author_name || "Cruise Made Easy Team"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Cruise Made Easy",
        "logo": {
          "@type": "ImageObject",
          "url": "https://blog.cruisemadeeasy.com/logo.png"
        }
      }
    };
  }
}

// Export default instance
export const htmlTemplateGenerator = new HTMLTemplateGenerator();