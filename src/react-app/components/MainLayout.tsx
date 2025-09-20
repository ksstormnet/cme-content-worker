import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <Link
              to="/create"
              className={`nav-link ${isActive('/create') && !isActive('/calendar') ? 'active' : ''}`}
              title="Posts"
            >
              <span className="link-icon">📝</span>
              {!sidebarCollapsed && <span className="link-text">Posts</span>}
            </Link>
            
            <Link
              to="/calendar"
              className={`nav-link ${isActive('/calendar') ? 'active' : ''}`}
              title="Content Calendar"
            >
              <span className="link-icon">📅</span>
              {!sidebarCollapsed && <span className="link-text">Content Calendar</span>}
            </Link>
            
            <Link
              to="/create/generate"
              className={`nav-link ${location.pathname === '/create/generate' ? 'active' : ''}`}
              title="Generate Content"
            >
              <span className="link-icon">🤖</span>
              {!sidebarCollapsed && <span className="link-text">Generate Content</span>}
            </Link>
            
            <Link
              to="/create/free-form"
              className={`nav-link ${location.pathname === '/create/free-form' ? 'active' : ''}`}
              title="Free-Form Editor"
            >
              <span className="link-icon">✍️</span>
              {!sidebarCollapsed && <span className="link-text">Free-Form Editor</span>}
            </Link>
            
            <Link
              to="/create/import"
              className={`nav-link ${location.pathname === '/create/import' ? 'active' : ''}`}
              title="Import Content"
            >
              <span className="link-icon">📁</span>
              {!sidebarCollapsed && <span className="link-text">Import Content</span>}
            </Link>
            
            <Link
              to="/create/media"
              className={`nav-link ${location.pathname === '/create/media' ? 'active' : ''}`}
              title="Media Library"
            >
              <span className="link-icon">🖼️</span>
              {!sidebarCollapsed && <span className="link-text">Media Library</span>}
            </Link>
          </div>

          {user.role === 'admin' && (
            <div className="nav-section">
              {!sidebarCollapsed && <h4 className="nav-subtitle">Administration</h4>}
              <Link
                to="/admin"
                className={`nav-link admin-link ${isActive('/admin') ? 'active' : ''}`}
                title="Admin Settings"
              >
                <span className="link-icon">⚙️</span>
                {!sidebarCollapsed && <span className="link-text">Settings & Config</span>}
              </Link>
            </div>
          )}
        </nav>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;