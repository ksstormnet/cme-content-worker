/**
 * Static WordPress Template System
 * One-time extracted components from WordPress page
 */

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

export class StaticTemplate {

  /**
   * Generate post card using the exact GenerateBlocks structure from WordPress
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
   * Render complete page with static template parts
   */
  renderPage(posts: PostCardData[], cssUrls: string[]): string {
    // Generate post cards HTML
    const postCardsHtml = posts.map(post => this.generatePostCard(post)).join('\n\n');
    
    // Add GenerateBlocks inline CSS that was uploaded to R2
    const generateBlocksCSS = 'https://cdn.cruisemadeeasy.com/css/unknown.min.css';
    const allCssUrls = [...cssUrls, generateBlocksCSS];
    
    // Inject CSS URLs into header
    const cssLinks = allCssUrls.map(url => `<link rel="stylesheet" href="${url}">`).join('\n  ');
    
    // Assemble the complete page using the structure you identified
    return `${this.getHeader()}
  ${cssLinks}
</head>
<body class="home blog wp-embed-responsive generatepress hfeed no-sidebar">

${this.getBodyContainer()}
<div class="generate-columns-container">
${postCardsHtml}
</div>
${this.getBodyContainerClose()}

${this.getFooter()}`;
  }

  /**
   * Header: everything above <div class="site grid-container container hfeed" id="page">
   */
  private getHeader(): string {
    return `<!DOCTYPE html>
<html lang="en-US">
<head>
	<meta charset="UTF-8">
	<title>Cruise Planning Tips for Norwegian Travelers | Cruise Made EASY</title>
	<style nonce="k8B1Qkyv97xikgRdPfEZXA==" >img:is([sizes="auto" i], [sizes^="auto," i]) { contain-intrinsic-size: 3000px 1500px }</style>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="dc.title" content="Cruise Planning Tips for Norwegian Travelers | Cruise Made EASY">
	<meta name="dc.description" content="Discover expert cruise planning tips, packing advice, and insider tricks for your next Norwegian cruise. From choosing the right itinerary to getting the most out of More at Sea — we make cruising easier.">
	<meta name="dc.relation" content="https://cruisemadeeasy.com/cruise-planning/">
	<meta name="dc.source" content="https://cruisemadeeasy.com/">
	<meta name="dc.language" content="en_US">
	<meta name="description" content="Discover expert cruise planning tips, packing advice, and insider tricks for your next Norwegian cruise. From choosing the right itinerary to getting the most out of More at Sea — we make cruising easier.">
	<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
	<link rel="canonical" href="https://cruisemadeeasy.com/cruise-planning/">`;
  }

  /**
   * Body container: <div class="site grid-container container hfeed" id="page"> and structure up to where cards go
   */
  private getBodyContainer(): string {
    return `<div class="site grid-container container hfeed" id="page">
	<header class="site-header">
		<div class="inside-header grid-container">
			<div class="site-branding">
				<p class="main-title" itemprop="headline">
					<a href="https://cruisemadeeasy.com/" rel="home">
						Cruise Made EASY					</a>
				</p>
			</div>
			<nav class="main-navigation" itemscope itemtype="https://schema.org/SiteNavigationElement">
				<button class="menu-toggle" aria-controls="generate-slideout-menu" aria-expanded="false">
					<span class="gp-icon icon-menu-bars"><svg viewBox="0 0 512 512" aria-hidden="true" role="img" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1em" height="1em">
						<path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z"></path>
					</svg></span><span class="screen-reader-text">Menu</span>
				</button>
				<div id="site-navigation" class="main-nav">
					<ul id="menu-main" class="menu sf-menu">
						<li id="menu-item-6897" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-6897"><a href="https://cruisemadeeasy.com/cruise-planning/">Cruise Planning</a></li>
						<li id="menu-item-6898" class="menu-item menu-item-type-taxonomy menu-item-object-category menu-item-6898"><a href="https://cruisemadeeasy.com/category/cruise-tips/">Cruise Tips</a></li>
						<li id="menu-item-6899" class="menu-item menu-item-type-taxonomy menu-item-object-category menu-item-6899"><a href="https://cruisemadeeasy.com/category/weekend-wanderlust/">Weekend Wanderlust</a></li>
					</ul>
				</div>
			</nav>
		</div>
	</header>

	<div class="site-content" id="content">
		<div class="content-area" id="primary">
			<main class="site-main" id="main">`;
  }

  /**
   * Close the body container structure after cards
   */
  private getBodyContainerClose(): string {
    return `			</main>
		</div>
	</div>`;
  }

  /**
   * Footer: from <div class="site-footer"> to the end
   */
  private getFooter(): string {
    return `	<div class="site-footer">
		<footer class="site-info">
			<div class="inside-site-info grid-container">
				<div class="copyright-bar">
					© 2024 Cruise Made EASY • <a href="https://cruisemadeeasy.com/privacy-policy/">Privacy Policy</a>
				</div>
			</div>
		</footer>
	</div>
</div>
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
export const staticTemplate = new StaticTemplate();