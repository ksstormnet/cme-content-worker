import React, { useState, useEffect, useMemo } from 'react';

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

interface BlogContentProps {
  category?: string;
}

// Content-only blog listing component (no header, footer, or SEO)
// Template system provides the page structure
const BlogContent: React.FC<BlogContentProps> = ({ category }) => {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(20);
  const [totalLoaded, setTotalLoaded] = useState(0);
  
  // Determine current filter
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
  
  // Show more posts (increase display limit)
  const showMorePosts = () => {
    setDisplayLimit(prev => prev + 20);
  };
  
  // Generate post card (content-only styling)
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
  
  // Loading state
  if (loading) {
    return (
      <div className="blog-loading">
        <div className="loading-spinner"></div>
        <p>Loading cruise guides...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="blog-error">
        <h2>Unable to load blog content</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }
  
  // Content-only rendering (no header, footer, or page structure)
  return (
    <div className="blog-content-area">
      {/* Loading indicator for background loading */}
      {backgroundLoading && (
        <div style={{textAlign: 'center', padding: '10px', fontSize: '14px', color: '#666'}}>
          <span>🔄 Loading more posts in background...</span>
        </div>
      )}

      {/* Main content grid */}
      <div className="generate-columns-container">
        {displayPosts.length > 0 ? (
          displayPosts.map(post => generatePostCard(post))
        ) : (
          <div className="no-posts" style={{gridColumn: '1 / -1', textAlign: 'center', padding: '3rem'}}>
            <h2>No posts found {currentFilter !== 'all' ? `in ${currentCategory?.name || currentFilter}` : ''}</h2>
            <p>Check back soon for new content{currentFilter !== 'all' ? ' in this category' : ''}.</p>
            {currentFilter !== 'all' && (
              <a href="/" className="button">
                ← View All Posts
              </a>
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

export default BlogContent;