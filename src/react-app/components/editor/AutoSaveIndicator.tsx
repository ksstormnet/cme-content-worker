import React from 'react';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  isDirty: boolean;
}

const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  isSaving,
  lastSaved,
  isDirty
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
      {!isSaving && isDirty && (
        <span className="save-status unsaved">
          • Unsaved changes
        </span>
      )}
    </div>
  );
};

export default AutoSaveIndicator;
