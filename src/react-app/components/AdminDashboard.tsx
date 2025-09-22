import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import { validateUrlPattern, getExampleUrls } from '../../utils/url';
import MediaCategoryManager from './MediaCategoryManager';
import WordPressTemplateManager from './WordPressTemplateManager';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AdminDashboardProps {
  user: User;
}

interface Setting {
  key: string;
  value: any;
  description?: string;
}

interface Stats {
  post_counts: { status: string; count: number }[];
  recent_posts: any[];
  ai_usage: any[];
}

interface UserData {
  id?: number;
  email: string;
  name: string;
  role: string;
  password?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editingTag, setEditingTag] = useState<any | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showTagForm, setShowTagForm] = useState(false);

  useEffect(() => {
    if (activeTab === 'overview') {
      loadStats();
    } else if (activeTab === 'settings') {
      loadSettings();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'categories') {
      loadCategories();
      loadTags();
    }
    // Note: media tab doesn't need to load anything here as MediaCategoryManager handles its own data
  }, [activeTab]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      } else {
        showMessage('error', data.error || 'Failed to load settings');
      }
    } catch (error) {
      showMessage('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/stats', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      } else {
        showMessage('error', data.error || 'Failed to load statistics');
      }
    } catch (error) {
      showMessage('error', 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        showMessage('error', data.error || 'Failed to load users');
      }
    } catch (error) {
      showMessage('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/categories', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      } else {
        showMessage('error', data.error || 'Failed to load categories');
      }
    } catch (error) {
      showMessage('error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const response = await fetch('/api/admin/tags', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setTags(data.data);
      } else {
        showMessage('error', data.error || 'Failed to load tags');
      }
    } catch (error) {
      showMessage('error', 'Failed to load tags');
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      const data = await response.json();
      if (data.success) {
        showMessage('success', 'Settings saved successfully');
      } else {
        showMessage('error', data.error || 'Failed to save settings');
      }
    } catch (error) {
      showMessage('error', 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const saveUser = async (userData: UserData) => {
    setLoading(true);
    try {
      const url = userData.id ? `/api/admin/users/${userData.id}` : '/api/admin/users';
      const method = userData.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      if (data.success) {
        showMessage('success', userData.id ? 'User updated successfully' : 'User created successfully');
        setShowUserForm(false);
        setEditingUser(null);
        loadUsers();
      } else {
        showMessage('error', data.error || 'Failed to save user');
      }
    } catch (error) {
      showMessage('error', 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        showMessage('success', 'User deleted successfully');
        loadUsers();
      } else {
        showMessage('error', data.error || 'Failed to delete user');
      }
    } catch (error) {
      showMessage('error', 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const saveCategory = async (categoryData: any) => {
    setLoading(true);
    try {
      const url = categoryData.id ? `/api/admin/categories/${categoryData.id}` : '/api/admin/categories';
      const method = categoryData.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(categoryData)
      });
      const data = await response.json();
      if (data.success) {
        showMessage('success', categoryData.id ? 'Category updated successfully' : 'Category created successfully');
        setShowCategoryForm(false);
        setEditingCategory(null);
        loadCategories();
      } else {
        showMessage('error', data.error || 'Failed to save category');
      }
    } catch (error) {
      showMessage('error', 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        showMessage('success', 'Category deleted successfully');
        loadCategories();
      } else {
        showMessage('error', data.error || 'Failed to delete category');
      }
    } catch (error) {
      showMessage('error', 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const saveTag = async (tagData: any) => {
    setLoading(true);
    try {
      const url = tagData.id ? `/api/admin/tags/${tagData.id}` : '/api/admin/tags';
      const method = tagData.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(tagData)
      });
      const data = await response.json();
      if (data.success) {
        showMessage('success', tagData.id ? 'Tag updated successfully' : 'Tag created successfully');
        setShowTagForm(false);
        setEditingTag(null);
        loadTags();
      } else {
        showMessage('error', data.error || 'Failed to save tag');
      }
    } catch (error) {
      showMessage('error', 'Failed to save tag');
    } finally {
      setLoading(false);
    }
  };

  const deleteTag = async (tagId: number) => {
    if (!confirm('Are you sure you want to delete this tag? This will remove it from all posts.')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/tags/${tagId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        showMessage('success', 'Tag deleted successfully');
        loadTags();
      } else {
        showMessage('error', data.error || 'Failed to delete tag');
      }
    } catch (error) {
      showMessage('error', 'Failed to delete tag');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const renderOverview = () => (
    <div className="admin-section">
      <h3>System Overview</h3>
      {loading && <div className="loading">Loading statistics...</div>}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Post Statistics</h4>
            <div className="stat-list">
              {stats.post_counts.map((stat: any) => (
                <div key={stat.status} className="stat-item">
                  <span className="stat-label">{stat.status}:</span>
                  <span className="stat-value">{stat.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="stat-card">
            <h4>Recent Posts</h4>
            <div className="recent-posts">
              {stats.recent_posts.slice(0, 5).map((post: any) => (
                <div key={post.id} className="recent-post">
                  <div className="post-title">{post.title}</div>
                  <div className="post-meta">
                    <span className={`status ${post.status}`}>{post.status}</span>
                    <span className="post-type">{post.post_type}</span>
                    {post.category && post.category !== 'general' && (
                      <span className="post-category">{post.category}</span>
                    )}
                  </div>
                  {post.tags && post.tags.length > 0 && (
                    <div className="post-tags">
                      {post.tags.slice(0, 3).map((tag: string, index: number) => (
                        <span key={index} className="tag">{tag}</span>
                      ))}
                      {post.tags.length > 3 && <span className="tag-more">+{post.tags.length - 3}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="stat-card">
            <h4>AI Usage (30 days)</h4>
            <div className="ai-stats">
              {stats.ai_usage.map((usage: any) => (
                <div key={usage.model_used} className="ai-usage">
                  <div className="model-name">{usage.model_used}</div>
                  <div className="usage-stats">
                    <span>{usage.usage_count} generations</span>
                    <span>${(usage.total_cost_cents / 100).toFixed(2)} cost</span>
                    <span>{Math.round(usage.avg_time_ms)}ms avg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="admin-section">
      <h3>System Settings</h3>
      {loading && <div className="loading">Loading settings...</div>}
      <div className="settings-form">

        <div className="setting-group">
          <h4>AI/API Configuration</h4>
          
          {/* Model Assignment Strategy */}
          <div className="form-section">
            <h5>Model Assignment & Selection</h5>
            <div className="model-strategy-info">
              <p><strong>ChatGPT:</strong> Content planning and strategy</p>
              <p><strong>Claude:</strong> Content writing and generation</p>
              <p><strong>DataForSEO:</strong> SEO analysis and optimization</p>
            </div>
            
            <div className="form-row">
              <label>ChatGPT Model (Planning):</label>
              <select
                value={settings.chatgpt_model || 'gpt-3.5-turbo'}
                onChange={(e) => updateSetting('chatgpt_model', e.target.value)}
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Cheapest)</option>
                <option value="gpt-4o-mini">GPT-4o Mini (Standard)</option>
                <option value="gpt-4o">GPT-4o (Premium)</option>
              </select>
              <small>Default: GPT-3.5 Turbo for cost-effective planning</small>
            </div>
            
            <div className="form-row">
              <label>Claude Model (Writing):</label>
              <select
                value={settings.claude_model || 'claude-3-5-sonnet-20241022'}
                onChange={(e) => updateSetting('claude_model', e.target.value)}
              >
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Latest)</option>
                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Faster)</option>
                <option value="claude-3-opus-20240229">Claude 3 Opus (Most Capable)</option>
              </select>
              <small>Default: Claude 3.5 Sonnet (latest version)</small>
            </div>
          </div>

          {/* API Keys */}
          <div className="form-section">
            <h5>API Keys</h5>
            <div className="form-row">
              <label>OpenAI API Key:</label>
              <input
                type="password"
                value={settings.openai_api_key || ''}
                onChange={(e) => updateSetting('openai_api_key', e.target.value)}
                placeholder="sk-..."
              />
              <small>Used for content planning with GPT-4o-mini</small>
            </div>
            <div className="form-row">
              <label>Claude API Key:</label>
              <input
                type="password"
                value={settings.claude_api_key || ''}
                onChange={(e) => updateSetting('claude_api_key', e.target.value)}
                placeholder="sk-ant-..."
              />
              <small>Used for content writing with Claude-3.5-Sonnet</small>
            </div>
            <div className="form-row">
              <label>DataForSEO API Username:</label>
              <input
                type="text"
                value={settings.dataforseo_username || ''}
                onChange={(e) => updateSetting('dataforseo_username', e.target.value)}
                placeholder="your-username"
              />
              <small>DataForSEO account username</small>
            </div>
            <div className="form-row">
              <label>DataForSEO API Key:</label>
              <input
                type="password"
                value={settings.dataforseo_api_key || ''}
                onChange={(e) => updateSetting('dataforseo_api_key', e.target.value)}
                placeholder="your-api-key"
              />
              <small>Used for SEO analysis and keyword research</small>
            </div>
          </div>

          {/* Fallback Settings */}
          <div className="form-section">
            <h5>Fallback Configuration</h5>
            <div className="form-row">
              <label>Fallback Model:</label>
              <select
                value={settings.ai_fallback_model || 'gpt-3.5-turbo'}
                onChange={(e) => updateSetting('ai_fallback_model', e.target.value)}
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
              </select>
              <small>Used when primary models fail</small>
            </div>
          </div>
        </div>

        <div className="setting-group">
          <h4>External CSS Sync Configuration</h4>
          <div className="form-row">
            <label>CSS Sync Enabled:</label>
            <select
              value={settings.css_sync_enabled || 'false'}
              onChange={(e) => updateSetting('css_sync_enabled', e.target.value)}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="form-row">
            <label>External Site CSS URLs (JSON array):</label>
            <textarea
              value={typeof settings.site_css_urls === 'string' ? settings.site_css_urls : JSON.stringify(settings.site_css_urls || [])}
              onChange={(e) => updateSetting('site_css_urls', e.target.value)}
              placeholder='["https://example.com/style.css"]'
              rows={3}
            />
          </div>
        </div>

        <div className="setting-group">
          <h4>R2 Storage Configuration</h4>
          <div className="form-row">
            <label>R2 Bucket Name:</label>
            <input
              type="text"
              value={settings.r2_bucket_name || ''}
              onChange={(e) => updateSetting('r2_bucket_name', e.target.value)}
              placeholder="cruisemadeeasy-images"
            />
          </div>
          <div className="form-row">
            <label>R2 Public URL:</label>
            <input
              type="url"
              value={settings.r2_public_url || ''}
              onChange={(e) => updateSetting('r2_public_url', e.target.value)}
              placeholder="https://cdn.cruisemadeeasy.com"
            />
          </div>
          <div className="form-row">
            <label>R2 Internal URL:</label>
            <input
              type="url"
              value={settings.r2_internal_url || ''}
              onChange={(e) => updateSetting('r2_internal_url', e.target.value)}
              placeholder="https://...r2.cloudflarestorage.com/bucket"
            />
          </div>
        </div>

        <WordPressTemplateManager />

        <div className="form-actions">
          <button 
            onClick={saveSettings}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="admin-section">
      <div className="section-header">
        <h3>User Management</h3>
        <button 
          onClick={() => {
            setEditingUser({ email: '', name: '', role: 'editor', password: '' });
            setShowUserForm(true);
          }}
          className="btn btn-primary"
        >
          Add New User
        </button>
      </div>
      
      {loading && <div className="loading">Loading users...</div>}
      
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((userData) => (
              <tr key={userData.id}>
                <td>{userData.name}</td>
                <td>{userData.email}</td>
                <td>
                  <span className={`role ${userData.role}`}>{userData.role}</span>
                </td>
                <td className="actions">
                  <button 
                    onClick={() => {
                      setEditingUser(userData);
                      setShowUserForm(true);
                    }}
                    className="btn btn-small"
                  >
                    Edit
                  </button>
                  {userData.id !== user.id && (
                    <button 
                      onClick={() => deleteUser(userData.id!)}
                      className="btn btn-small btn-danger"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showUserForm && editingUser && (
        <UserForm
          user={editingUser}
          onSave={saveUser}
          onCancel={() => {
            setShowUserForm(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );

  const renderCategoriesAndTags = () => (
    <div className="admin-section">
      <div className="categories-tags-container">
        <div className="categories-section">
          <div className="section-header">
            <h3>Categories</h3>
            <button 
              onClick={() => {
                setEditingCategory({ name: '', description: '', color: '#6b7280', icon: '📝' });
                setShowCategoryForm(true);
              }}
              className="btn btn-primary"
            >
              Add Category
            </button>
          </div>
          
          <div className="categories-table">
            <table>
              <thead>
                <tr>
                  <th>Icon</th>
                  <th>Name</th>
                  <th>Priority</th>
                  <th>Posts</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <span 
                        className="category-icon" 
                        style={{ color: category.color }}
                      >
                        {category.icon}
                      </span>
                    </td>
                    <td>
                      <div>
                        <strong>{category.name}</strong>
                        <div className="category-slug">/{category.slug}/</div>
                      </div>
                    </td>
                    <td>
                      {category.priority ? (
                        <span className="priority-badge">{category.priority}</span>
                      ) : (
                        <span className="no-priority">MORE</span>
                      )}
                    </td>
                    <td>{category.post_count}</td>
                    <td>
                      <span className={`status ${category.active ? 'active' : 'inactive'}`}>
                        {category.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setEditingCategory(category);
                          setShowCategoryForm(true);
                        }}
                        className="btn btn-small"
                      >
                        Edit
                      </button>
                      {category.post_count === 0 && (
                        <button
                          onClick={() => deleteCategory(category.id)}
                          className="btn btn-small btn-danger"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="tags-section">
          <div className="section-header">
            <h3>Tags</h3>
            <button 
              onClick={() => {
                setEditingTag({ name: '', description: '', color: '#10b981' });
                setShowTagForm(true);
              }}
              className="btn btn-primary"
            >
              Add Tag
            </button>
          </div>
          
          <div className="tags-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Posts</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <tr key={tag.id}>
                    <td>
                      <span 
                        className="tag-name"
                        style={{ color: tag.color }}
                      >
                        #{tag.name}
                      </span>
                    </td>
                    <td>{tag.post_count}</td>
                    <td>
                      <span className={`status ${tag.active ? 'active' : 'inactive'}`}>
                        {tag.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setEditingTag(tag);
                          setShowTagForm(true);
                        }}
                        className="btn btn-small"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTag(tag.id)}
                        className="btn btn-small btn-danger"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showCategoryForm && editingCategory && (
        <CategoryForm
          category={editingCategory}
          onSave={saveCategory}
          onCancel={() => {
            setShowCategoryForm(false);
            setEditingCategory(null);
          }}
        />
      )}

      {showTagForm && editingTag && (
        <TagForm
          tag={editingTag}
          onSave={saveTag}
          onCancel={() => {
            setShowTagForm(false);
            setEditingTag(null);
          }}
        />
      )}
    </div>
  );

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <div className="admin-user-info">
          <span>Welcome, {user.name}</span>
          <span className={`role ${user.role}`}>{user.role}</span>
        </div>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="message-close">×</button>
        </div>
      )}

      <div className="admin-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
        <button 
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button 
          className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Categories & Tags
        </button>
        <button 
          className={`tab ${activeTab === 'media' ? 'active' : ''}`}
          onClick={() => setActiveTab('media')}
        >
          Media Library
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'categories' && renderCategoriesAndTags()}
        {activeTab === 'media' && <MediaCategoryManager user={user} />}
      </div>
    </div>
  );
};

interface UserFormProps {
  user: UserData;
  onSave: (user: UserData) => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState<UserData>(user);
  const [showPassword, setShowPassword] = useState(!user.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{user.id ? 'Edit User' : 'Add New User'}</h3>
          <button onClick={onCancel} className="modal-close">×</button>
        </div>
        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-row">
            <label>Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="form-row">
            <label>Email:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-row">
            <label>Role:</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              required
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          {(showPassword || !user.id) && (
            <div className="form-row">
              <label>Password:</label>
              <input
                type="password"
                value={formData.password || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required={!user.id}
                placeholder={user.id ? "Leave blank to keep current password" : "Enter password"}
              />
            </div>
          )}
          {user.id && !showPassword && (
            <div className="form-row">
              <button
                type="button"
                onClick={() => setShowPassword(true)}
                className="btn btn-small"
              >
                Change Password
              </button>
            </div>
          )}
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {user.id ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CategoryFormProps {
  category: any;
  onSave: (category: any) => void;
  onCancel: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ category, onSave, onCancel }) => {
  const [formData, setFormData] = useState(category);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.id ? prev.slug : generateSlug(name)
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{category.id ? 'Edit Category' : 'Add New Category'}</h3>
          <button onClick={onCancel} className="modal-close">×</button>
        </div>
        <form onSubmit={handleSubmit} className="category-form">
          <div className="form-row">
            <label>Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label>Slug:</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              required
              pattern="[a-z0-9-]+"
              title="Only lowercase letters, numbers, and hyphens allowed"
            />
            <small>Used in URLs (e.g., /cruise-tips/)</small>
          </div>
          <div className="form-row">
            <label>Description:</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="form-row">
            <label>Color:</label>
            <input
              type="color"
              value={formData.color || '#6b7280'}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            />
          </div>
          <div className="form-row">
            <label>Icon (emoji):</label>
            <input
              type="text"
              value={formData.icon || '📝'}
              onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
              maxLength={4}
              placeholder="📝"
            />
          </div>
          <div className="form-row">
            <label>Priority (1-4 for top pills, blank for MORE menu):</label>
            <select
              value={formData.priority || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                priority: e.target.value ? parseInt(e.target.value) : null 
              }))}
            >
              <option value="">No Priority (MORE menu)</option>
              <option value="1">Priority 1 (First pill)</option>
              <option value="2">Priority 2 (Second pill)</option>
              <option value="3">Priority 3 (Third pill)</option>
              <option value="4">Priority 4 (Fourth pill)</option>
            </select>
            <small>Priority 1-4 categories show as main filter buttons. Others go in MORE dropdown.</small>
          </div>
          <div className="form-row">
            <label>
              <input
                type="checkbox"
                checked={formData.active !== false}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
              />
              Active
            </label>
          </div>
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {category.id ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface TagFormProps {
  tag: any;
  onSave: (tag: any) => void;
  onCancel: () => void;
}

const TagForm: React.FC<TagFormProps> = ({ tag, onSave, onCancel }) => {
  const [formData, setFormData] = useState(tag);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.id ? prev.slug : generateSlug(name)
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{tag.id ? 'Edit Tag' : 'Add New Tag'}</h3>
          <button onClick={onCancel} className="modal-close">×</button>
        </div>
        <form onSubmit={handleSubmit} className="tag-form">
          <div className="form-row">
            <label>Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label>Slug:</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              required
              pattern="[a-z0-9-]+"
              title="Only lowercase letters, numbers, and hyphens allowed"
            />
          </div>
          <div className="form-row">
            <label>Description:</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="form-row">
            <label>Color:</label>
            <input
              type="color"
              value={formData.color || '#10b981'}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            />
          </div>
          <div className="form-row">
            <label>
              <input
                type="checkbox"
                checked={formData.active !== false}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
              />
              Active
            </label>
          </div>
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {tag.id ? 'Update Tag' : 'Create Tag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;