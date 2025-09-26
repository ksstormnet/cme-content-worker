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

// Core CSS files to load from R2 CDN
const CORE_CSS_FILES = [
  'wp-block-library.min.css',      // WordPress base styles
  'generatepress-main.min.css',    // Theme framework
  'generateblocks-complete.min.css', // Layout system
  'font-awesome.min.css',          // Icons
  'google-fonts-montserrat.css'    // Typography
];

// Utility function for loading R2 CSS assets
const loadR2CSS = (cssFiles: string[]) => {
  return cssFiles.map(filename => (
    <link 
      key={filename}
      rel="stylesheet" 
      href={`/api/css/css/${filename}`}
    />
  ));
};

const PostPage: React.FC = () => {
  const { category, slug } = useParams<{ category: string; slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [contentHtml, setContentHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Page title and meta are now handled by Helmet in JSX


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
        <h1 style={{
          fontSize: '18px',
          marginBottom: '20px',
          color: '#495057',
          borderBottom: '2px solid #007bff',
          paddingBottom: '10px'
        }}>
          Raw Post Data - {post.title}
        </h1>
        
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '4px',
          padding: '15px',
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {JSON.stringify(post, null, 2)}
        </div>
      </div>
    </div>
  );
};

export default PostPage;