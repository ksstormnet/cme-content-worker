import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import './PostList.css';

interface Post {
  id: number;
  title: string;
  status: 'draft' | 'scheduled' | 'published';
  post_type: 'monday' | 'wednesday' | 'friday' | 'saturday' | 'newsletter';
  persona?: 'easy_breezy' | 'thrill_seeker' | 'luxe_seafarer';
  created_at: string;
  updated_at: string;
  published_date?: string;
  scheduled_date?: string;
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

type SortColumn = 'title' | 'status' | 'post_type' | 'created_at' | 'updated_at' | 'author_name';
type SortDirection = 'asc' | 'desc';

const PostList: React.FC<PostListProps> = ({
  posts,
  loading,
  error,
  activeTab,
  onPostUpdated,
  onPostDeleted,
  onRefresh
}) => {
  // Set default sort based on tab - Published: most recent first, Draft/Scheduled: next due date first
  const getDefaultSort = (): [SortColumn, SortDirection] => {
    if (activeTab === 'published') {
      return ['updated_at', 'desc']; // Most recently published first
    } else if (activeTab === 'drafts' || activeTab === 'scheduled') {
      return ['created_at', 'asc']; // Next due date first (oldest drafts need attention)
    } else {
      return ['updated_at', 'desc']; // Default for 'all' tab
    }
  };

  const [defaultSort, defaultDirection] = getDefaultSort();
  const [sortColumn, setSortColumn] = useState<SortColumn>(defaultSort);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultDirection);
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Reset sort when tab changes
  useEffect(() => {
    const [newSort, newDirection] = getDefaultSort();
    setSortColumn(newSort);
    setSortDirection(newDirection);
  }, [activeTab]);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#6b7280';
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

