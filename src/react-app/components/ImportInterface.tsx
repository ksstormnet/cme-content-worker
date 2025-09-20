import React, { useState, useEffect } from 'react';
import './ImportInterface.css';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface ImportInterfaceProps {
  user: User;
  onContentImported: () => void;
}

interface ImportValidation {
  content_plans: {
    total: number;
    valid: number;
    invalid: number;
    errors: string[];
  };
  articles: {
    total: number;
    valid: number;
    invalid: number;
    errors: string[];
  };
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors?: string[];
}

const ImportInterface: React.FC<ImportInterfaceProps> = ({ user, onContentImported }) => {
  const [importType, setImportType] = useState<'content-plans' | 'articles' | 'both'>('both');
  const [validation, setValidation] = useState<ImportValidation | null>(null);
  const [importing, setImporting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<{
    contentPlans?: ImportResult;
    articles?: ImportResult;
  } | null>(null);
  const [importData, setImportData] = useState<any>(null);
  const [step, setStep] = useState<'prepare' | 'validate' | 'import' | 'complete'>('prepare');

  // Load real import data on component mount
  useEffect(() => {
    const loadImportData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/import-data.json');
        if (response.ok) {
          const data = await response.json();
          setImportData(data);
          console.log(`Loaded import data: ${data.metadata.content_plans_count} content plans, ${data.metadata.articles_count} articles`);
        } else {
          throw new Error('Failed to load import data');
        }
      } catch (error) {
        console.error('Error loading import data:', error);
        setError('Failed to load import data. Please ensure content has been scanned.');
      } finally {
        setLoading(false);
      }
    };

    loadImportData();
  }, []);

  const handleValidate = async () => {
    if (!importData) {
      setError('Import data not loaded');
      return;
    }
    
    setValidating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/import/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(importData)
      });

      if (response.ok) {
        const data = await response.json();
        setValidation(data.data);
        setStep('validate');
      } else {
        throw new Error('Failed to validate import data');
      }
    } catch (error) {
      console.error('Validation error:', error);
      setError('Failed to validate import data');
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (!importData) {
      setError('Import data not loaded');
      return;
    }
    
    setImporting(true);
    setError(null);
    const results: typeof importResults = {};

    try {
      // Import content plans if requested
      if (importType === 'content-plans' || importType === 'both') {
        const response = await fetch('/api/import/content-plans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            content_plans_data: importData.content_plans_data
          })
        });

        if (response.ok) {
          const data = await response.json();
          results.contentPlans = data.data;
        } else {
          throw new Error('Failed to import content plans');
        }
      }

      // Import articles if requested
      if (importType === 'articles' || importType === 'both') {
        const response = await fetch('/api/import/articles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            articles_data: importData.articles_data
          })
        });

        if (response.ok) {
          const data = await response.json();
          results.articles = data.data;
        } else {
          throw new Error('Failed to import articles');
        }
      }

      setImportResults(results);
      setStep('complete');
      onContentImported(); // Refresh the parent component
    } catch (error) {
      console.error('Import error:', error);
      setError('Failed to import content');
    } finally {
      setImporting(false);
    }
  };

  const handleStartOver = () => {
    setStep('prepare');
    setValidation(null);
    setImportResults(null);
    setError(null);
    setImportType('both');
  };

  if (step === 'complete') {
    return (
      <div className="import-interface">
        <div className="import-header">
          <h2>Import Complete! 🎉</h2>
          <p>Your content has been successfully imported into the system.</p>
        </div>

        <div className="import-results">
          {importResults?.contentPlans && (
            <div className="result-section">
              <h3>📅 Content Plans</h3>
              <div className="result-stats">
                <span className="stat-item success">
                  {importResults.contentPlans.imported} imported
                </span>
                {importResults.contentPlans.skipped > 0 && (
                  <span className="stat-item warning">
                    {importResults.contentPlans.skipped} skipped
                  </span>
                )}
              </div>
              {importResults.contentPlans.errors && importResults.contentPlans.errors.length > 0 && (
                <div className="result-errors">
                  <h4>Errors:</h4>
                  <ul>
                    {importResults.contentPlans.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {importResults?.articles && (
            <div className="result-section">
              <h3>📄 Articles</h3>
              <div className="result-stats">
                <span className="stat-item success">
                  {importResults.articles.imported} imported
                </span>
                {importResults.articles.skipped > 0 && (
                  <span className="stat-item warning">
                    {importResults.articles.skipped} skipped
                  </span>
                )}
              </div>
              {importResults.articles.errors && importResults.articles.errors.length > 0 && (
                <div className="result-errors">
                  <h4>Errors:</h4>
                  <ul>
                    {importResults.articles.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="import-actions">
          <button
            type="button"
            onClick={handleStartOver}
            className="btn btn-secondary"
          >
            Import More Content
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="import-interface">
        <div className="import-header">
          <h2>Import Existing Content</h2>
          <p>Loading import data...</p>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading-spinner">📁</div>
          <p>Scanning content files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="import-interface">
      <div className="import-header">
        <h2>Import Existing Content</h2>
        <p>
          Import your weekly content plans and completed articles from the existing CME content system.
          {importData && (
            <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              📊 Ready to import: {importData.metadata.content_plans_count} content plans, {importData.metadata.articles_count} articles
              ({importData.metadata.date_range.start} to {importData.metadata.date_range.end})
            </span>
          )}
        </p>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️</span>
          {error}
        </div>
      )}

      {step === 'prepare' && (
        <div className="import-step">
          <h3>Step 1: Prepare Import</h3>
          <p>Choose what type of content to import:</p>

          <div className="import-options">
            <label className="option-card">
              <input
                type="radio"
                name="importType"
                value="content-plans"
                checked={importType === 'content-plans'}
                onChange={(e) => setImportType(e.target.value as any)}
              />
              <div className="option-content">
                <span className="option-icon">📅</span>
                <div>
                  <strong>Content Plans Only</strong>
                  <p>Import 52 weekly content plans for the content calendar</p>
                </div>
              </div>
            </label>

            <label className="option-card">
              <input
                type="radio"
                name="importType"
                value="articles"
                checked={importType === 'articles'}
                onChange={(e) => setImportType(e.target.value as any)}
              />
              <div className="option-content">
                <span className="option-icon">📄</span>
                <div>
                  <strong>Articles Only</strong>
                  <p>Import completed articles into the post system</p>
                </div>
              </div>
            </label>

            <label className="option-card">
              <input
                type="radio"
                name="importType"
                value="both"
                checked={importType === 'both'}
                onChange={(e) => setImportType(e.target.value as any)}
              />
              <div className="option-content">
                <span className="option-icon">📦</span>
                <div>
                  <strong>Everything</strong>
                  <p>Import both content plans and completed articles</p>
                </div>
              </div>
            </label>
          </div>

          <div className="step-actions">
            <button
              type="button"
              onClick={handleValidate}
              disabled={validating}
              className="btn btn-primary"
            >
              {validating ? '🔍 Validating...' : '🔍 Validate & Preview'}
            </button>
          </div>
        </div>
      )}

      {step === 'validate' && validation && (
        <div className="import-step">
          <h3>Step 2: Validation Results</h3>
          <p>Review the validation results before importing:</p>

          <div className="validation-results">
            {(importType === 'content-plans' || importType === 'both') && (
              <div className="validation-section">
                <h4>📅 Content Plans</h4>
                <div className="validation-stats">
                  <span className="stat-item">{validation.content_plans.total} total</span>
                  <span className="stat-item success">{validation.content_plans.valid} valid</span>
                  {validation.content_plans.invalid > 0 && (
                    <span className="stat-item error">{validation.content_plans.invalid} invalid</span>
                  )}
                </div>
                {validation.content_plans.errors.length > 0 && (
                  <div className="validation-errors">
                    <strong>Issues found:</strong>
                    <ul>
                      {validation.content_plans.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {(importType === 'articles' || importType === 'both') && (
              <div className="validation-section">
                <h4>📄 Articles</h4>
                <div className="validation-stats">
                  <span className="stat-item">{validation.articles.total} total</span>
                  <span className="stat-item success">{validation.articles.valid} valid</span>
                  {validation.articles.invalid > 0 && (
                    <span className="stat-item error">{validation.articles.invalid} invalid</span>
                  )}
                </div>
                {validation.articles.errors.length > 0 && (
                  <div className="validation-errors">
                    <strong>Issues found:</strong>
                    <ul>
                      {validation.articles.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="step-actions">
            <button
              type="button"
              onClick={() => setStep('prepare')}
              className="btn btn-secondary"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || (validation.content_plans.valid === 0 && validation.articles.valid === 0)}
              className="btn btn-primary"
            >
              {importing ? '📥 Importing...' : '📥 Start Import'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportInterface;