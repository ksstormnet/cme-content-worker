import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import './CreateDashboard.css';

// Components
import PostList from './PostList';
import ContentEditor from './ContentEditor';
import PostEditor from './PostEditor';
import MediaLibrary from './MediaLibrary';
import ContentGenerator from './ContentGenerator';
import FreeFormEditor from './FreeFormEditor';
import ImportInterface from './ImportInterface';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface CreateDashboardProps {
  user: User;
}

interface Post {
  id: number;
  title: string;
  status: 'draft' | 'scheduled' | 'published';
  post_type: 'monday' | 'wednesday' | 'friday' | 'saturday' | 'newsletter';
  persona?: 'easy_breezy' | 'thrill_seeker' | 'luxe_seafarer';
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  author_name?: string;
  excerpt?: string;
}

interface StatusCounts {
  draft: number;
  scheduled: number;
  published: number;
  total: number;
}

const CreateDashboard: React.FC<CreateDashboardProps> = ({ user }) => {
  const location = useLocation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [counts, setCounts] = useState<StatusCounts>({ draft: 0, scheduled: 0, published: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('published');
  const [showNewDropdown, setShowNewDropdown] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      let apiUrl = '/api/create/posts?limit=50';

      if (activeTab !== 'all') {
        const status = activeTab === 'drafts' ? 'draft' :
                     activeTab === 'scheduled' ? 'scheduled' : 'published';
        apiUrl += `&status=${status}`;
      }

      const response = await fetch(apiUrl, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.data || []);
        setError(null);
      } else {
        throw new Error('Failed to load posts');
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const loadCounts = useCallback(async () => {
    try {
      console.log('Loading counts...');
      const response = await fetch('/api/create/stats', {
        credentials: 'include'
      });

      console.log('Counts response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Counts API response:', data);
        console.log('Setting counts to:', data.data);
        setCounts(data.data);
      } else {
        console.error('Failed to load counts, status:', response.status);
      }
    } catch (error) {
      console.error('Error loading counts:', error);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
    loadCounts(); // Refresh counts when a post is created
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts(prev => prev.map(post =>
      post.id === updatedPost.id ? updatedPost : post
    ));
    loadCounts(); // Refresh counts when a post is updated
  };

  const handlePostDeleted = (postId: number) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
    loadCounts(); // Refresh counts when a post is deleted
  };

  // Only show post header for post-related routes, not for media or editor
  const isPostRoute = location.pathname === '/admin' ||
                      location.pathname === '/admin/' ||
                      location.pathname.startsWith('/admin/edit/') ||
                      location.pathname.startsWith('/admin/generate') ||
                      location.pathname.startsWith('/admin/new') ||
                      location.pathname.startsWith('/admin/import');

  return (
    <div className="create-dashboard">
      {isPostRoute && (
        <div className="dashboard-header">
        <h2 className="dashboard-title">Posts</h2>

        <div className="header-controls">
          <div className="new-post-dropdown">
            <button
              className="new-post-btn"
              onClick={() => setShowNewDropdown(!showNewDropdown)}
            >
              <span>+ New</span>
              <span className="dropdown-arrow">{showNewDropdown ? '▲' : '▼'}</span>
            </button>

            {showNewDropdown && (
              <div className="dropdown-menu">
                <Link
                  to="/admin/generate"
                  className="dropdown-item"
                  onClick={() => setShowNewDropdown(false)}
                >
                  <span className="item-icon">🤖</span>
                  Generate
                </Link>
                <Link
                  to="/admin/editor"
                  className="dropdown-item"
                  onClick={() => setShowNewDropdown(false)}
                >
                  <span className="item-icon">✏️</span>
                  Editor
                </Link>
                <Link
                  to="/admin/editor"
                  className="dropdown-item"
                  onClick={() => setShowNewDropdown(false)}
                >
                  <span className="item-icon">✍️</span>
                  Write
                </Link>
              </div>
            )}
          </div>

          <div className="status-tabs">
            <button
              className={`status-pill status-all ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <span className="tab-icon">📋</span>
              All
              <span className="tab-count">
                {counts.total || 0}
              </span>
            </button>
            <button
              className={`status-pill status-published ${activeTab === 'published' ? 'active' : ''}`}
              onClick={() => setActiveTab('published')}
            >
              <span className="tab-icon">🚀</span>
              Published
              <span className="tab-count">
                {counts.published || 0}
              </span>
            </button>
            <button
              className={`status-pill status-draft ${activeTab === 'drafts' ? 'active' : ''}`}
              onClick={() => setActiveTab('drafts')}
            >
              <span className="tab-icon">📝</span>
              Drafts
              <span className="tab-count">
                {counts.draft || 0}
              </span>
            </button>
            <button
              className={`status-pill status-scheduled ${activeTab === 'scheduled' ? 'active' : ''}`}
              onClick={() => setActiveTab('scheduled')}
            >
              <span className="tab-icon">⏰</span>
              Scheduled
              <span className="tab-count">
                {counts.scheduled || 0}
              </span>
            </button>
          </div>
        </div>
        </div>
      )}

      <main className="dashboard-content">
        <Routes>
          <Route
            path="/"
            element={
              <PostList
                posts={posts}
                loading={loading}
                error={error}
                activeTab={activeTab}
                onPostUpdated={handlePostUpdated}
                onPostDeleted={handlePostDeleted}
                onRefresh={loadPosts}
              />
            }
          />
          <Route
            path="/generate"
            element={
              <ContentGenerator
                user={user}
                onPostCreated={handlePostCreated}
              />
            }
          />
          <Route
            path="/editor"
            element={
              <PostEditor
                user={user}
                onPostCreated={handlePostCreated}
                onPostUpdated={handlePostUpdated}
              />
            }
          />
          <Route
            path="/editor/:id"
            element={
              <PostEditor
                user={user}
                onPostCreated={handlePostCreated}
                onPostUpdated={handlePostUpdated}
              />
            }
          />
          <Route
            path="/new"
            element={
              <FreeFormEditor
                user={user}
                onPostCreated={handlePostCreated}
              />
            }
          />
          <Route
            path="/import"
            element={
              <ImportInterface
                user={user}
                onContentImported={loadPosts}
              />
            }
          />
          <Route
            path="/edit/:id"
            element={
              <ContentEditor
                user={user}
                onPostUpdated={handlePostUpdated}
              />
            }
          />
          <Route
            path="/media"
            element={<MediaLibrary user={user} />}
          />
        </Routes>
      </main>
    </div>
  );
};


export default CreateDashboard;
