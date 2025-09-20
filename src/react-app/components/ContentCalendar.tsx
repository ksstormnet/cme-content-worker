import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import './ContentCalendar.css';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface ContentCalendar {
  id: number;
  week_start_date: string;
  year: number;
  week_number: number;
  status: 'draft' | 'approved' | 'published';
  themes: string[];
  seasonal_hooks: string[];
  milestone_hooks: string[];
  notes?: string;
  created_by_name: string;
  created_at: string;
}

interface ContentCalendarProps {
  user: User;
}

const ContentCalendar: React.FC<ContentCalendarProps> = ({ user }) => {
  const [calendars, setCalendars] = useState<ContentCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<ContentCalendar | null>(null);

  useEffect(() => {
    loadCalendars();
  }, [selectedYear]);

  const loadCalendars = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/calendar?year=${selectedYear}&limit=52`, {
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        setCalendars(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to load calendars');
      }
    } catch (error) {
      console.error('Calendar load error:', error);
      setError('Network error loading calendars');
    } finally {
      setLoading(false);
    }
  };

  const createYearlyCalendar = async () => {
    try {
      setLoading(true);
      const startOfYear = new Date(selectedYear, 0, 1);
      // Find first Monday of the year
      const firstMonday = new Date(startOfYear);
      firstMonday.setDate(startOfYear.getDate() + (1 - startOfYear.getDay() + 7) % 7);

      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          year: selectedYear,
          start_date: firstMonday.toISOString().split('T')[0]
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowCreateForm(false);
        await loadCalendars();
      } else {
        setError(data.error || 'Failed to create calendar');
      }
    } catch (error) {
      console.error('Calendar creation error:', error);
      setError('Network error creating calendar');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#6b7280';
      case 'approved': return '#10b981';
      case 'published': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return '📝';
      case 'approved': return '✅';
      case 'published': return '🚀';
      default: return '❓';
    }
  };

  const formatWeekRange = (startDate: string) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    return `${start.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })} - ${end.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })}`;
  };

  if (loading && calendars.length === 0) {
    return (
      <div className="content-calendar">
        <LoadingSpinner />
        <p>Loading content calendar...</p>
      </div>
    );
  }

  return (
    <div className="content-calendar">
      <div className="calendar-header">
        <div className="header-controls">
          <h2>📅 Content Calendar</h2>
          <div className="year-controls">
            <label htmlFor="year-select">Year:</label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="year-select"
            >
              {[2024, 2025, 2026, 2027].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {calendars.length === 0 && !loading && (
          <div className="empty-calendar">
            <p>No content calendar found for {selectedYear}</p>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              Create {selectedYear} Calendar
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="create-calendar-modal">
          <div className="modal-content">
            <h3>Create {selectedYear} Content Calendar</h3>
            <p>
              This will create a 52-week content calendar starting from the first Monday of {selectedYear}.
              Each week will have structure for Monday, Wednesday, Friday, Saturday posts and Sunday newsletter.
            </p>
            <div className="modal-actions">
              <button onClick={createYearlyCalendar} className="btn btn-primary">
                Create Calendar
              </button>
              <button 
                onClick={() => setShowCreateForm(false)} 
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {calendars.length > 0 && (
        <>
          <div className="calendar-stats">
            <div className="stat-card">
              <h4>Total Weeks</h4>
              <p>{calendars.length}</p>
            </div>
            <div className="stat-card">
              <h4>Draft</h4>
              <p>{calendars.filter(c => c.status === 'draft').length}</p>
            </div>
            <div className="stat-card">
              <h4>Approved</h4>
              <p>{calendars.filter(c => c.status === 'approved').length}</p>
            </div>
            <div className="stat-card">
              <h4>Published</h4>
              <p>{calendars.filter(c => c.status === 'published').length}</p>
            </div>
          </div>

          <div className="calendar-grid">
            {calendars.map((calendar) => (
              <div 
                key={calendar.id} 
                className={`calendar-week ${selectedWeek?.id === calendar.id ? 'selected' : ''}`}
                onClick={() => setSelectedWeek(calendar)}
              >
                <div className="week-header">
                  <div className="week-title">
                    <h4>{formatWeekRange(calendar.week_start_date)}</h4>
                  </div>
                  <div className="week-status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(calendar.status) }}
                    >
                      {getStatusIcon(calendar.status)} {calendar.status}
                    </span>
                  </div>
                </div>

                <div className="week-themes">
                  {calendar.themes && calendar.themes.length > 0 ? (
                    <div className="themes-list">
                      <strong>Themes:</strong>
                      <ul>
                        {calendar.themes.slice(0, 3).map((theme, index) => (
                          <li key={index}>{theme}</li>
                        ))}
                        {calendar.themes.length > 3 && (
                          <li>+{calendar.themes.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  ) : (
                    <p className="no-themes">No themes assigned</p>
                  )}
                </div>

                <div className="week-hooks">
                  {calendar.seasonal_hooks && calendar.seasonal_hooks.length > 0 && (
                    <div className="hooks-summary">
                      <strong>Hooks:</strong> {calendar.seasonal_hooks.length} seasonal, {calendar.milestone_hooks?.length || 0} milestone
                    </div>
                  )}
                </div>

                <div className="week-actions">
                  <button 
                    className="btn btn-small btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/create/generate`;
                    }}
                  >
                    Generate Content
                  </button>
                  <button 
                    className="btn btn-small btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/create/`;
                    }}
                  >
                    View Posts
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedWeek && (
        <div className="week-details-sidebar">
          <div className="sidebar-header">
            <h3>{formatWeekRange(selectedWeek.week_start_date)} Details</h3>
            <button 
              onClick={() => setSelectedWeek(null)}
              className="close-sidebar"
            >
              ✕
            </button>
          </div>

          <div className="sidebar-content">
            <div className="detail-section">
              <h4>📅 Date Range</h4>
              <p>{formatWeekRange(selectedWeek.week_start_date)}</p>
            </div>

            <div className="detail-section">
              <h4>🎯 Themes</h4>
              {selectedWeek.themes && selectedWeek.themes.length > 0 ? (
                <ul>
                  {selectedWeek.themes.map((theme, index) => (
                    <li key={index}>{theme}</li>
                  ))}
                </ul>
              ) : (
                <p className="empty-detail">No themes assigned</p>
              )}
            </div>

            <div className="detail-section">
              <h4>🌟 Seasonal Hooks</h4>
              {selectedWeek.seasonal_hooks && selectedWeek.seasonal_hooks.length > 0 ? (
                <ul>
                  {selectedWeek.seasonal_hooks.map((hook, index) => (
                    <li key={index}>{hook}</li>
                  ))}
                </ul>
              ) : (
                <p className="empty-detail">No seasonal hooks assigned</p>
              )}
            </div>

            <div className="detail-section">
              <h4>🎉 Milestone Hooks</h4>
              {selectedWeek.milestone_hooks && selectedWeek.milestone_hooks.length > 0 ? (
                <ul>
                  {selectedWeek.milestone_hooks.map((hook, index) => (
                    <li key={index}>{hook}</li>
                  ))}
                </ul>
              ) : (
                <p className="empty-detail">No milestone hooks assigned</p>
              )}
            </div>

            {selectedWeek.notes && (
              <div className="detail-section">
                <h4>📝 Notes</h4>
                <p>{selectedWeek.notes}</p>
              </div>
            )}

            <div className="sidebar-actions">
              <button 
                onClick={() => window.location.href = `/create/generate`}
                className="btn btn-primary full-width"
              >
                Generate Content
              </button>
              <button 
                onClick={() => window.location.href = `/create/`}
                className="btn btn-secondary full-width"
              >
                View All Posts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentCalendar;