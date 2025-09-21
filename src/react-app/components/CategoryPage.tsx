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
  author_name: string;
  meta_description: string;
}

interface Category {
  slug: string;
  name: string;
  post_count: number;
}

const CategoryPage: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [cssUrls, setCssUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (categorySlug) {
      Promise.all([
        fetchCategoryData(categorySlug),
        fetchCategories(),
        fetchCSSUrls()
      ]).finally(() => setLoading(false));
    }
  }, [categorySlug]);

  const fetchCategoryData = async (slug: string) => {
    try {
      // Fetch posts for this category
      const postsResponse = await fetch(`/api/posts?category=${slug}&status=published&limit=20`);
      if (!postsResponse.ok) throw new Error(`HTTP error! status: ${postsResponse.status}`);
      
      const postsData = await postsResponse.json();
      if (postsData.success) {
        setPosts(postsData.data);
      } else {
        throw new Error(postsData.error || 'Failed to fetch category posts');
      }

      // Fetch category info
      const categoryResponse = await fetch(`/api/categories/${slug}`);
      if (categoryResponse.ok) {
        const categoryData = await categoryResponse.json();
        if (categoryData.success) {
          setCurrentCategory(categoryData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching category data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch category data');
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
      const response = await fetch('/api/css/category');
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

  const generatePostCard = (post: Post): React.ReactElement => {
    const categoryTitle = post.category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    const publishedDate = new Date(post.published_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return (
      <article 
        key={post.id}
        id={`post-${post.id}`}
        className={`dynamic-content-template post-${post.id} post type-post status-publish format-standard has-post-thumbnail hentry category-${post.category} generate-columns tablet-grid-50 mobile-grid-100 grid-parent grid-50 no-featured-image-padding`}
      >
        <div className="gb-element-947acc35" style={{backgroundImage: `url(${post.featured_image_url || ''})`}}>
          <div className="gb-element-ca29c3cc">
            <p className="gb-text gb-text-44279aaa dynamic-term-class">
              <span>{categoryTitle}</span>
            </p>
            
            <h2 className="gb-text gb-text-4c89c85f">
              <a href={`/${post.category}/${post.slug}/`}>{post.title}</a>
            </h2>
            
            <p className="gb-text gb-text-663e6423">{publishedDate}</p>
            
            <a className="gb-text gb-text-674a334b button" href={`/${post.category}/${post.slug}/`}>
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
        {/* ALL pill for category pages */}
        <a href="/" className="category-pill">ALL</a>
        
        {categories.map(category => {
          const displayName = category.name.toUpperCase();
          const isActive = categorySlug === category.slug;
          const pillClass = isActive ? 'category-pill category-pill-active' : 'category-pill';
          return (
            <a 
              key={category.slug}
              href={`/category/${category.slug}/`} 
              className={pillClass}
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
        <p>Loading category content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blog-error">
        <h1>Unable to load category content</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  // Get category display name
  const categoryDisplayName = currentCategory?.name || 
    categorySlug?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 
    'Category';

  const heroText = `CRUISE MADE EASY: ${categoryDisplayName.toUpperCase()}`;

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

      {/* Hero section with category title */}
      <div className="gb-element-ba1def1c" style={{padding: '120px 30px 60px 30px'}}>
        <div className="gb-element-f90eb26c" style={{padding: '80px 30px 40px 30px'}}>
          <h1 className="gb-text gb-text-96e95bfb">{heroText}</h1>
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
                {posts.length > 0 ? (
                  posts.map(post => generatePostCard(post))
                ) : (
                  <div className="no-posts" style={{gridColumn: '1 / -1', textAlign: 'center', padding: '3rem'}}>
                    <h2>No posts found in {categoryDisplayName}</h2>
                    <p>Check back soon for new content in this category.</p>
                    <a href="/" className="button">← Back to Homepage</a>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>

        {/* Footer - Same as homepage */}
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

export default CategoryPage;