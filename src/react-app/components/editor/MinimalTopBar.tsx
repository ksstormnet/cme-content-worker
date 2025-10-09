import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AutoSaveIndicator from './AutoSaveIndicator';
import './MinimalTopBar.css';

interface MinimalTopBarProps {
  title: string;
  onTitleChange: (title: string) => void;
  isSaving: boolean;
  lastSaved: Date | null;
  isDirty: boolean;
  onBack: () => void;
  onOpenSettings: () => void;
  sidebarCollapsed: boolean;
}

export const MinimalTopBar: React.FC<MinimalTopBarProps> = ({
  title,
  onTitleChange,
  isSaving,
  lastSaved,
  isDirty,
  onBack,
  onOpenSettings,
  sidebarCollapsed
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  return (
    <div className="minimal-top-bar">
      <Link to="/admin" className="logo-home-button" title="Back to Dashboard">
        <img
          src="https://cdn.cruisemadeeasy.com/admin/4-color-icon-transparent.png"
          alt="CME"
          className="logo-icon"
        />
      </Link>

      {isEditingTitle ? (
        <input
          type="text"
          className="title-input"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={() => setIsEditingTitle(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setIsEditingTitle(false);
          }}
          autoFocus
        />
      ) : (
        <h1
          className="post-title-display"
          onClick={() => setIsEditingTitle(true)}
          title="Click to edit title"
        >
          {title || 'Untitled Post'}
        </h1>
      )}

      <div className="top-bar-actions">
        <AutoSaveIndicator
          isSaving={isSaving}
          lastSaved={lastSaved}
          isDirty={isDirty}
        />
        <button
          className="settings-button"
          onClick={onOpenSettings}
          title="Post Settings"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="14" height="2" rx="1" fill="currentColor"/>
            <rect x="3" y="9" width="14" height="2" rx="1" fill="currentColor"/>
            <rect x="3" y="14" width="14" height="2" rx="1" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MinimalTopBar;
