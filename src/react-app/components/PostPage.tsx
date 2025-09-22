import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  featured_image_url: string;
  published_date: string;
  created_at: string;
  updated_at: string;
  author_name: string;
  meta_description: string;
  content_blocks?: ContentBlock[];
}

interface ContentBlock {
  id: number;
  post_id: number;
  block_type: string;
  content: any;
  block_order: number;
}

const PostPage: React.FC = () => {
  const { category, slug } = useParams<{ category: string; slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [contentHtml, setContentHtml] = useState<string>('');
  const [cssUrls, setCssUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category && slug) {
      Promise.all([
        fetchPostData(category, slug),
        fetchCSSUrls()
      ]).finally(() => setLoading(false));
    }
  }, [category, slug]);

  const fetchPostData = async (categorySlug: string, postSlug: string) => {
    try {
      // Fetch post data with content blocks
      const response = await fetch(`/api/posts/${categorySlug}/${postSlug}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Post not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setPost(data.data);
        
        // Render content blocks to HTML using the server API
        if (data.data.content_blocks && data.data.content_blocks.length > 0) {
          try {
            const blocksResponse = await fetch(`/api/posts/${categorySlug}/${postSlug}/render`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                blocks: data.data.content_blocks
              })
            });
            
            if (blocksResponse.ok) {
              const blocksData = await blocksResponse.json();
              if (blocksData.success) {
                setContentHtml(blocksData.data.html);
              } else {
                // Fallback to simple rendering
                setContentHtml(renderContentBlocksFallback(data.data.content_blocks));
              }
            } else {
              // Fallback to simple rendering
              setContentHtml(renderContentBlocksFallback(data.data.content_blocks));
            }
          } catch (blockError) {
            console.error('Error rendering content blocks:', blockError);
            // Fallback to simple rendering
            setContentHtml(renderContentBlocksFallback(data.data.content_blocks));
          }
        } else {
          setContentHtml('<p>No content available for this post.</p>');
        }
      } else {
        throw new Error(data.error || 'Failed to fetch post');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch post');
    }
  };

  const fetchCSSUrls = async () => {
    try {
      const response = await fetch('/api/css/post');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (data.success) {
        const urls = data.css_files
          .map((file: any) => file.cdn_url || file.source_url)
          .filter(Boolean);
        setCssUrls(urls);
        
        // Inject CSS into document head
        urls.forEach((url: string) => {
          if (!document.querySelector(`link[href="${url}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            document.head.appendChild(link);
          }
        });
        
        // Add GenerateBlocks CSS with cache busting
        const timestamp = Date.now();
        const generateBlocksCSS = `https://cdn.cruisemadeeasy.com/css/generateblocks-complete.min.css?v=${timestamp}`;
        if (!document.querySelector(`link[href*="generateblocks-complete.min.css"]`)) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = generateBlocksCSS;
          document.head.appendChild(link);
        }
      }
    } catch (error) {
      console.error('Error fetching CSS URLs:', error);
    }
  };

  // Fallback content block renderer for client-side rendering
  const renderContentBlocksFallback = (blocks: ContentBlock[]): string => {
    if (!blocks || blocks.length === 0) return '';
    
    const sortedBlocks = blocks.sort((a, b) => a.block_order - b.block_order);
    
    return sortedBlocks.map(block => {
      try {
        const content = typeof block.content === 'string' 
          ? JSON.parse(block.content) 
          : block.content;

        switch (block.block_type) {
          case 'heading':
            const level = Math.max(1, Math.min(6, content.level || 2));
            return `<h${level} class="content-heading">${escapeHtml(content.text)}</h${level}>`;
            
          case 'paragraph':
            return `<p class="content-paragraph">${processTextFormatting(content.text)}</p>`;
            
          case 'image':
            const alt = escapeHtml(content.alt || '');
            const caption = content.caption ? `<figcaption class="image-caption">${escapeHtml(content.caption)}</figcaption>` : '';
            return `<figure class="content-image"><img src="${content.url}" alt="${alt}" loading="lazy" class="responsive-image" />${caption}</figure>`;
            
          case 'accent_tip':
            const tipType = content.type || 'tip';
            const icon = getTipIcon(tipType);
            return `<aside class="accent-tip accent-tip--${tipType}"><div class="accent-tip__icon">${icon}</div><div class="accent-tip__content">${processTextFormatting(content.text)}</div></aside>`;
            
          case 'quote':
            const citation = content.citation ? `<cite class="quote-citation">— ${escapeHtml(content.citation)}</cite>` : '';
            return `<blockquote class="content-quote"><p class="quote-text">${processTextFormatting(content.text)}</p>${citation}</blockquote>`;
            
          case 'cta':
            const target = content.external ? ' target="_blank" rel="noopener noreferrer"' : '';
            return `<div class="content-cta" style="text-align: center"><a href="${escapeHtml(content.url)}" class="cta-button cta-button--primary"${target}>${escapeHtml(content.text)}</a></div>`;
            
          case 'divider':
            return `<hr class="content-divider" />`;
            
          case 'list':
            const listType = content.ordered ? 'ol' : 'ul';
            const items = content.items.map((item: string) => `<li>${processTextFormatting(item)}</li>`).join('');
            return `<${listType} class="content-list">${items}</${listType}>`;
            
          default:
            return `<!-- Unknown block type: ${block.block_type} -->`;
        }
      } catch (error) {
        console.error(`Error rendering block ${block.id}:`, error);
        return `<!-- Error rendering block ${block.id} -->`;
      }
    }).join('\n');
  };

  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const processTextFormatting = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  };

  const getTipIcon = (type: string): string => {
    const icons = {
      tip: '💡',
      warning: '⚠️',
      info: 'ℹ️',
      success: '✅'
    };
    return icons[type] || icons.tip;
  };

  if (loading) {
    return (
      <div className="blog-loading">
        <div className="loading-spinner"></div>
        <p>Loading article...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="blog-error">
        <h1>Article Not Found</h1>
        <p>{error || 'The cruise guide you\'re looking for could not be found.'}</p>
        <a href="/" className="retry-button">← Back to Homepage</a>
      </div>
    );
  }

  const categoryDisplayName = post.category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const publishedDate = new Date(post.published_date || post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Update page title and meta description
  useEffect(() => {
    if (post) {
      document.title = `${post.title} | Cruise Made Easy`;
      
      // Update meta description
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', post.meta_description || post.excerpt || '');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = post.meta_description || post.excerpt || '';
        document.head.appendChild(meta);
      }
    }
  }, [post]);

  return (
    <div className="home blog wp-embed-responsive generatepress hfeed no-sidebar">
      {/* Real WordPress header */}
      <div className="header-wrap">
        <a className="screen-reader-text skip-link" href="#content" title="Skip to content">
          Skip to content
        </a>
        <div className="gb-element-6d98b3bd hide-on-mobile">
          <div className="gb-element-a31c4cb5">
            <div className="gb-element-0db34a8b">
              <div className="gb-element-047d3b1f">
                <figure className="wp-block-image size-full">
                  <a href="/">
                    <img 
                      alt="Cruise Made Easy" 
                      decoding="async" 
                      width="132" 
                      height="54" 
                      sizes="(max-width: 132px) 100vw, 132px" 
                      src="https://cruisemadeeasy.com/wp-content/uploads/2025/02/Small-Wrods-White-over-no-color-126x85-1.png" 
                      className="wp-image-5901"
                    />
                  </a>
                </figure>
              </div>

              <div className="gb-element-7653835a">
                <a className="gb-text gb-text-fe08e03c" href="/which-cruiser-are-you">
                  🧭 <strong>Cruise Match Quiz</strong>
                </a>

                <a className="gb-text gb-text-c882862d" href="https://cruisemadeeasy.com/cruise-planning-services/">
                  <strong>🧳 Plan My Cruise</strong>
                </a>

                <a className="gb-text gb-text-8e5e6e91" href="/cruise-planning/">
                  🧠 <strong>Tips &amp; Guides</strong>
                </a>

                <a className="gb-text gb-text-bcd02962" href="https://connect.cruisemadeeasy.com/widget/bookings/talk_travel" target="_blank" rel="noopener nofollow">
                  <strong>Start the Conversation</strong>
                </a>

                <p className="gb-text-bd574af4">
                  <span className="gb-shape">
                    <svg viewBox="0 0 16 16" className="bi bi-phone" fill="currentColor" height="16" width="16">
                      <path d="M11 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h6zM5 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H5z"></path>
                      <path d="M8 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"></path>
                    </svg>
                  </span>
                  <span className="gb-text">
                    <a href="tel:+13163750200" data-type="tel">Call / text (316) 375-0200</a>
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="site grid-container container hfeed" id="page">
        <div className="site-content" id="content">
          <div className="content-area" id="primary">
            <main className="site-main" id="main">
              <article className="post-content" itemScope itemType="http://schema.org/BlogPosting">
                <header className="post-header">
                  <nav aria-label="Breadcrumb">
                    <ol className="breadcrumb" style={{ display: 'flex', listStyle: 'none', padding: 0, margin: '1rem 0' }}>
                      <li><a href="/" style={{ textDecoration: 'none', color: '#0073aa' }}>Home</a></li>
                      <li style={{ margin: '0 0.5rem', color: '#666' }}>›</li>
                      <li><a href={`/category/${post.category}/`} style={{ textDecoration: 'none', color: '#0073aa' }}>{categoryDisplayName}</a></li>
                      <li style={{ margin: '0 0.5rem', color: '#666' }}>›</li>
                      <li aria-current="page" style={{ color: '#666' }}>{post.title}</li>
                    </ol>
                  </nav>
                  
                  <h1 itemProp="headline" style={{ 
                    fontSize: '2.5rem', 
                    lineHeight: '1.2', 
                    margin: '1rem 0 1.5rem 0',
                    color: '#1a1a1a'
                  }}>
                    {post.title}
                  </h1>
                  
                  <div className="post-meta" style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    alignItems: 'center',
                    fontSize: '0.9rem',
                    color: '#666',
                    borderBottom: '1px solid #eee',
                    paddingBottom: '1rem',
                    marginBottom: '2rem'
                  }}>
                    <time dateTime={post.published_date || post.created_at} itemProp="datePublished">
                      {publishedDate}
                    </time>
                    {post.author_name && (
                      <span className="post-author" itemProp="author" itemScope itemType="http://schema.org/Person">
                        By <span itemProp="name">{post.author_name}</span>
                      </span>
                    )}
                    <span className="post-category">
                      <a href={`/category/${post.category}/`} style={{ textDecoration: 'none', color: '#0073aa' }}>
                        {categoryDisplayName}
                      </a>
                    </span>
                  </div>
                </header>
                
                <main id="main-content" role="main" className="post-body" itemProp="articleBody">
                  {/* RAW DATA ANALYSIS SECTION */}
                  <div style={{
                    backgroundColor: '#f0f8ff',
                    border: '2px solid #0073aa',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    margin: '2rem 0',
                    maxWidth: '1000px'
                  }}>
                    <h2 style={{ color: '#0073aa', marginTop: 0 }}>🔍 RAW POST DATA ANALYSIS</h2>
                    <p style={{ marginBottom: '1rem', color: '#666' }}>
                      <strong>Route:</strong> /{category}/{slug}
                    </p>
                    
                    <div style={{
                      backgroundColor: '#fff',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      padding: '1rem',
                      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                      fontSize: '12px',
                      overflow: 'auto',
                      maxHeight: '400px',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {JSON.stringify(post, null, 2)}
                    </div>
                    
                    <div style={{ 
                      marginTop: '1rem', 
                      padding: '1rem', 
                      backgroundColor: '#e8f5e8', 
                      borderRadius: '4px',
                      border: '1px solid #4caf50'
                    }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#2e7d32' }}>📊 Analysis Summary:</h4>
                      <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                        <li><strong>Post ID:</strong> {post.id}</li>
                        <li><strong>Category:</strong> {post.category}</li>
                        <li><strong>Slug:</strong> {post.slug}</li>
                        <li><strong>Status:</strong> {post.status}</li>
                        <li><strong>Post Type:</strong> {post.post_type || 'N/A'}</li>
                        <li><strong>Persona:</strong> {post.persona || 'N/A'}</li>
                        <li><strong>Content Blocks:</strong> {post.content_blocks ? `${post.content_blocks.length} blocks` : 'No content blocks'}</li>
                        <li><strong>Featured Image:</strong> {post.featured_image_url ? 'Yes' : 'No'}</li>
                        <li><strong>Published Date:</strong> {post.published_date || 'Not set'}</li>
                      </ul>
                    </div>
                  </div>

                  {/* RENDERED CONTENT */}
                  <div style={{
                    borderTop: '3px solid #ff6b35',
                    paddingTop: '2rem',
                    marginTop: '2rem'
                  }}>
                    <h2 style={{ color: '#ff6b35', marginBottom: '1rem' }}>📝 RENDERED CONTENT</h2>
                    <div 
                      dangerouslySetInnerHTML={{ __html: contentHtml }}
                      style={{ 
                        lineHeight: '1.8',
                        fontSize: '1.1rem',
                        maxWidth: '800px',
                        margin: '0 auto'
                      }}
                    />
                  </div>
                </main>
              </article>
            </main>
          </div>
        </div>

        {/* Footer */}
        <div className="site-footer">
          <div className="gb-element-8850b7bc alignwide">
            <div>
              <div className="gb-element-c56a38e3"></div>

              <div>
                <div className="gb-element-299e3421">
                  <div className="gb-element-99528bfa">
                    <div className="gb-element-e458cc94">
                      <div className="wp-block-image">
                        <figure className="aligncenter size-full is-resized">
                          <img 
                            alt="" 
                            loading="lazy" 
                            decoding="async" 
                            width="1221" 
                            height="1112" 
                            sizes="auto, (max-width: 1221px) 100vw, 1221px" 
                            src="https://cruisemadeeasy.com/wp-content/uploads/2025/07/white-svg-vertical.svg" 
                            className="wp-image-7512" 
                            style={{objectFit: 'cover', width: '132px', height: '107px'}}
                          />
                        </figure>
                      </div>

                      <p className="has-text-align-center" style={{fontSize: '16px'}}>
                        <strong>Helping You Cruise Smarter,<br/>One Trip at a Time</strong>
                      </p>
                    </div>
                  </div>

                  <div className="gb-element-02d88715">
                    <h4 className="gb-text gb-text-1e906952">Legal</h4>

                    <nav className="is-vertical wp-block-navigation is-layout-flex">
                      <ul className="wp-block-navigation__container is-vertical wp-block-navigation">
                        <li className="wp-block-navigation-item wp-block-navigation-link">
                          <a className="wp-block-navigation-item__content" href="https://cruisemadeeasy.com/client-agreement-summary/">
                            <span className="wp-block-navigation-item__label">Summary of Terms</span>
                          </a>
                        </li>
                        <li className="wp-block-navigation-item wp-block-navigation-link">
                          <a className="wp-block-navigation-item__content" href="https://cruisemadeeasy.com/detailed-tracvel-tc/">
                            <span className="wp-block-navigation-item__label">Full Terms &amp; Conditions</span>
                          </a>
                        </li>
                        <li className="wp-block-navigation-item wp-block-navigation-link">
                          <a className="wp-block-navigation-item__content" href="https://cruisemadeeasy.com/privacy-policy/">
                            <span className="wp-block-navigation-item__label">Privacy Policy</span>
                          </a>
                        </li>
                      </ul>
                    </nav>
                  </div>

                  <div className="gb-element-73c7971f">
                    <h4 className="gb-text gb-text-1e906952">Connect</h4>

                    <nav className="is-vertical wp-block-navigation is-layout-flex">
                      <ul className="wp-block-navigation__container is-vertical wp-block-navigation">
                        <li className="wp-block-navigation-item wp-block-navigation-link">
                          <a className="wp-block-navigation-item__content" href="https://cruisemadeeasy.com/contact/">
                            <span className="wp-block-navigation-item__label">Contact Us</span>
                          </a>
                        </li>
                        <li className="wp-block-navigation-item wp-block-navigation-link">
                          <a className="wp-block-navigation-item__content" href="https://www.facebook.com/CruiseMadeEasy/">
                            <span className="wp-block-navigation-item__label">Facebook</span>
                          </a>
                        </li>
                        <li className="wp-block-navigation-item wp-block-navigation-link">
                          <a className="wp-block-navigation-item__content" href="https://cruisemadeeasy.com/about-scott/">
                            <span className="wp-block-navigation-item__label">About Scott</span>
                          </a>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>

                <div className="wp-block-spacer" style={{height: '30px'}}></div>

                <p className="has-text-align-center">
                  © 2024 Cruise Made EASY • <a href="https://cruisemadeeasy.com/privacy-policy/">Privacy Policy</a>
                </p>
              </div>
            </div>

            <footer className="site-info">
              <div className="inside-site-info grid-container"></div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostPage;