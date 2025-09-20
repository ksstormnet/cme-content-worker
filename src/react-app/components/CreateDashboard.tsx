import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import './CreateDashboard.css';

// Components
import PostList from './PostList';
import ContentEditor from './ContentEditor';
import MediaLibrary from './MediaLibrary';
import LoadingSpinner from './LoadingSpinner';

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
  status: 'draft' | 'approved' | 'scheduled' | 'published';
  post_type: 'monday' | 'wednesday' | 'friday' | 'saturday' | 'newsletter';
  persona?: 'easy_breezy' | 'thrill_seeker' | 'luxe_seafarer';
  created_at: string;
  updated_at: string;
  author_name?: string;
  excerpt?: string;
}

const CreateDashboard: React.FC<CreateDashboardProps> = ({ user }) => {
  const location = useLocation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('drafts');

  useEffect(() => {
    loadPosts();
  }, [activeTab]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const status = activeTab === 'drafts' ? 'draft' : 
                   activeTab === 'approved' ? 'approved' :
                   activeTab === 'scheduled' ? 'scheduled' : 'published';
      
      const response = await fetch(`/api/create/posts?status=${status}&limit=50`, {
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
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts(prev => prev.map(post => 
      post.id === updatedPost.id ? updatedPost : post
    ));
  };

  const handlePostDeleted = (postId: number) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#6b7280';
      case 'approved': return '#10b981';
      case 'scheduled': return '#f59e0b';
      case 'published': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const isActive = (path: string) => location.pathname.includes(path);

  return (
    <div className="create-dashboard">
      <nav className="dashboard-nav">
        <div className="nav-section">
          <h2 className="nav-title">Editorial Workflow</h2>
          <div className="nav-tabs">
            <button
              className={`nav-tab ${activeTab === 'drafts' ? 'active' : ''}`}
              onClick={() => setActiveTab('drafts')}
            >
              <span className="tab-icon">📝</span>
              Drafts
              <span className="tab-count">
                {posts.filter(p => p.status === 'draft').length}
              </span>
            </button>
            <button
              className={`nav-tab ${activeTab === 'approved' ? 'active' : ''}`}
              onClick={() => setActiveTab('approved')}
            >
              <span className="tab-icon">✅</span>
              Approved
              <span className="tab-count">
                {posts.filter(p => p.status === 'approved').length}
              </span>
            </button>
            <button
              className={`nav-tab ${activeTab === 'scheduled' ? 'active' : ''}`}
              onClick={() => setActiveTab('scheduled')}
            >
              <span className="tab-icon">⏰</span>
              Scheduled
              <span className="tab-count">
                {posts.filter(p => p.status === 'scheduled').length}
              </span>
            </button>
            <button
              className={`nav-tab ${activeTab === 'published' ? 'active' : ''}`}
              onClick={() => setActiveTab('published')}
            >
              <span className="tab-icon">🚀</span>
              Published
              <span className="tab-count">
                {posts.filter(p => p.status === 'published').length}
              </span>
            </button>
          </div>
        </div>

        <div className="nav-section">
          <h3 className="nav-subtitle">Tools</h3>
          <div className="nav-links">
            <Link
              to="/create/generate"
              className={`nav-link ${isActive('/generate') ? 'active' : ''}`}
            >
              <span className="link-icon">🤖</span>
              Generate Content
            </Link>
            <Link
              to="/create/media"
              className={`nav-link ${isActive('/media') ? 'active' : ''}`}
            >
              <span className="link-icon">🖼️</span>
              Media Library
            </Link>
          </div>
        </div>

        {user.role === 'admin' && (
          <div className="nav-section">
            <h3 className="nav-subtitle">Administration</h3>
            <div className="nav-links">
              <Link
                to="/admin"
                className="nav-link admin-link"
              >
                <span className="link-icon">⚙️</span>
                Settings & Config
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main className="dashboard-main">
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

// Placeholder components - will be implemented next
const ContentGenerator: React.FC<{
  user: User;
  onPostCreated: (post: Post) => void;
}> = ({ user, onPostCreated }) => {
  return (
    <div className="content-generator">
      <h2>AI Content Generation</h2>
      <p>Content generation interface coming soon...</p>
      <div className="generation-stats">
        <div className="stat-card">
          <h3>This Week</h3>
          <p>4 posts generated</p>
        </div>
        <div className="stat-card">
          <h3>Cost Savings</h3>
          <p>$12.40 via smart routing</p>
        </div>
      </div>
    </div>
  );
};

export default CreateDashboard;