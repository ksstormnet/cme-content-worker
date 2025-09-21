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

const BlogHomepageTest: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      console.log('Fetching posts...');
      const response = await fetch('/api/posts?status=published&limit=5');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setPosts(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  console.log('Component state:', { loading, error, postsCount: posts.length });

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Loading...</h1>
        <p>Fetching blog content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
        <h1>Error Loading Blog</h1>
        <p>{error}</p>
        <button onClick={fetchPosts}>Try Again</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Cruise Made Easy Blog</h1>
      <p>Welcome to our cruise planning blog!</p>
      
      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h2>No Posts Yet</h2>
          <p>No published posts are available at the moment.</p>
        </div>
      ) : (
        <div>
          <h2>Recent Posts ({posts.length})</h2>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {posts.map((post) => (
              <div key={post.id} style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '1.5rem',
                backgroundColor: 'white'
              }}>
                <h3 style={{ marginTop: 0 }}>
                  <a href={`/${post.category}/${post.slug}/`} style={{ textDecoration: 'none', color: '#0066cc' }}>
                    {post.title}
                  </a>
                </h3>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>
                  Category: {post.category} | 
                  Published: {new Date(post.published_date).toLocaleDateString()}
                  {post.author_name && ` | By: ${post.author_name}`}
                </p>
                {post.excerpt && (
                  <p style={{ lineHeight: '1.5' }}>{post.excerpt}</p>
                )}
                <a 
                  href={`/${post.category}/${post.slug}/`}
                  style={{
                    display: 'inline-block',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#0066cc',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    marginTop: '1rem'
                  }}
                >
                  Read More
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>Debug Info</h3>
        <ul>
          <li>Posts fetched: {posts.length}</li>
          <li>Loading state: {loading.toString()}</li>
          <li>Error state: {error || 'none'}</li>
          <li>API endpoint: /api/posts</li>
        </ul>
      </div>
    </div>
  );
};

export default BlogHomepageTest;