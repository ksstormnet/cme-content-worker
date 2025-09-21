import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import MediaCategoryTree from './MediaCategoryTree';
import './MainLayout.css';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface MainLayoutProps {
  user: User;
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ user, children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [writingSectionCollapsed, setWritingSectionCollapsed] = useState(false);
  const [mediaSectionCollapsed, setMediaSectionCollapsed] = useState(false);

  const isActive = (path: string) => location.pathname.includes(path) || location.pathname === path;

  return (
    <div className={`main-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="main-sidebar">
        <div className="sidebar-header">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="sidebar-toggle"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '▶' : '◀'}
          </button>
          {!sidebarCollapsed && <h3>Navigation</h3>}
          {!sidebarCollapsed && user.role === 'admin' && (
            <Link
              to="/admin/settings"
              className="header-settings-btn"
              title="Admin Settings"
            >
              ⚙️
            </Link>
          )}
        </div>

        <nav className="sidebar-nav">
          {/* Writing Section */}
          <div className="nav-section collapsible-section">
            <button 
              className="section-toggle" 
              onClick={() => {
                setWritingSectionCollapsed(!writingSectionCollapsed);
                // If expanding writing, collapse media
                if (writingSectionCollapsed) {
                  setMediaSectionCollapsed(true);
                }
              }}
              title={writingSectionCollapsed ? 'Expand Writing' : 'Collapse Writing'}
            >
              <span className="toggle-icon">{writingSectionCollapsed ? '▶' : '▼'}</span>
              {!sidebarCollapsed && <span className="section-title">Writing</span>}
            </button>
            
            {!writingSectionCollapsed && (
              <div className="section-content">
                <Link
                  to="/admin/create"
                  className={`nav-link ${isActive('/admin/create') && !isActive('/admin/calendar') && !isActive('/media') ? 'active' : ''}`}
                  title="Posts"
                >
                  <span className="link-icon">📝</span>
                  {!sidebarCollapsed && <span className="link-text">Posts</span>}
                </Link>
                
                <Link
                  to="/admin/calendar"
                  className={`nav-link ${isActive('/admin/calendar') ? 'active' : ''}`}
                  title="Content Calendar"
                >
                  <span className="link-icon">📅</span>
                  {!sidebarCollapsed && <span className="link-text">Content Calendar</span>}
                </Link>
                
                <Link
                  to="/admin/create/generate"
                  className={`nav-link ${location.pathname === '/admin/create/generate' ? 'active' : ''}`}
                  title="Generate Content"
                >
                  <span className="link-icon">🤖</span>
                  {!sidebarCollapsed && <span className="link-text">Generate Content</span>}
                </Link>
                
                <Link
                  to="/admin/create/free-form"
                  className={`nav-link ${location.pathname === '/admin/create/free-form' ? 'active' : ''}`}
                  title="Free-Form Editor"
                >
                  <span className="link-icon">✍️</span>
                  {!sidebarCollapsed && <span className="link-text">Free-Form Editor</span>}
                </Link>
                
                <Link
                  to="/admin/create/import"
                  className={`nav-link ${location.pathname === '/admin/create/import' ? 'active' : ''}`}
                  title="Import Content"
                >
                  <span className="link-icon">📁</span>
                  {!sidebarCollapsed && <span className="link-text">Import Content</span>}
                </Link>
              </div>
            )}
          </div>

          {/* Media Section */}
          <div className="nav-section collapsible-section">
            <button 
              className="section-toggle" 
              onClick={() => {
                setMediaSectionCollapsed(!mediaSectionCollapsed);
                // If expanding media, collapse writing
                if (mediaSectionCollapsed) {
                  setWritingSectionCollapsed(true);
                }
              }}
              title={mediaSectionCollapsed ? 'Expand Media' : 'Collapse Media'}
            >
              <span className="toggle-icon">{mediaSectionCollapsed ? '▶' : '▼'}</span>
              {!sidebarCollapsed && <span className="section-title">Media</span>}
            </button>
            
            {!mediaSectionCollapsed && !sidebarCollapsed && (
              <div className="section-content">
                <MediaCategoryTree 
                  user={user} 
                  onCategorySelect={(categorySlug) => {
                    // Navigate to media library with category filter using React Router
                    if (categorySlug === null) {
                      navigate('/create/media');
                    } else {
                      navigate(`/create/media?category=${categorySlug}`);
                    }
                  }}
                />
              </div>
            )}
          </div>

        </nav>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;