  const formatStatusDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const time = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    
    return `${year}-${day}-${month} ${time}`;
  };

  const getStatusDateInfo = (post: Post) => {
    switch (post.status) {
      case 'published':
        return {
          showDate: true,
          date: post.published_date || post.updated_at
        };
      case 'scheduled':
        return {
          showDate: true,
          date: post.scheduled_date || post.created_at
        };
      case 'draft':
        return {
          showDate: post.scheduled_date ? true : false, // Only show if scheduled_date exists
          date: post.scheduled_date
        };
      default:
        return {
          showDate: false,
          date: null
        };
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedPosts = [...posts].sort((a, b) => {
    let aValue: any = a[sortColumn];
    let bValue: any = b[sortColumn];

    // Handle null/undefined values
    if (aValue == null) aValue = '';
    if (bValue == null) bValue = '';

    // Convert dates to timestamps for comparison
    if (sortColumn === 'created_at' || sortColumn === 'updated_at') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    // String comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPosts(posts.map(post => post.id));
    } else {
      setSelectedPosts([]);
    }
  };

  const handleSelectPost = (postId: number, checked: boolean) => {
    if (checked) {
      setSelectedPosts([...selectedPosts, postId]);
    } else {
      setSelectedPosts(selectedPosts.filter(id => id !== postId));
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`/api/create/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        onPostDeleted(postId);
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete post');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPosts.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedPosts.length} posts?`)) return;

    try {
      const deletePromises = selectedPosts.map(postId =>
        fetch(`/api/create/posts/${postId}`, {
          method: 'DELETE',
          credentials: 'include'
        })
      );

      await Promise.all(deletePromises);
      selectedPosts.forEach(postId => onPostDeleted(postId));
      setSelectedPosts([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Failed to delete some posts');
    }
  };

  const handleUnpublish = async (postId: number) => {
    if (!confirm('Are you sure you want to unpublish this post?')) return;

    try {
      const response = await fetch(`/api/create/posts/${postId}/unpublish`, {
        method: 'PATCH',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        onPostUpdated(data.data);
      } else {
        alert('Failed to unpublish post');
      }
    } catch (error) {
      console.error('Unpublish error:', error);
      alert('Failed to unpublish post');
    }
  };

  const getPreviewUrl = (post: Post) => {
    // This would typically be a preview URL or public URL
    return `/preview/${post.id}`; // Placeholder URL structure
  };

  const getViewUrl = (post: Post) => {
    // This would typically be the public URL for published posts
    return `/view/${post.id}`; // Placeholder URL structure
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Update bulk actions visibility when selection changes
  useEffect(() => {
    setShowBulkActions(selectedPosts.length > 0);
  }, [selectedPosts]);

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
      {showBulkActions && (
        <div className="bulk-actions-bar">
          <span className="selected-count">
            {selectedPosts.length} post{selectedPosts.length !== 1 ? 's' : ''} selected
          </span>
          <div className="bulk-actions">
            <button 
              className="bulk-action-btn bulk-delete"
              onClick={handleBulkDelete}
            >
              🗑️ Delete
            </button>
            <button 
              className="bulk-action-btn bulk-cancel"
              onClick={() => setSelectedPosts([])}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No {activeTab} posts yet</h3>
          <p>Use the "+ New" button above to create your first piece of content</p>
        </div>
      ) : (
        <div className="posts-table-container">
          <table className="posts-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedPosts.length === posts.length && posts.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="select-all-checkbox"
                  />
                </th>
                <th 
                  className={`sortable ${sortColumn === 'title' ? 'sorted' : ''}`}
                  onClick={() => handleSort('title')}
                >
                  Title {getSortIcon('title')}
                </th>
                <th 
                  className={`sortable ${sortColumn === 'status' ? 'sorted' : ''}`}
                  onClick={() => handleSort('status')}
                >
                  Status {getSortIcon('status')}
                </th>
                <th 
                  className={`sortable ${sortColumn === 'post_type' ? 'sorted' : ''}`}
                  onClick={() => handleSort('post_type')}
                >
                  Type {getSortIcon('post_type')}
                </th>
                <th 
                  className={`sortable ${sortColumn === 'updated_at' ? 'sorted' : ''}`}
                  onClick={() => handleSort('updated_at')}
                >
                  Mod Date {getSortIcon('updated_at')}
                </th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedPosts.map(post => (
                <tr key={post.id} className={selectedPosts.includes(post.id) ? 'selected' : ''}>
                  <td className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectedPosts.includes(post.id)}
                      onChange={(e) => handleSelectPost(post.id, e.target.checked)}
                    />
                  </td>
                  <td className="title-col">
                    <div className="title-wrapper">
                      <Link to={`/create/edit/${post.id}`} className="post-title-link">
                        <strong>{post.title || 'Untitled'}</strong>
                      </Link>
                      {post.excerpt && (
                        <div className="post-excerpt">{post.excerpt}</div>
                      )}
                      {post.persona && (
                        <div className="post-persona">
                          <span className="persona-badge">
                            {post.persona.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="status-col">
                    <div className="status-wrapper">
                      <span 
                        className={`status-badge status-${post.status}`}
                      >
                        {post.status}
                      </span>
                      {getStatusDateInfo(post).showDate && (
                        <div className="status-date">
                          <div className="status-date-value">{formatStatusDate(getStatusDateInfo(post).date)}</div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="type-col">
                    <span className="type-label">
                      {getPostTypeLabel(post.post_type)}
                    </span>
                  </td>
                  <td className="date-col">
                    <div className="date-info">
                      <div className="date-primary">{formatStatusDate(post.updated_at)}</div>
                    </div>
                  </td>
                  <td className="actions-col">
                    <div className="row-actions">
                      <Link 
                        to={`/create/edit/${post.id}`}
                        className="action-link edit"
                        title="Edit"
                      >
                        Edit
                      </Link>
                      <span className="action-separator">|</span>
                      
                      {/* Preview/View link based on status */}
                      {post.status === 'published' ? (
                        <a
                          href={getViewUrl(post)}
                          className="action-link view"
                          title="View"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </a>
                      ) : (
                        <a
                          href={getPreviewUrl(post)}
                          className="action-link preview"
                          title="Preview"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Preview
                        </a>
                      )}
                      <span className="action-separator">|</span>
                      
                      {/* Unpublish action for published posts */}
                      {post.status === 'published' && (
                        <>
                          <button
                            className="action-link unpublish"
                            onClick={() => handleUnpublish(post.id)}
                            title="Unpublish"
                          >
                            Unpublish
                          </button>
                          <span className="action-separator">|</span>
                        </>
                      )}
                      
                      <button
                        className="action-link delete"
                        onClick={() => handleDeletePost(post.id)}
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PostList;