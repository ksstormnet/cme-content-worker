import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import './App.css';

// Components
import LoginPage from './components/LoginPage';
import CreateDashboard from './components/CreateDashboard';
import AdminDashboard from './components/AdminDashboard';
import LoadingSpinner from './components/LoadingSpinner';
import ChangePassword from './components/ChangePassword';
import ContentCalendar from './components/ContentCalendar';
import MainLayout from './components/MainLayout';

// Blog Components
import UnifiedBlogView from './components/UnifiedBlogView';
import PostPage from './components/PostPage';

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

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Dark mode effect
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
      localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }
  }, [darkMode]);


  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const handlePasswordChanged = () => {
    // Could show a success message here if needed
    console.log('Password changed successfully');
  };

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

  // Don't show loading for public routes - only check auth for protected routes
  // This allows BlogHomepage to render immediately without auth check

  return (
    <Router>
      <div className="app">
{auth.user && (
          <header className="app-header">
            <div className="header-content">
              <h1 className="app-title">
                <span className="brand">Cruise Made EASY Blog</span>
                <span className="subtitle">Content System</span>
              </h1>
              <div className="header-actions">
                <button onClick={toggleDarkMode} className="theme-toggle" title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}>
                  {darkMode ? '🌙' : '☀️'}
                </button>
                {auth.user && (
                  <div className="user-menu-container">
                    <button 
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="user-menu-trigger"
                    >
                      <span className="user-name">{auth.user.name}</span>
                      <span className="user-role">({auth.user.role})</span>
                      <span className="dropdown-arrow">▼</span>
                    </button>
                    
                    {showUserMenu && (
                      <div className="user-menu">
                        <button 
                          onClick={() => {
                            setShowChangePassword(true);
                            setShowUserMenu(false);
                          }}
                          className="menu-item"
                        >
                          🔑 Change Password
                        </button>
                        <button 
                          onClick={() => {
                            handleLogout();
                            setShowUserMenu(false);
                          }}
                          className="menu-item logout"
                        >
                          🚪 Logout
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>
        )}

        <main className="app-main">
          <Routes>
            {/* Root route - MUST come before wildcard routes */}
            <Route 
              path="/" 
              element={
                auth.user ? 
                <Navigate to="/admin/create" replace /> : 
                <UnifiedBlogView />
              } 
            />

            {/* Public blog routes - served by Vite in development, Worker in production */}
            <Route 
              path="/category/:categorySlug" 
              element={<UnifiedBlogView />} 
            />
            
            <Route 
              path="/:category/:slug" 
              element={<PostPage />} 
            />

            {/* Protected routes - namespaced under /admin */}
            <Route 
              path="/admin/calendar" 
              element={
                auth.user ? 
                <MainLayout user={auth.user}>
                  <ContentCalendar user={auth.user} />
                </MainLayout> : 
                <Navigate to="/blogin" replace />
              } 
            />

            <Route 
              path="/admin/create/*" 
              element={
                auth.user ? 
                <MainLayout user={auth.user}>
                  <CreateDashboard user={auth.user} />
                </MainLayout> : 
                <Navigate to="/blogin" replace />
              } 
            />

            <Route 
              path="/admin/settings/*" 
              element={
                auth.user && auth.user.role === 'admin' ? 
                <MainLayout user={auth.user}>
                  <AdminDashboard user={auth.user} />
                </MainLayout> : 
                <Navigate to="/admin/create" replace />
              } 
            />

            {/* Redirect authenticated users from /blogin to admin dashboard */}
            <Route 
              path="/blogin" 
              element={
                auth.user ? 
                <Navigate to="/admin/create" replace /> : 
                <LoginPage onLogin={handleLogin} error={auth.error} />
              } 
            />


            {/* Catch all other routes - redirect to appropriate location */}
            <Route 
              path="*" 
              element={
                auth.user ? 
                <Navigate to="/admin/create" replace /> : 
                <Navigate to="/blogin" replace />
              } 
            />
          </Routes>
        </main>

        {/* Change Password Modal */}
        {showChangePassword && (
          <ChangePassword
            onClose={() => setShowChangePassword(false)}
            onPasswordChanged={handlePasswordChanged}
          />
        )}
      </div>
    </Router>
  );
}

export default App;