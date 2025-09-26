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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jsonCollapsed, setJsonCollapsed] = useState(false);

  useEffect(() => {
    if (category && slug) {
      fetchPostData(category, slug)
        .finally(() => setLoading(false));
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
      } else {
        throw new Error(data.error || 'Failed to fetch post');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch post');
    }
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

  return (
    <div style={{
      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
      fontSize: '14px',
      lineHeight: '1.4',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          cursor: 'pointer',
          borderBottom: '2px solid #007bff',
          paddingBottom: '10px'
        }} onClick={() => setJsonCollapsed(!jsonCollapsed)}>
          <h1 style={{
            fontSize: '18px',
            margin: '0',
            color: '#495057'
          }}>
            Raw Post Data - {post.title}
          </h1>
          <span style={{
            fontSize: '16px',
            color: '#007bff',
            transform: jsonCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}>
            ▼
          </span>
        </div>
        
        {!jsonCollapsed && (
          <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '4px',
            padding: '15px',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '70vh'
          }}>
            {JSON.stringify(post, null, 2)}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostPage;