/**
 * MediaPicker Component
 * Modal wrapper around MediaLibrary for image selection in PostEditor
 * Phase 3: Integration between PostEditor and MediaLibrary
 */

import React, { useState } from 'react';
import MediaLibrary from '../MediaLibrary';
import './MediaPicker.css';

interface MediaFile {
  id: number;
  filename: string;
  original_filename: string;
  title: string;
  alt_text?: string;
  caption?: string;
  file_url: string;
  file_type: 'image' | 'video' | 'audio' | 'document' | 'file';
  width?: number;
  height?: number;
  thumbnails?: {
    thumbnail: string;
    medium: string;
    large: string;
    full: string;
  };
}

export interface SelectedImage {
  id: number;
  url: string;
  alt: string;
  caption?: string;
  alignment: 'left' | 'center' | 'right';
  size: 'thumbnail' | 'medium' | 'large' | 'full';
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface MediaPickerProps {
  isOpen: boolean;
  user: User;
  onSelect: (image: SelectedImage) => void;
  onClose: () => void;
  allowMultiple?: boolean;
}

const MediaPicker: React.FC<MediaPickerProps> = ({
  isOpen,
  user,
  onSelect,
  onClose,
  allowMultiple = false
}) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [size, setSize] = useState<'thumbnail' | 'medium' | 'large' | 'full'>('large');
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');

  if (!isOpen) return null;

  const handleMediaSelect = (media: MediaFile) => {
    setSelectedMedia(media);
    setAltText(media.alt_text || media.title || '');
    setCaption(media.caption || '');
  };

  const handleInsert = () => {
    if (!selectedMedia) return;

    const imageUrl = selectedMedia.file_url || selectedMedia.file_url;

    onSelect({
      id: selectedMedia.id,
      url: imageUrl,
      alt: altText || selectedMedia.alt_text || selectedMedia.title,
      caption: caption || selectedMedia.caption,
      alignment,
      size
    });

    // Reset state
    setSelectedMedia(null);
    setAlignment('center');
    setSize('large');
    setAltText('');
    setCaption('');
  };

  const handleCancel = () => {
    setSelectedMedia(null);
    setAlignment('center');
    setSize('large');
    setAltText('');
    setCaption('');
    onClose();
  };

  return (
    <div className="media-picker-overlay" onClick={handleCancel}>
      <div className="media-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="media-picker-header">
          <h2>Insert Image</h2>
          <button
            type="button"
            onClick={handleCancel}
            className="close-button"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="media-picker-body">
          <div className="media-library-wrapper">
            <MediaLibrary
              user={user}
              onMediaSelect={handleMediaSelect}
              selectionMode={true}
              allowMultiple={allowMultiple}
            />
          </div>

          {selectedMedia && (
            <div className="image-options-panel">
              <h3>Image Options</h3>

              <div className="selected-preview">
                <img
                  src={selectedMedia.thumbnails?.medium || selectedMedia.file_url}
                  alt={selectedMedia.title}
                />
                <p className="selected-title">{selectedMedia.title}</p>
              </div>

              <div className="option-group">
                <label htmlFor="image-alignment">Alignment</label>
                <select
                  id="image-alignment"
                  value={alignment}
                  onChange={(e) => setAlignment(e.target.value as 'left' | 'center' | 'right')}
                  className="option-select"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>

              <div className="option-group">
                <label htmlFor="image-size">Size</label>
                <select
                  id="image-size"
                  value={size}
                  onChange={(e) => setSize(e.target.value as 'thumbnail' | 'medium' | 'large' | 'full')}
                  className="option-select"
                >
                  <option value="thumbnail">Thumbnail (150px)</option>
                  <option value="medium">Medium (300px)</option>
                  <option value="large">Large (1024px)</option>
                  <option value="full">Full Size</option>
                </select>
              </div>

              <div className="option-group">
                <label htmlFor="alt-text">Alt Text</label>
                <input
                  id="alt-text"
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe the image for accessibility"
                  className="option-input"
                />
                <p className="option-hint">Important for accessibility and SEO</p>
              </div>

              <div className="option-group">
                <label htmlFor="caption">Caption (Optional)</label>
                <input
                  id="caption"
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Image caption"
                  className="option-input"
                />
              </div>
            </div>
          )}
        </div>

        <div className="media-picker-footer">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInsert}
            disabled={!selectedMedia}
            className="btn-primary"
          >
            Insert Image
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaPicker;
