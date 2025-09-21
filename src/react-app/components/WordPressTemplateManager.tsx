import React, { useState, useEffect } from 'react';

interface TemplateStatus {
  status: string;
  message: string;
  cached: boolean;
  source_url: string;
  last_scraped?: string;
  template_hash?: string;
  template_size?: number;
}

const WordPressTemplateManager: React.FC = () => {
  const [templateStatus, setTemplateStatus] = useState<TemplateStatus | null>(null);
  const [sourceUrl, setSourceUrl] = useState('https://cruisemadeeasy.com/cruise-planning/');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadTemplateStatus();
  }, []);

  const loadTemplateStatus = async () => {
    try {
      const response = await fetch('/api/template/status', {
        credentials: 'include'
      });
      const data = await response.json();
      setTemplateStatus(data);
    } catch (error) {
      console.error('Failed to load template status:', error);
    }
  };

  const refreshTemplate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/template/refresh', {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        showMessage('success', 'WordPress template refreshed successfully!');
        await loadTemplateStatus();
      } else {
        showMessage('error', data.message || 'Failed to refresh template');
      }
    } catch (error) {
      showMessage('error', 'Failed to refresh template');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    if (!confirm('Are you sure you want to clear the template cache? The next page load will fetch a fresh template.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/template/cache', {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        showMessage('success', 'Template cache cleared successfully!');
        await loadTemplateStatus();
      } else {
        showMessage('error', data.message || 'Failed to clear cache');
      }
    } catch (error) {
      showMessage('error', 'Failed to clear cache');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatSize = (bytes: number) => {
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
  };

  return (
    <div className="setting-group">
      <h4>WordPress Template Management</h4>
      
      {message && (
        <div className={`message ${message.type}`} style={{ marginBottom: '1rem' }}>
          {message.text}
          <button onClick={() => setMessage(null)} className="message-close">×</button>
        </div>
      )}

      <div className="form-section">
        <h5>Template Source</h5>
        <div className="form-row">
          <label>WordPress Source URL:</label>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://cruisemadeeasy.com/cruise-planning/"
            disabled // For now, keep this fixed - can be made editable later
            style={{ backgroundColor: '#f5f5f5' }}
          />
          <small>
            The WordPress page to use as the template. This page's layout, header, navigation, 
            and footer will be preserved while the blog content is dynamically replaced.
          </small>
        </div>
      </div>

      <div className="form-section">
        <h5>Current Template Status</h5>
        {templateStatus ? (
          <div className="template-status">
            <div className="status-row">
              <span className="status-label">Status:</span>
              <span className={`status-value ${templateStatus.cached ? 'cached' : 'no-cache'}`}>
                {templateStatus.cached ? '✅ Cached' : '❌ Not Cached'}
              </span>
            </div>
            
            {templateStatus.cached && (
              <>
                <div className="status-row">
                  <span className="status-label">Last Scraped:</span>
                  <span className="status-value">
                    {templateStatus.last_scraped ? formatDate(templateStatus.last_scraped) : 'Unknown'}
                  </span>
                </div>
                
                <div className="status-row">
                  <span className="status-label">Template Size:</span>
                  <span className="status-value">
                    {templateStatus.template_size ? formatSize(templateStatus.template_size) : 'Unknown'}
                  </span>
                </div>
                
                <div className="status-row">
                  <span className="status-label">Template Hash:</span>
                  <span className="status-value" style={{ fontFamily: 'monospace', fontSize: '0.8em' }}>
                    {templateStatus.template_hash ? templateStatus.template_hash.substring(0, 16) + '...' : 'Unknown'}
                  </span>
                </div>
              </>
            )}
            
            <div className="status-row">
              <span className="status-label">Source URL:</span>
              <span className="status-value">
                <a href={templateStatus.source_url} target="_blank" rel="noopener noreferrer">
                  {templateStatus.source_url}
                </a>
              </span>
            </div>
          </div>
        ) : (
          <div className="loading">Loading template status...</div>
        )}
      </div>

      <div className="form-section">
        <h5>Template Actions</h5>
        <div className="template-actions">
          <button
            onClick={refreshTemplate}
            disabled={loading}
            className="btn btn-primary"
            title="Manually fetch fresh template from WordPress source"
          >
            {loading ? '🔄 Refreshing...' : '🔄 Refresh Template'}
          </button>
          
          <button
            onClick={clearCache}
            disabled={loading}
            className="btn btn-secondary"
            title="Clear cached template - next page load will fetch fresh"
          >
            {loading ? 'Clearing...' : '🗑️ Clear Cache'}
          </button>
        </div>
        
        <div className="template-help">
          <h6>How it works:</h6>
          <ul>
            <li><strong>Refresh Template:</strong> Manually scrape the WordPress source page to update the cached template with any design/layout changes.</li>
            <li><strong>Clear Cache:</strong> Remove the cached template. The next blog page load will automatically fetch a fresh template.</li>
            <li><strong>Manual Control:</strong> Templates are never automatically refreshed. You have full control over when updates happen.</li>
            <li><strong>WordPress Integration:</strong> The complete WordPress page structure (header, navigation, footer, styling) is preserved while blog content is dynamically inserted.</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .template-status {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 1rem;
          margin: 0.5rem 0;
        }
        
        .status-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .status-row:last-child {
          margin-bottom: 0;
        }
        
        .status-label {
          font-weight: 600;
          color: #495057;
        }
        
        .status-value {
          color: #212529;
        }
        
        .status-value.cached {
          color: #28a745;
          font-weight: 600;
        }
        
        .status-value.no-cache {
          color: #dc3545;
          font-weight: 600;
        }
        
        .template-actions {
          display: flex;
          gap: 1rem;
          margin: 1rem 0;
        }
        
        .template-help {
          background: #e7f3ff;
          border: 1px solid #b8daff;
          border-radius: 4px;
          padding: 1rem;
          margin-top: 1rem;
        }
        
        .template-help h6 {
          margin-top: 0;
          margin-bottom: 0.5rem;
          color: #0056b3;
        }
        
        .template-help ul {
          margin-bottom: 0;
          padding-left: 1.2rem;
        }
        
        .template-help li {
          margin-bottom: 0.25rem;
          font-size: 0.9rem;
        }
        
        .message {
          padding: 0.75rem 1rem;
          border-radius: 4px;
          position: relative;
        }
        
        .message.success {
          background-color: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
        }
        
        .message.error {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }
        
        .message-close {
          background: none;
          border: none;
          position: absolute;
          right: 0.5rem;
          top: 0.5rem;
          font-size: 1.2rem;
          cursor: pointer;
          color: inherit;
        }
      `}</style>
    </div>
  );
};

export default WordPressTemplateManager;