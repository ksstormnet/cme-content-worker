/**
 * Component-Based Template System
 * Extracts static WordPress components and assembles them into a complete page
 */

export interface TemplateComponents {
  header: string;
  hero: string;
  contentContainer: string;
  footer: string;
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

export class ComponentBasedTemplate {
  private components: TemplateComponents | null = null;

  /**
   * Initialize components from WordPress source
   */
  async initializeComponents(): Promise<void> {
    try {
      // For now, let's extract the components directly from the current WordPress page
      const response = await fetch('https://cruisemadeeasy.com/cruise-planning/');
      const html = await response.text();
      
      this.components = await this.extractComponents(html);
      console.log('Components extracted successfully');
    } catch (error) {
      console.error('Failed to initialize components:', error);
      throw error;
    }
  }

  /**
   * Extract components from WordPress HTML based on the actual page structure
   */
  private async extractComponents(html: string): Promise<TemplateComponents> {
    // Extract header: everything above <div class="site grid-container container hfeed" id="page">
    const headerMatch = html.match(/(<!DOCTYPE html>[\s\S]*?)<div[^>]*class="[^"]*site grid-container container hfeed[^"]*"[^>]*id="page"[^>]*>/i);
    const header = headerMatch ? headerMatch[1] : '';

    // Extract body container: from site div opening to where cards would be inserted
    const bodyContainerMatch = html.match(/(<div[^>]*class="[^"]*site grid-container container hfeed[^"]*"[^>]*id="page"[^>]*>[\s\S]*?)<div[^>]*class="[^"]*generate-columns-container[^"]*"[^>]*>/i);
    const bodyContainer = bodyContainerMatch ? bodyContainerMatch[1] : '<div class="site grid-container container hfeed" id="page">';
    
    // Get the generate-columns-container opening tag
    const containerMatch = html.match(/<div[^>]*class="[^"]*generate-columns-container[^"]*"[^>]*>/i);
    const containerStart = containerMatch ? containerMatch[0] : '<div class="generate-columns-container">';
    
    // Extract footer: from <div class="site-footer"> to the end
    const footerMatch = html.match(/(<div[^>]*class="[^"]*site-footer[^"]*"[\s\S]*?)$/i);
    const footer = footerMatch ? footerMatch[1] : '';

    // For hero/intro, look for any content between body container and generate-columns-container
    const heroMatch = html.match(/<div[^>]*class="[^"]*site grid-container container hfeed[^"]*"[^>]*id="page"[^>]*>([\s\S]*?)<div[^>]*class="[^"]*generate-columns-container[^"]*"[^>]*>/i);
    const hero = heroMatch ? heroMatch[1] : '';

    // Build the complete content container structure
    const contentContainer = bodyContainer + '\n' + containerStart + '\n{{DYNAMIC_CONTENT}}\n</div>\n</div>';

    return {
      header: this.cleanComponent(header),
      hero: '', // We'll include hero in the body container
      contentContainer: this.cleanComponent(contentContainer),
      footer: this.cleanComponent(footer)
    };
  }

  /**
   * Clean component HTML by removing unwanted scripts and elements
   */
  private cleanComponent(html: string): string {
    let cleaned = html;

    // Remove tracking scripts
    cleaned = cleaned.replace(/<script[^>]*>([\s\S]*?sentry|analytics|tracking|matomo|facebook|google)[\s\S]*?<\/script>/gi, '');
    cleaned = cleaned.replace(/<script[^>]*src="[^"]*(?:sentry|analytics|tracking|matomo|facebook|google)[^"]*"[^>]*><\/script>/gi, '');
    
    // Remove optimization detective scripts
    cleaned = cleaned.replace(/<script[^>]*optimization-detective[^>]*><\/script>/gi, '');
    
    // Remove noscript tracking
    cleaned = cleaned.replace(/<noscript>[\s\S]*?(?:analytics|tracking|matomo|facebook|google)[\s\S]*?<\/noscript>/gi, '');
    
    // Remove tracking meta tags
    cleaned = cleaned.replace(/<meta[^>]*name="(?:sentry-trace|baggage)"[^>]*>/gi, '');

    return cleaned;
  }

  /**
   * Generate post card HTML optimized for the GenerateBlocks structure
   */
  private generatePostCard(post: PostCardData): string {
    const categoryTitle = post.category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    const publishedDate = new Date(post.published_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
    <article class="post-${post.id} post type-post status-publish format-standard has-post-thumbnail hentry category-${post.category}" itemscope itemtype="http://schema.org/BlogPosting">
      ${post.featured_image_url ? `
      <div class="post-thumbnail">
        <a href="/${post.category}/${post.slug}/">
          <img src="${post.featured_image_url}" 
               alt="${this.escapeHtml(post.title)}" 
               loading="lazy"
               itemprop="image"
               class="attachment-full size-full wp-post-image">
        </a>
      </div>` : ''}
      
      <div class="entry-wrapper">
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
            <span class="cat-links">
              <a href="/${post.category}/" rel="category tag">${this.escapeHtml(categoryTitle)}</a>
            </span>
          </div>
        </header>
        
        ${post.excerpt || post.meta_description ? `
        <div class="entry-summary" itemprop="description">
          <p>${this.escapeHtml((post.excerpt || post.meta_description || '').substring(0, 150))}...</p>
          <p class="read-more-container">
            <a href="/${post.category}/${post.slug}/" class="read-more">Continue reading</a>
          </p>
        </div>` : ''}
      </div>
    </article>`;
  }

  /**
   * Render complete page with components
   */
  renderPage(posts: PostCardData[], cssUrls: string[]): string {
    if (!this.components) {
      throw new Error('Components not initialized. Call initializeComponents() first.');
    }

    // Generate post cards HTML
    const postCardsHtml = posts.map(post => this.generatePostCard(post)).join('\n');
    
    // Inject CSS URLs into header
    const cssLinks = cssUrls.map(url => `<link rel="stylesheet" href="${url}">`).join('\n  ');
    const headerWithCSS = this.components.header.replace('</head>', `  ${cssLinks}\n</head>`);
    
    // Assemble the complete page
    const contentWithPosts = this.components.contentContainer.replace('{{DYNAMIC_CONTENT}}', postCardsHtml);
    
    return `${headerWithCSS}
${this.components.hero}
${contentWithPosts}
${this.components.footer}`;
  }

  /**
   * Get components (for debugging/inspection)
   */
  getComponents(): TemplateComponents | null {
    return this.components;
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
export const componentTemplate = new ComponentBasedTemplate();