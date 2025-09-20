import React from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import './PostList.css';

interface Post {
  id: number;
  title: string;
  status: 'draft' | 'approved' | 'scheduled' | 'published';
  post_type: 'monday' | 'wednesday' | 'friday' | 'saturday' | 'newsletter';
  persona?: 'easy_breezy' | 'thrill_seeker' | 'luxe_seafarer';
  created_at: string;
  updated_at: string;
  author_name?: string;
  excerpt?: string;
}

interface PostListProps {
  posts: Post[];
  loading: boolean;
  error: string | null;
  activeTab: string;
  onPostUpdated: (post: Post) => void;
  onPostDeleted: (postId: number) => void;
  onRefresh: () => void;
}

const PostList: React.FC<PostListProps> = ({
  posts,
  loading,
  error,
  activeTab,
  onPostUpdated,
  onPostDeleted,
  onRefresh
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#6b7280';
      case 'approved': return '#10b981';
      case 'scheduled': return '#f59e0b';
      case 'published': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getPostTypeLabel = (postType: string) => {
    switch (postType) {
      case 'monday': return 'Monday - Awareness';
      case 'wednesday': return 'Wednesday - Practical';
      case 'friday': return 'Friday - Aspirational';
      case 'saturday': return 'Saturday - Inspirational';
      case 'newsletter': return 'Sunday - Newsletter';
      default: return postType;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="post-list-loading">
        <LoadingSpinner text="Loading posts..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="post-list-error">
        <p>Error loading posts: {error}</p>
        <button onClick={onRefresh} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="post-list">
      <div className="post-list-header">
        <div className="header-info">
          <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Posts</h2>
          <p className="post-count">{posts.length} posts</p>
        </div>
        <div className="header-actions">
          <button onClick={onRefresh} className="refresh-btn">
            🔄 Refresh
          </button>
          <Link to="/create/generate" className="generate-btn">
            🤖 Generate New Post
          </Link>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No {activeTab} posts yet</h3>
          <p>Get started by generating your first piece of content</p>
          <Link to="/create/generate" className="generate-btn-large">
            Generate Content
          </Link>
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map(post => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <div className="post-meta">
                  <span 
                    className="post-status" 
                    style={{ color: getStatusColor(post.status) }}
                  >
                    {post.status.toUpperCase()}
                  </span>
                  <span className="post-type">
                    {getPostTypeLabel(post.post_type)}
                  </span>
                </div>
                <div className="post-actions">
                  <Link 
                    to={`/create/edit/${post.id}`}
                    className="action-btn edit-btn"
                  >
                    ✏️
                  </Link>
                </div>
              </div>

              <div className="post-content">
                <h3 className="post-title">
                  <Link to={`/create/edit/${post.id}`}>
                    {post.title}
                  </Link>
                </h3>
                {post.excerpt && (
                  <p className="post-excerpt">{post.excerpt}</p>
                )}
                {post.persona && (
                  <div className="post-persona">
                    <span className="persona-label">
                      {post.persona.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="post-footer">
                <div className="post-dates">
                  <span className="date-label">Updated:</span>
                  <span className="date-value">
                    {formatDate(post.updated_at)}
                  </span>
                </div>
                {post.author_name && (
                  <span className="post-author">by {post.author_name}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostList;