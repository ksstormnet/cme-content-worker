// Media Selector Modal Component
// Reusable modal for selecting media files from the library

import React, { useState, useEffect } from 'react';
import MediaLibrary from './MediaLibrary';
import './MediaSelector.css';

interface MediaFile {
  id: number;
  filename: string;
  original_filename: string;
  title: string;
  alt_text?: string;
  caption?: string;
  description?: string;
  file_path: string;
  file_url: string;
  file_type: string;
  file_size: number;
  width?: number;
  height?: number;
  category_name?: string;
  category_color?: string;
  uploaded_by_name: string;
  upload_date: string;
  thumbnails?: {
    thumbnail: string;
    medium: string;
    large: string;
    full: string;
  };
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface MediaSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaFile | MediaFile[]) => void;
  user: User;
  allowMultiple?: boolean;
  acceptedTypes?: string[]; // ['image', 'video', 'audio', 'document']
  title?: string;
  description?: string;
  selectedMediaIds?: number[]; // Pre-selected media IDs
}

const MediaSelector: React.FC<MediaSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  user,
  allowMultiple = false,
  acceptedTypes = ['image', 'video', 'audio'],
  title = 'Select Media',
  description,
  selectedMediaIds = []
}) => {
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
  const [currentTab, setCurrentTab] = useState<'library' | 'upload'>('library');

  useEffect(() => {
    if (isOpen) {
      setSelectedFiles([]);
      setCurrentTab('library');
    }
  }, [isOpen]);

  const handleMediaSelect = (media: MediaFile | MediaFile[]) => {
    if (Array.isArray(media)) {
      // Multiple selection from library
      setSelectedFiles(media);
    } else {
      // Single selection
      if (allowMultiple) {
        setSelectedFiles(prev => {
          const exists = prev.find(f => f.id === media.id);
          if (exists) {
            // Remove if already selected
            return prev.filter(f => f.id !== media.id);
          } else {
            // Add to selection
            return [...prev, media];
          }
        });
      } else {
        // Single selection mode - select immediately
        onSelect(media);
        onClose();
      }
    }
  };

  const handleConfirmSelection = () => {
    if (selectedFiles.length > 0) {
      onSelect(allowMultiple ? selectedFiles : selectedFiles[0]);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="media-selector-overlay" onClick={handleCancel}>
      <div className="media-selector-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="selector-header">
          <div className="header-content">
            <h2>{title}</h2>
            {description && (
              <p className="header-description">{description}</p>
            )}
          </div>
          <button className="close-btn" onClick={handleCancel}>
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="selector-tabs">
          <button 
            className={`tab-btn ${currentTab === 'library' ? 'active' : ''}`}
            onClick={() => setCurrentTab('library')}
          >
            📂 Media Library
          </button>
          <button 
            className={`tab-btn ${currentTab === 'upload' ? 'active' : ''}`}
            onClick={() => setCurrentTab('upload')}
          >
            📤 Upload New
          </button>
        </div>

        {/* Content */}
        <div className="selector-content">
          {currentTab === 'library' && (
            <div className="library-tab">
              <MediaLibrary
                user={user}
                selectionMode={true}
                allowMultiple={allowMultiple}
                onMediaSelect={handleMediaSelect}
              />
            </div>
          )}

          {currentTab === 'upload' && (
            <div className="upload-tab">
              <div className="upload-content">
                <div className="upload-instructions">
                  <h3>Upload New Media</h3>
                  <p>Upload files to your media library. Once uploaded, they'll be available for selection.</p>
                  
                  {acceptedTypes.length < 4 && (
                    <div className="accepted-types">
                      <strong>Accepted types:</strong> {acceptedTypes.join(', ')}
                    </div>
                  )}
                </div>

                {/* Upload component would go here */}
                <div className="upload-placeholder">
                  <div className="placeholder-content">
                    <div className="upload-icon">📁</div>
                    <p><strong>Upload functionality</strong></p>
                    <p>This would include the MediaUpload component</p>
                    <p>Files uploaded here would automatically be selected</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected Files Preview (for multiple selection) */}
        {allowMultiple && selectedFiles.length > 0 && (
          <div className="selected-preview">
            <div className="preview-header">
              <h4>Selected Files ({selectedFiles.length})</h4>
              <button 
                className="clear-selection-btn"
                onClick={() => setSelectedFiles([])}
              >
                Clear All
              </button>
            </div>
            
            <div className="preview-files">
              {selectedFiles.map(file => (
                <div key={file.id} className="preview-file">
                  <div className="preview-thumbnail">
                    {file.file_type === 'image' && file.thumbnails ? (
                      <img 
                        src={file.thumbnails.thumbnail} 
                        alt={file.alt_text || file.title}
                      />
                    ) : (
                      <div className="file-icon">
                        {file.file_type === 'video' ? '🎥' : 
                         file.file_type === 'audio' ? '🎵' : '📄'}
                      </div>
                    )}
                  </div>
                  
                  <div className="preview-info">
                    <div className="preview-title">{file.title}</div>
                    <div className="preview-meta">
                      {formatFileSize(file.file_size)}
                      {file.width && file.height && (
                        <span> • {file.width}×{file.height}</span>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    className="remove-file-btn"
                    onClick={() => setSelectedFiles(prev => 
                      prev.filter(f => f.id !== file.id)
                    )}
                    title="Remove from selection"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="selector-footer">
          <div className="footer-info">
            {allowMultiple && (
              <span className="selection-count">
                {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          
          <div className="footer-actions">
            <button className="cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
            
            {allowMultiple ? (
              <button 
                className="select-btn"
                disabled={selectedFiles.length === 0}
                onClick={handleConfirmSelection}
              >
                Select {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
              </button>
            ) : (
              <button 
                className="select-btn" 
                disabled={true}
                title="Select a file from the library above"
              >
                Select File
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for easier usage
export const useMediaSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<Partial<MediaSelectorProps>>({});

  const openSelector = (options: Partial<MediaSelectorProps> = {}) => {
    setConfig(options);
    setIsOpen(true);
  };

  const closeSelector = () => {
    setIsOpen(false);
    setConfig({});
  };

  return {
    isOpen,
    openSelector,
    closeSelector,
    config,
  };
};

export default MediaSelector;