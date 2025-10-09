import React from 'react';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  isDirty: boolean;
  status?: 'draft' | 'scheduled' | 'published';
}

const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  isSaving,
  lastSaved,
  isDirty,
  status
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="auto-save-indicator">
      {isSaving && (
        <span className="save-status saving">
          <span className="spinner"></span>
          Saving...
        </span>
      )}
      {!isSaving && lastSaved && !isDirty && (
        <span className="save-status saved">
          ✓ Saved at {formatTime(lastSaved)}
        </span>
      )}
      {!isSaving && isDirty && status === 'published' && (
        <span className="save-status unsaved-published">
          ⚠ Published - Manual save required
        </span>
      )}
      {!isSaving && isDirty && status !== 'published' && (
        <span className="save-status unsaved">
          • Auto-saving...
        </span>
      )}
    </div>
  );
};

export default AutoSaveIndicator;
