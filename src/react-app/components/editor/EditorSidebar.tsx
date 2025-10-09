import React from 'react';
import { Link } from 'react-router-dom';
import './EditorSidebar.css';

interface EditorSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({ isCollapsed, onToggle }) => {
  return (
    <div className={`editor-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          {!isCollapsed && <span className="logo-text">Navigation</span>}
        </div>
        <button
          className="sidebar-toggle"
          onClick={onToggle}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '☰' : '⚙️'}
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {!isCollapsed && <div className="section-label">WRITING</div>}

          <Link to="/admin" className="nav-item" title="Posts">
            <span className="nav-icon">📝</span>
            {!isCollapsed && <span className="nav-label">Posts</span>}
          </Link>

          <Link to="/admin/generate" className="nav-item" title="AI Generator">
            <span className="nav-icon">🤖</span>
            {!isCollapsed && <span className="nav-label">AI Generator</span>}
          </Link>

          <Link to="/admin/calendar" className="nav-item" title="Calendar">
            <span className="nav-icon">📅</span>
            {!isCollapsed && <span className="nav-label">Calendar</span>}
          </Link>

          <Link to="/admin/import" className="nav-item" title="Import">
            <span className="nav-icon">📥</span>
            {!isCollapsed && <span className="nav-label">Import</span>}
          </Link>
        </div>

        <div className="nav-section">
          {!isCollapsed && <div className="section-label">MEDIA</div>}

          <Link to="/admin/media" className="nav-item" title="All Files">
            <span className="nav-icon">🖼️</span>
            {!isCollapsed && <span className="nav-label">All Files</span>}
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default EditorSidebar;
