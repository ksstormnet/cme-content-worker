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
      {/* CME Logo - Back to Admin */}
      <Link to="/admin" className="sidebar-logo-link" title="Back to Dashboard">
        <div className="cme-logo">
          {isCollapsed ? (
            <span className="logo-icon">🚢</span>
          ) : (
            <>
              <span className="logo-icon">🚢</span>
              <span className="logo-text">CME</span>
            </>
          )}
        </div>
      </Link>

      {/* Sidebar Toggle */}
      <button
        className="sidebar-collapse-toggle"
        onClick={onToggle}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? '»' : '«'}
      </button>
    </div>
  );
};

export default EditorSidebar;
