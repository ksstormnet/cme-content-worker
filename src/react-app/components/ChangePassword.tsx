import React, { useState } from 'react';
import './ChangePassword.css';

interface ChangePasswordProps {
  onClose: () => void;
  onPasswordChanged: () => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ onClose, onPasswordChanged }) => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.current_password || !formData.new_password || !formData.confirm_password) {
      setError('All fields are required');
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    if (formData.new_password.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          current_password: formData.current_password,
          new_password: formData.new_password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onPasswordChanged();
        onClose();
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError(null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Change Password</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <form onSubmit={handleSubmit} className="change-password-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="current_password" className="form-label">
              Current Password
            </label>
            <input
              type="password"
              id="current_password"
              name="current_password"
              className="form-input"
              value={formData.current_password}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="new_password" className="form-label">
              New Password
            </label>
            <input
              type="password"
              id="new_password"
              name="new_password"
              className="form-input"
              value={formData.new_password}
              onChange={handleInputChange}
              required
              disabled={loading}
              minLength={6}
            />
            <small className="form-help">Minimum 6 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirm_password" className="form-label">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirm_password"
              name="confirm_password"
              className="form-input"
              value={formData.confirm_password}
              onChange={handleInputChange}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-btn"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading || !formData.current_password || !formData.new_password || !formData.confirm_password}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;