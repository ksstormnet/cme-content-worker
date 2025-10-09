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
          ⚙️
        </button>
      </div>
    </div>
  );
};

export default MinimalTopBar;
