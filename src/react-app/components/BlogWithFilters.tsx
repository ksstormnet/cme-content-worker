import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

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

interface BlogWithFiltersProps {
  category?: string;
}

// Dynamic blog content with category filters - designed to work within page-frame template
const BlogWithFilters: React.FC<BlogWithFiltersProps> = ({ category }) => {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(20);
  const [totalLoaded, setTotalLoaded] = useState(0);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  
  // Defensive React Router hook usage with error boundary
  let navigate;
  let routerError = false;
  
  try {
    navigate = useNavigate();
  } catch (error) {
    console.warn('React Router context not available:', error);
    routerError = true;
  }
  
  // Determine current filter from props or URL
  const currentFilter = category || 'all';
  
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

  // Apply uniform card height after posts are displayed
  useEffect(() => {
    if (displayPosts.length > 0 && !loading) {
      // Wait for DOM to update, then measure and apply uniform height
      const timer = setTimeout(() => {
        const cardElements = document.querySelectorAll('.gb-element-947acc35');
        
        if (cardElements.length > 0) {
          // Measure natural heights
          const heights = Array.from(cardElements).map((el) => {
            return (el as HTMLElement).offsetHeight;
          });
          
          const maxHeight = Math.max(...heights);
          
          // Apply uniform height via CSS
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
            
            .category-pills-container {
              background-color: #e5e7eb;
              margin: 20px -30px;
              position: relative;
              z-index: 10;
              padding: 12px 30px;
              border-top: 1px solid var(--accent-2);
              border-bottom: 1px solid var(--accent-2);
            }
            
            .category-pill {
              background: white;
              border: 2px solid #d1d5db;
              color: #374151;
              padding: 8px 16px;
              margin: 0 8px 8px 0;
              border-radius: 20px;
              font-weight: 600;
              font-size: 14px;
              cursor: pointer;
              transition: all 0.2s ease;
              display: inline-block;
            }
            
            .category-pill:hover {
              border-color: #6b7280;
              background: #f9fafb;
            }
            
            .category-pill-active {
              background: #ff6b35 !important;
              border-color: #ff6b35 !important;
              color: white !important;
            }
            
            .more-dropdown {
              position: relative;
              display: inline-block;
            }
            
            .more-dropdown-content {
              position: absolute;
              top: 100%;
              left: 0;
              background: white;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              z-index: 1000;
              min-width: 200px;
              max-height: 300px;
              overflow-y: auto;
            }
            
            .dropdown-item {
              display: block;
              width: 100%;
              padding: 12px 16px;
              text-align: left;
              border: none;
              background: none;
              font-size: 14px;
              cursor: pointer;
              transition: background-color 0.2s ease;
            }
            
            .dropdown-item:hover {
              background: #f3f4f6;
            }
            
            .dropdown-item.active {
              background: #ff6b35;
              color: white;
            }
            
            .post-count {
              color: #6b7280;
              font-weight: normal;
              margin-left: 4px;
            }
            
            .dropdown-item.active .post-count {
              color: rgba(255, 255, 255, 0.8);
            }
          `;
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [displayPosts, loading, currentFilter]);
  
  // Load initial data
  const initializeData = async () => {
    try {
      setLoading(true);
      
      // Load initial batch in parallel
      const [postsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/posts?status=published&limit=20&offset=0'),
        fetch('/api/categories')
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
  
  // Handle category filter change (client-side routing)
  const handleCategoryChange = (slug: string) => {
    // Only use navigation if Router context is available
    if (!routerError && navigate) {
      if (slug === 'all') {
        navigate('/', { replace: true });
      } else {
        navigate(`/category/${slug}`, { replace: true });
      }
    } else {
      // Fallback to page reload if Router not available
      const newUrl = slug === 'all' ? '/' : `/category/${slug}`;
      window.location.href = newUrl;
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
  
  // Generate post card with WordPress-compatible styling
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
          <div className="gb-element-ca29c3cc">
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
                className={`category-pill ${currentFilter === 'all' ? 'category-pill-active' : ''}`}
              >
                ALL
              </button>
            );
          }
          
          if (item.slug === 'more') {
            return (
              <div key="more" className="more-dropdown">
                <button 
                  className="category-pill more-button"
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
              className={`category-pill ${isActive ? 'category-pill-active' : ''}`}
            >
              {category.name.toUpperCase()}
            </button>
          );
        })}
      </div>
    );
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="blog-loading" style={{textAlign: 'center', padding: '2rem'}}>
        <div className="loading-spinner"></div>
        <p>Loading cruise guides...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="blog-error" style={{textAlign: 'center', padding: '2rem'}}>
        <h2>Unable to load blog content</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="button">
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="blog-with-filters-content">
      {/* Category filter pills */}
      {categories.length > 0 && generateCategoryPills()}
      
      {/* Loading indicator for background loading */}
      {backgroundLoading && (
        <div style={{textAlign: 'center', padding: '10px', fontSize: '14px', color: '#666'}}>
          <span>🔄 Loading more posts in background...</span>
        </div>
      )}

      {/* Main content grid */}
      <div className="gb-element-299e3421">
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
    </div>
  );
};

export default BlogWithFilters;