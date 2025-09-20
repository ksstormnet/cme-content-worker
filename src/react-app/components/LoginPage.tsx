import React, { useState } from 'react';
import './LoginPage.css';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  error: string | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, error }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setLocalError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setLocalError(null);

    try {
      const success = await onLogin(formData.email, formData.password);
      if (!success) {
        setLocalError('Login failed. Please check your credentials.');
      }
    } catch (error) {
      setLocalError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (localError) setLocalError(null);
  };

  const displayError = error || localError;

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">
            <span className="brand">Cruise Made Easy</span>
            <span className="subtitle">Content System</span>
          </h1>
          <p className="login-description">
            Sign in to manage your Norwegian Cruise Line content
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {displayError && (
            <div className="error-message">
              {displayError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="admin@cruisemadeeasy.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isLoading || !formData.email || !formData.password}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p className="system-info">
            Powered by Cloudflare Workers • Secure & Fast
          </p>
          <div className="initial-credentials">
            <strong>Initial Login:</strong> admin@cruisemadeeasy.com / admin123
            <br />
            <small>(Change password immediately after first login)</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;