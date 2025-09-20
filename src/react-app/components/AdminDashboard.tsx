import React from 'react';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      <p>Administrative settings and configuration panel.</p>
      <p>Features:</p>
      <ul>
        <li>API Key Management</li>
        <li>URL Routing Configuration</li>
        <li>CSS Sync Settings</li>
        <li>User Management</li>
        <li>System Statistics</li>
      </ul>
      <p>Admin User: {user.name}</p>
    </div>
  );
};

export default AdminDashboard;