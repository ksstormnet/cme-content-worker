import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import LoginPage from './components/LoginPage';
import CreateDashboard from './components/CreateDashboard';
import AdminDashboard from './components/AdminDashboard';
import LoadingSpinner from './components/LoadingSpinner';

// Types
interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

function App() {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAuth({ user: data.data, loading: false, error: null });
      } else {
        setAuth({ user: null, loading: false, error: null });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuth({ user: null, loading: false, error: 'Authentication check failed' });
    }
  };

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      setAuth(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAuth({ user: data.data, loading: false, error: null });
        return true;
      } else {
        setAuth(prev => ({ 
          ...prev, 
          loading: false, 
          error: data.error || 'Login failed' 
        }));
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuth(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Network error during login' 
      }));
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setAuth({ user: null, loading: false, error: null });
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout on client side even if server request fails
      setAuth({ user: null, loading: false, error: null });
    }
  };

  if (auth.loading) {
    return (
      <div className="app-loading">
        <LoadingSpinner />
        <p>Loading Cruise Made Easy Content System...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1 className="app-title">
              <span className="brand">Cruise Made Easy</span>
              <span className="subtitle">Content System</span>
            </h1>
            {auth.user && (
              <div className="user-info">
                <span className="user-name">{auth.user.name}</span>
                <span className="user-role">({auth.user.role})</span>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="app-main">
          <Routes>
            {/* Public routes */}
            <Route 
              path="/login" 
              element={
                auth.user ? 
                <Navigate to="/create" replace /> : 
                <LoginPage onLogin={handleLogin} error={auth.error} />
              } 
            />

            {/* Protected routes */}
            <Route 
              path="/create/*" 
              element={
                auth.user ? 
                <CreateDashboard user={auth.user} /> : 
                <Navigate to="/login" replace />
              } 
            />

            <Route 
              path="/admin/*" 
              element={
                auth.user && auth.user.role === 'admin' ? 
                <AdminDashboard user={auth.user} /> : 
                <Navigate to="/create" replace />
              } 
            />

            {/* Default redirect */}
            <Route 
              path="/" 
              element={
                auth.user ? 
                <Navigate to="/create" replace /> : 
                <Navigate to="/login" replace />
              } 
            />
            
            {/* Catch-all redirect */}
            <Route 
              path="*" 
              element={
                auth.user ? 
                <Navigate to="/create" replace /> : 
                <Navigate to="/login" replace />
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;