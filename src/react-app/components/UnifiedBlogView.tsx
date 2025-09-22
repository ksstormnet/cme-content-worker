import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

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
  priority?: number | null;
}

const UnifiedBlogView: React.FC = () => {
  // State management
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(20);
  const [totalLoaded, setTotalLoaded] = useState(0);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [uniformHeight, setUniformHeight] = useState<number | null>(null);
  
  // Routing
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine current filter from URL
  const currentFilter = categorySlug || 'all';
  
  // Filter posts based on current category
  const filteredPosts = useMemo(() => {
    if (currentFilter === 'all') {
      return allPosts;
    }
    return allPosts.filter(post => post.category === currentFilter);
  }, [allPosts, currentFilter]);
  
  // Posts to display (with limit for performance)
  const displayPosts = filteredPosts.slice(0, displayLimit);
  
  // Get current category info
  const currentCategory = categories.find(cat => cat.slug === currentFilter);
  
  useEffect(() => {
    initializeData();
    
    // Clean up any existing uniform height CSS overrides
    const existingStyleElement = document.getElementById('uniform-card-styles');
    if (existingStyleElement) {
      existingStyleElement.remove();
    }
    
    // Reset any inline height styles that might be lingering
    const cardElements = document.querySelectorAll('.gb-element-947acc35');
    cardElements.forEach(el => {
      const element = el as HTMLElement;
      element.style.height = '';
      element.style.minHeight = '';
      element.style.maxHeight = '';
    });
    
    // Remove CSS custom property
    document.documentElement.style.removeProperty('--uniform-card-height');
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showMoreDropdown && !target.closest('.more-dropdown')) {
        setShowMoreDropdown(false);
      }
    };
    
    if (showMoreDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMoreDropdown]);

  // Calculate uniform height after posts are displayed (logging only - no CSS applied)
  useEffect(() => {
    if (displayPosts.length > 0 && !loading) {
      // Wait for DOM to update, then measure
      const timer = setTimeout(() => {
        const cardElements = document.querySelectorAll('.gb-element-947acc35');
        console.log('🔍 Found card elements:', cardElements.length);
        
        if (cardElements.length > 0) {
          // Measure natural heights without modifying anything
          const heights = Array.from(cardElements).map((el, index) => {
            const height = (el as HTMLElement).offsetHeight;
            console.log(`📏 Card ${index + 1} natural height:`, height + 'px');
            return height;
          });
          
          const maxHeight = Math.max(...heights);
          const minHeight = Math.min(...heights);
          const avgHeight = heights.reduce((sum, h) => sum + h, 0) / heights.length;
          
          console.log('📊 Height Analysis:');
          console.log('   • Tallest card:', maxHeight + 'px');
          console.log('   • Shortest card:', minHeight + 'px'); 
          console.log('   • Average height:', Math.round(avgHeight) + 'px');
          console.log('   • Height difference:', (maxHeight - minHeight) + 'px');
          
          setUniformHeight(maxHeight);
          
          // Apply uniform height to card containers only
          console.log('✨ Applying uniform height:', maxHeight + 'px');
          
          // Add CSS to set uniform height for card containers
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
            }
            
            /* Custom hero styles to replace .gb-* classes */
            .custom-hero-outer {
              background: linear-gradient(to left, rgba(12,29,61,0.62) 0%, rgba(12,29,61,0.62) 100%), 
                          url(https://cruisemadeeasy.com/wp-content/uploads/2025/03/ncl_Dawn_Wake-scaled.jpeg) 53% 39% / cover no-repeat;
              color: #ffffff;
              overflow: hidden;
              position: relative;
              padding: 90px;
              margin-top: 80px;
            }
            
            .custom-hero-inner {
              max-width: 1200px;
              margin: 0 auto;
              position: relative;
              z-index: 1;
              padding: 0;
            }
            
            .custom-hero-heading {
              font-size: 2.5rem;
              font-weight: 700;
              color: #ffffff;
              text-align: center;
              line-height: 1.2;
              border-bottom: 2px solid #ff6b35;
              padding-bottom: 15px;
              display: inline-block;
              margin: 0 auto;
              width: 100%;
            }
            
            .category-pills-container {
              background-color: var(--base-1);
              margin-top: 0 !important;
              margin-left: -30px !important;
              margin-right: -30px !important;
              position: relative;
              z-index: 10;
              padding: 2px 30px;
              width: calc(100% + 60px);
            }
          `;
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [displayPosts, loading, currentFilter]); // Re-run when filter changes too
  
  // Load initial data (first 20 posts + categories + CSS)
  const initializeData = async () => {
    try {
      setLoading(true);
      
      // Load initial batch in parallel
      const [postsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/posts?status=published&limit=20&offset=0'),
        fetch('/api/categories'),
        loadCSSFiles() // Non-blocking CSS load
      ]);
      
      // Process posts
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        if (postsData.success) {
          setAllPosts(postsData.data);
          setTotalLoaded(postsData.data.length);
        }
      }
      
      // Process categories
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        if (categoriesData.success) {
          setCategories(categoriesData.data);
        }
      }
      
      setLoading(false);
      
      // Start background loading of remaining posts
      backgroundLoadMorePosts();
      
    } catch (error) {
      console.error('Error initializing data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      setLoading(false);
    }
  };
  
  // Background load additional posts
  const backgroundLoadMorePosts = async () => {
    try {
      setBackgroundLoading(true);
      
      // Load posts in batches of 50, up to 200 total
      const batchSize = 50;
      const maxPosts = 200;
      let currentOffset = 20; // Start after initial 20
      
      while (currentOffset < maxPosts) {
        const response = await fetch(`/api/posts?status=published&limit=${batchSize}&offset=${currentOffset}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.length > 0) {
            setAllPosts(prev => [...prev, ...data.data]);
            setTotalLoaded(prev => prev + data.data.length);
            currentOffset += batchSize;
            
            // Small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 100));
          } else {
            break; // No more posts
          }
        } else {
          break;
        }
      }
    } catch (error) {
      console.error('Background loading error:', error);
    } finally {
      setBackgroundLoading(false);
    }
  };
  
  // Load CSS files
  const loadCSSFiles = async () => {
    try {
      const response = await fetch('/api/css/homepage');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const urls = data.css_files
            .map((file: any) => file.cdn_url || file.source_url)
            .filter(Boolean);
          
          // Inject CSS into document head
          urls.forEach((url: string) => {
            if (!document.querySelector(`link[href="${url}"]`)) {
              const link = document.createElement('link');
              link.rel = 'stylesheet';
              link.href = url;
              document.head.appendChild(link);
            }
          });
          
          // Add GenerateBlocks CSS
          const timestamp = Date.now();
          const cssFiles = [
            `https://cdn.cruisemadeeasy.com/css/generateblocks-complete.min.css?v=${timestamp}`,
            `https://cdn.cruisemadeeasy.com/css/generateblocks-style-3575.css?v=${timestamp}`
          ];
          
          cssFiles.forEach((url: string) => {
            const selector = url.includes('generateblocks-complete') 
              ? 'link[href*="generateblocks-complete.min.css"]'
              : 'link[href*="generateblocks-style-3575.css"]';
            
            if (!document.querySelector(selector)) {
              const link = document.createElement('link');
              link.rel = 'stylesheet';
              link.href = url;
              document.head.appendChild(link);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error loading CSS:', error);
    }
  };
  
  // Handle category filter change (client-side routing)
  const handleCategoryChange = (slug: string) => {
    if (slug === 'all') {
      navigate('/', { replace: true });
    } else {
      navigate(`/category/${slug}`, { replace: true });
    }
    
    // Reset display limit when changing filters
    setDisplayLimit(20);
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Show more posts (increase display limit)
  const showMorePosts = () => {
    setDisplayLimit(prev => prev + 20);
  };
  
  // Generate post card (same styling as original)
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
        <div className="gb-element-947acc35" style={{backgroundImage: `url(${post.featured_image_url || ''})`}}>
          <div 
            className="gb-element-ca29c3cc"
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
  
  // Generate smart priority-based category pills
  const generateCategoryPills = (): React.ReactElement => {
    // Separate categories by priority (1-4 are priority, null/undefined are non-priority)
    const priorityCategories = categories
      .filter(cat => cat.priority && cat.priority >= 1 && cat.priority <= 4)
      .sort((a, b) => (a.priority || 99) - (b.priority || 99));
    
    const nonPriorityCategories = categories
      .filter(cat => !cat.priority || cat.priority < 1 || cat.priority > 4);
    
    // Find if current selection is non-priority
    const currentSelectedCategory = categories.find(cat => cat.slug === currentFilter);
    const isNonPrioritySelected = currentSelectedCategory && 
      (!currentSelectedCategory.priority || currentSelectedCategory.priority < 1 || currentSelectedCategory.priority > 4);
    
    // Build display buttons: [ALL] + [Priority 1-4 OR Selected if non-priority] + [MORE]
    const displayButtons: (Category | { slug: 'all'; name: 'ALL' } | { slug: 'more'; name: 'MORE' })[] = [
      { slug: 'all', name: 'ALL' }
    ];
    
    if (isNonPrioritySelected && currentSelectedCategory) {
      // Show first 3 priority categories + selected non-priority category (replaces 4th priority)
      displayButtons.push(...priorityCategories.slice(0, 3));
      displayButtons.push(currentSelectedCategory);
    } else {
      // Show all 4 priority categories
      displayButtons.push(...priorityCategories.slice(0, 4));
    }
    
    // Add MORE button if there are remaining categories
    const remainingCategories = isNonPrioritySelected 
      ? [...priorityCategories.slice(3), ...nonPriorityCategories.filter(cat => cat.slug !== currentFilter)]
      : nonPriorityCategories;
    
    if (remainingCategories.length > 0) {
      displayButtons.push({ slug: 'more', name: 'MORE' });
    }
    
    return (
      <div className="category-pills-container">
        {displayButtons.map((item, index) => {
          if (item.slug === 'all') {
            return (
              <button 
                key="all"
                onClick={() => handleCategoryChange('all')}
                className={`category-pill compact ${currentFilter === 'all' ? 'category-pill-active' : ''}`}
              >
                ALL
              </button>
            );
          }
          
          if (item.slug === 'more') {
            return (
              <div key="more" className="more-dropdown">
                <button 
                  className="category-pill compact more-button"
                  onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                >
                  MORE ▼
                </button>
                {showMoreDropdown && (
                  <div className="more-dropdown-content">
                    {remainingCategories.map(category => (
                      <button
                        key={category.slug}
                        onClick={() => {
                          handleCategoryChange(category.slug);
                          setShowMoreDropdown(false);
                        }}
                        className={`dropdown-item ${currentFilter === category.slug ? 'active' : ''}`}
                      >
                        {category.name.toUpperCase()}
                        <span className="post-count">({category.post_count})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          
          // Regular category button
          const category = item as Category;
          const isActive = currentFilter === category.slug;
          return (
            <button 
              key={category.slug}
              onClick={() => handleCategoryChange(category.slug)}
              className={`category-pill compact ${isActive ? 'category-pill-active' : ''}`}
            >
              {category.name.toUpperCase()}
            </button>
          );
        })}
      </div>
    );
  };
  
  // Generate hero text based on current filter
  const getHeroText = () => {
    if (currentFilter === 'all') {
      return 'Cruise Smarter with Norwegian: Tips, Tricks & Planning Guides';
    }
    
    const categoryDisplayName = currentCategory?.name || 
      currentFilter?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 
      'Category';
      
    return `CRUISE MADE EASY: ${categoryDisplayName.toUpperCase()}`;
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="blog-loading">
        <div className="loading-spinner"></div>
        <p>Loading Cruise Made Easy blog...</p>
      </div>
    );
  }
  
  // Error state
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
      {/* Header */}
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
      <div className="custom-hero-outer">
        <div className="custom-hero-inner">
          <h1 className="custom-hero-heading">
            {getHeroText()}
          </h1>
        </div>
      </div>

      {/* Category filter buttons */}
      {categories.length > 0 && generateCategoryPills()}
      
      {/* Loading indicator for background loading */}
      {backgroundLoading && (
        <div style={{textAlign: 'center', padding: '10px', fontSize: '14px', color: '#666'}}>
          <span>🔄 Loading more posts in background...</span>
        </div>
      )}

      {/* Main content */}
      <div className="site grid-container container hfeed" id="page">
        <div className="site-content" id="content">
          <div className="content-area" id="primary">
            <main className="site-main" id="main">
              <div className="generate-columns-container">
                {displayPosts.length > 0 ? (
                  displayPosts.map(post => generatePostCard(post))
                ) : (
                  <div className="no-posts" style={{gridColumn: '1 / -1', textAlign: 'center', padding: '3rem'}}>
                    <h2>No posts found {currentFilter !== 'all' ? `in ${currentCategory?.name || currentFilter}` : ''}</h2>
                    <p>Check back soon for new content{currentFilter !== 'all' ? ' in this category' : ''}.</p>
                    {currentFilter !== 'all' && (
                      <button onClick={() => handleCategoryChange('all')} className="button">
                        ← View All Posts
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Show More button */}
              {filteredPosts.length > displayLimit && (
                <div style={{textAlign: 'center', padding: '2rem'}}>
                  <button onClick={showMorePosts} className="button" style={{fontSize: '16px', padding: '12px 24px'}}>
                    Show More Posts ({filteredPosts.length - displayLimit} remaining)
                  </button>
                </div>
              )}
              
              {/* Performance stats (dev info) */}
              {process.env.NODE_ENV === 'development' && (
                <div style={{textAlign: 'center', padding: '1rem', fontSize: '12px', color: '#999', borderTop: '1px solid #eee'}}>
                  Stats: {totalLoaded} posts loaded • {filteredPosts.length} in current filter • {displayPosts.length} displayed
                  {backgroundLoading && ' • Background loading active'}
                </div>
              )}
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

export default UnifiedBlogView;