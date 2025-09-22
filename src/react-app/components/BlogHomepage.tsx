import React, { useState, useEffect } from 'react';

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  featured_image_url: string;
  published_date: string;
  author_name: string;
  meta_description: string;
}

interface Category {
  slug: string;
  name: string;
  post_count: number;
}

const BlogHomepage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cssUrls, setCssUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uniformHeight, setUniformHeight] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetchBlogData(),
      fetchCategories(),
      fetchCSSUrls()
    ]).finally(() => setLoading(false));
  }, []);

  // Calculate uniform height after posts are rendered
  useEffect(() => {
    if (posts.length > 0 && !loading) {
      // Reset height first to get natural measurements
      setUniformHeight(null);
      
      // Wait for DOM to update, then measure
      const timer = setTimeout(() => {
        const cardElements = document.querySelectorAll('.gb-element-947acc35');
        console.log('Found card elements:', cardElements.length);
        
        if (cardElements.length > 0) {
          // First, reset any height constraints
          cardElements.forEach(el => {
            (el as HTMLElement).style.height = 'auto';
            (el as HTMLElement).style.minHeight = 'auto';
          });
          
          // Measure natural heights
          const heights = Array.from(cardElements).map(el => {
            const height = (el as HTMLElement).offsetHeight;
            console.log('Card element height:', height);
            return height;
          });
          const maxHeight = Math.max(...heights);
          console.log('Setting uniform height to:', maxHeight);
          setUniformHeight(maxHeight);
          
          // Set CSS custom property for uniform height
          document.documentElement.style.setProperty('--uniform-card-height', `${maxHeight}px`);
          
          // Add CSS override styles
          let styleElement = document.getElementById('uniform-card-styles');
          if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'uniform-card-styles';
            document.head.appendChild(styleElement);
          }
          
          styleElement.textContent = `
            .gb-element-947acc35 {
              height: ${maxHeight}px !important;
              min-height: ${maxHeight}px !important;
              max-height: ${maxHeight}px !important;
            }
          `;
        }
      }, 500); // Increased timeout
      
      return () => clearTimeout(timer);
    }
  }, [posts, loading]);

  const fetchBlogData = async () => {
    try {
      const response = await fetch('/api/posts?status=published&limit=20');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (data.success) {
        setPosts(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch posts');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCSSUrls = async () => {
    try {
      const response = await fetch('/api/css/homepage');
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
        
        // Add specific GenerateBlocks style file that contains .gb-text-bd574af4 styles
        const generateBlocksSpecificCSS = `https://cdn.cruisemadeeasy.com/css/generateblocks-style-3575.css?v=${timestamp}`;
        if (!document.querySelector(`link[href*="generateblocks-style-3575.css"]`)) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = generateBlocksSpecificCSS;
          document.head.appendChild(link);
        }
        
      }
    } catch (error) {
      console.error('Error fetching CSS URLs:', error);
    }
  };

  const generatePostCard = (post: Post): React.ReactElement => {
    const categoryTitle = post.category
      ? post.category.split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : 'General';
    
    const publishedDate = new Date(post.published_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return (
      <article 
        key={post.id}
        id={`post-${post.id}`}
        className={`dynamic-content-template post-${post.id} post type-post status-publish format-standard has-post-thumbnail hentry category-${post.category || 'general'} generate-columns tablet-grid-50 mobile-grid-100 grid-parent grid-50 no-featured-image-padding`}
      >
        <div 
          className="gb-element-947acc35" 
          style={{
            backgroundImage: `url(${post.featured_image_url || ''})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            display: 'flex',
            alignItems: 'flex-end',
            height: uniformHeight ? `${uniformHeight}px !important` : 'auto',
            minHeight: uniformHeight ? `${uniformHeight}px !important` : 'auto'
          }}
        >
          <div 
            className="gb-element-ca29c3cc"
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end'
            }}
          >
            <p className="gb-text gb-text-44279aaa dynamic-term-class">
              <span>{categoryTitle}</span>
            </p>
            
            <h2 className="gb-text gb-text-4c89c85f">
              <a href={`/${post.category || 'general'}/${post.slug}/`}>{post.title}</a>
            </h2>
            
            <p className="gb-text gb-text-663e6423">{publishedDate}</p>
            
            <a className="gb-text gb-text-674a334b button" href={`/${post.category || 'general'}/${post.slug}/`}>
              View Article
            </a>
          </div>
        </div>
      </article>
    );
  };

  const generateCategoryPills = (): React.ReactElement => {
    return (
      <div className="category-pills-container">
        {categories.map(category => {
          const displayName = category.name.toUpperCase();
          return (
            <a 
              key={category.slug}
              href={`/category/${category.slug}/`} 
              className="category-pill"
            >
              {displayName}
            </a>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="blog-loading">
        <div className="loading-spinner"></div>
        <p>Loading Cruise Made Easy blog...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blog-error">
        <h1>Unable to load blog content</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

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

      {/* Hero section */}
      <div className="gb-element-ba1def1c" style={{padding: '120px 30px 60px 30px'}}>
        <div className="gb-element-f90eb26c" style={{padding: '80px 30px 40px 30px'}}>
          <h1 className="gb-text gb-text-96e95bfb">
            Cruise Smarter with Norwegian: Tips, Tricks &amp; Planning Guides
          </h1>
          <div style={{width: '100px', height: '4px', backgroundColor: 'var(--accent)', margin: '20px auto 0 auto'}}></div>
        </div>
      </div>

      {/* Category pills */}
      {categories.length > 0 && generateCategoryPills()}

      {/* Main content */}
      <div className="site grid-container container hfeed" id="page">
        <div className="site-content" id="content">
          <div className="content-area" id="primary">
            <main className="site-main" id="main">
              <div className="generate-columns-container">
                {posts.map(post => generatePostCard(post))}
              </div>
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

export default BlogHomepage;