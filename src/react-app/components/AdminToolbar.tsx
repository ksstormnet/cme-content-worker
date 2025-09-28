import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AdminToolbarProps {
  user: User;
  onLogout: () => void;
}

const AdminToolbar: React.FC<AdminToolbarProps> = ({ user, onLogout }) => {
  const location = useLocation();
  
  // Don't show on admin routes - those have their own navigation
  if (location.pathname.startsWith('/admin') || location.pathname === '/blogin') {
    return null;
  }

  return (
    <div className="admin-toolbar">
      <div className="admin-toolbar-content">
        <div className="admin-toolbar-left">
          <span className="admin-indicator">
            🔧 Admin Mode
          </span>
          <span className="admin-user">
            {user.name} ({user.role})
          </span>
        </div>
        
        <div className="admin-toolbar-right">
          <Link to="/admin" className="admin-toolbar-button">
            📊 Dashboard
          </Link>
          <Link to="/admin/calendar" className="admin-toolbar-button">
            📅 Calendar
          </Link>
          <button onClick={onLogout} className="admin-toolbar-button logout">
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminToolbar;