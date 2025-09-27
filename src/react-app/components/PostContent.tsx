import React, { useState, useEffect } from 'react';

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

interface PostContentProps {
  category: string;
  slug: string;
}

// Content-only post component (no header, footer, or SEO)
// Template system provides the page structure
const PostContent: React.FC<PostContentProps> = ({ category, slug }) => {
  const [post, setPost] = useState<Post | null>(null);
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

  // Render content blocks
  const renderContentBlocks = (blocks: ContentBlock[]): React.ReactElement[] => {
    if (!blocks || blocks.length === 0) {
      return [
        <div key="no-content" className="post-content">
          <p>No content available for this post.</p>
        </div>
      ];
    }

    return blocks
      .sort((a, b) => a.block_order - b.block_order)
      .map(block => renderContentBlock(block));
  };

  // Render individual content block
  const renderContentBlock = (block: ContentBlock): React.ReactElement => {
    const key = `block-${block.id}`;
    
    try {
      const content = typeof block.content === 'string' 
        ? JSON.parse(block.content) 
        : block.content;

      switch (block.block_type) {
        case 'heading':
          const headingLevel = content.level || 2;
          const HeadingTag = `h${Math.min(6, Math.max(1, headingLevel))}` as keyof JSX.IntrinsicElements;
          return (
            <HeadingTag key={key} className={`heading-block heading-${headingLevel}`}>
              {content.text || content.content || ''}
            </HeadingTag>
          );

        case 'paragraph':
          return (
            <div key={key} className="paragraph-block">
              <p dangerouslySetInnerHTML={{ 
                __html: content.text || content.content || '' 
              }} />
            </div>
          );

        case 'image':
          return (
            <div key={key} className="image-block">
              <figure>
                <img 
                  src={content.url || content.src || ''} 
                  alt={content.alt_text || content.alt || content.caption || ''} 
                  loading="lazy"
                />
                {(content.caption || content.alt_text) && (
                  <figcaption>{content.caption || content.alt_text}</figcaption>
                )}
              </figure>
            </div>
          );

        case 'accent_tip':
          return (
            <div key={key} className="accent-tip-block">
              <div className="accent-tip">
                {content.icon && <span className="accent-icon">{content.icon}</span>}
                <div className="accent-content">
                  {content.title && <h4>{content.title}</h4>}
                  <p dangerouslySetInnerHTML={{ 
                    __html: content.text || content.content || '' 
                  }} />
                </div>
              </div>
            </div>
          );

        case 'quote':
          return (
            <div key={key} className="quote-block">
              <blockquote>
                <p dangerouslySetInnerHTML={{ 
                  __html: content.text || content.quote || content.content || '' 
                }} />
                {content.attribution && (
                  <cite>— {content.attribution}</cite>
                )}
              </blockquote>
            </div>
          );

        case 'cta':
          return (
            <div key={key} className="cta-block">
              <div className="call-to-action">
                {content.title && <h3>{content.title}</h3>}
                {content.text && <p>{content.text}</p>}
                {content.button_text && content.button_url && (
                  <a 
                    href={content.button_url} 
                    className="cta-button"
                    target={content.open_new_tab ? '_blank' : '_self'}
                    rel={content.open_new_tab ? 'noopener noreferrer' : undefined}
                  >
                    {content.button_text}
                  </a>
                )}
              </div>
            </div>
          );

        case 'divider':
          return (
            <div key={key} className="divider-block">
              <hr className={`divider ${content.style || 'default'}`} />
            </div>
          );

        case 'list':
          const ListTag = content.type === 'ordered' ? 'ol' : 'ul';
          return (
            <div key={key} className="list-block">
              <ListTag>
                {(content.items || []).map((item: string, index: number) => (
                  <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
                ))}
              </ListTag>
            </div>
          );

        case 'table':
          return (
            <div key={key} className="table-block">
              <table>
                {content.headers && (
                  <thead>
                    <tr>
                      {content.headers.map((header: string, index: number) => (
                        <th key={index}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {(content.rows || []).map((row: string[], rowIndex: number) => (
                    <tr key={rowIndex}>
                      {row.map((cell: string, cellIndex: number) => (
                        <td key={cellIndex} dangerouslySetInnerHTML={{ __html: cell }} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );

        default:
          // Fallback for unknown block types
          return (
            <div key={key} className={`unknown-block block-type-${block.block_type}`}>
              <div className="block-content">
                {typeof content === 'string' ? (
                  <p dangerouslySetInnerHTML={{ __html: content }} />
                ) : (
                  <pre>{JSON.stringify(content, null, 2)}</pre>
                )}
              </div>
            </div>
          );
      }
    } catch (error) {
      console.error('Error rendering content block:', error, block);
      return (
        <div key={key} className="error-block">
          <p>Error rendering content block</p>
        </div>
      );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="post-loading">
        <div className="loading-spinner"></div>
        <p>Loading article...</p>
      </div>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <div className="post-error">
        <h2>Article Not Found</h2>
        <p>{error || 'The cruise guide you\'re looking for could not be found.'}</p>
        <a href="/" className="retry-button">← Back to Homepage</a>
      </div>
    );
  }

  // Content-only rendering (no header, footer, or page structure)
  return (
    <div className="post-content-area">
      {/* Article metadata */}
      <div className="post-meta">
        <div className="post-category">
          <a href={`/category/${post.category}/`}>
            {post.category?.split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ') || 'General'}
          </a>
        </div>
        <time className="post-date" dateTime={post.published_date}>
          {new Date(post.published_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </time>
      </div>

      {/* Featured image */}
      {post.featured_image_url && (
        <div className="featured-image">
          <img 
            src={post.featured_image_url} 
            alt={post.title}
            loading="lazy"
          />
        </div>
      )}

      {/* Article content */}
      <article className="post-content">
        {post.content_blocks && post.content_blocks.length > 0 ? (
          renderContentBlocks(post.content_blocks)
        ) : (
          <div className="no-content">
            <p>This article is being updated. Check back soon for the full content!</p>
          </div>
        )}
      </article>

      {/* Author information */}
      <div className="post-author">
        <p>By {post.author_name || 'Cruise Made EASY'}</p>
      </div>
    </div>
  );
};

export default PostContent;