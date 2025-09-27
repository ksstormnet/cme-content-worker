// Image Manager Component
// R2-integrated image management for the new images table structure

import React, { useState, useEffect } from 'react';
import './ImageManager.css';

interface ImageVariants {
  original: string;
  thumbnail: string;
  social: string;
  responsive: {
    small: string;
    medium: string;
    large: string;
  };
  webp?: {
    original: string;
    thumbnail: string;
    social: string;
  };
}

interface ImageFile {
  id: string;
  filename: string;
  original_filename: string;
  r2_key: string;
  mime_type: string;
  file_size: number;
  width?: number;
  height?: number;
  alt_text?: string;
  upload_user_id?: number;
  uploaded_by_name?: string;
  created_at: string;
  variants: ImageVariants;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface ImageManagerProps {
  user: User;
  onImageSelect?: (image: ImageFile) => void;
  selectionMode?: boolean;
  allowMultiple?: boolean;
}

const ImageManager: React.FC<ImageManagerProps> = ({
  user,
  onImageSelect,
  selectionMode = false,
  allowMultiple = false
}) => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [previewImage, setPreviewImage] = useState<ImageFile | null>(null);

  const imagesPerPage = 24;

  useEffect(() => {
    fetchImages();
  }, [currentPage, searchTerm]);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: imagesPerPage.toString(),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/media?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setImages(data.files || []);
      } else {
        throw new Error('Failed to load images');
      }
    } catch (error) {
      setError('Failed to load images');
      console.error('Images fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('alt_text', ''); // Can be edited later

    try {
      setLoading(true);
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setImages(prev => [data.image, ...prev]);
        setShowUpload(false);
        // Reset file input
        event.target.value = '';
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Upload failed');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (image: ImageFile) => {
    if (selectionMode) {
      if (allowMultiple) {
        setSelectedImages(prev => 
          prev.includes(image.id) 
            ? prev.filter(id => id !== image.id)
            : [...prev, image.id]
        );
      } else {
        onImageSelect?.(image);
      }
    } else {
      setPreviewImage(image);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/media/${imageId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setImages(prev => prev.filter(img => img.id !== imageId));
        setPreviewImage(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Delete failed');
      }
    } catch (error) {
      alert('Delete failed. Please try again.');
      console.error('Delete error:', error);
    }
  };

  const handleUpdateAltText = async (imageId: string, altText: string) => {
    try {
      const response = await fetch(`/api/media/${imageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alt_text: altText }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setImages(prev => prev.map(img => 
          img.id === imageId ? data.image : img
        ));
        if (previewImage?.id === imageId) {
          setPreviewImage(data.image);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Update failed');
      }
    } catch (error) {
      alert('Update failed. Please try again.');
      console.error('Update error:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredImages = images.filter(image =>
    searchTerm === '' ||
    image.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    image.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    image.alt_text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="image-manager">
      {/* Header */}
      <div className="image-manager-header">
        <div className="header-title">
          <h2>Image Manager</h2>
          <span className="image-count">{filteredImages.length} images</span>
        </div>
        <div className="header-actions">
          <button 
            className="btn-upload"
            onClick={() => setShowUpload(!showUpload)}
          >
            📤 Upload Image
          </button>
        </div>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="upload-section">
          <div className="upload-area">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="file-input"
            />
            <p className="upload-help">
              Select an image file (max 10MB). Supported formats: JPG, PNG, GIF, WebP, AVIF
            </p>
          </div>
        </div>
      )}

      {/* Search and Controls */}
      <div className="image-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search images..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="btn-clear-search"
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Images Grid */}
      <div className="images-content">
        {loading && <div className="loading">Loading images...</div>}
        
        {error && (
          <div className="error">
            {error}
            <button onClick={fetchImages}>Retry</button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="images-grid">
              {filteredImages.map(image => (
                <div 
                  key={image.id} 
                  className={`image-thumbnail ${selectedImages.includes(image.id) ? 'selected' : ''}`}
                  onClick={() => handleImageSelect(image)}
                >
                  {selectionMode && (
                    <div className="selection-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedImages.includes(image.id)}
                        onChange={() => handleImageSelect(image)}
                      />
                    </div>
                  )}
                  
                  <div className="thumbnail-image">
                    <img 
                      src={image.variants.thumbnail} 
                      alt={image.alt_text || image.filename}
                      loading="lazy"
                    />
                  </div>
                  
                  <div className="thumbnail-info">
                    <div className="filename" title={image.original_filename}>
                      {image.original_filename}
                    </div>
                    <div className="image-meta">
                      <span>{formatFileSize(image.file_size)}</span>
                      {image.width && image.height && (
                        <span>{image.width} × {image.height}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredImages.length === 0 && !loading && (
              <div className="no-images">
                {searchTerm ? 'No images match your search.' : 'No images uploaded yet.'}
              </div>
            )}
          </>
        )}
      </div>

      {/* Selection Actions */}
      {selectionMode && allowMultiple && selectedImages.length > 0 && (
        <div className="selection-actions">
          <div className="selected-count">
            {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
          </div>
          <button 
            className="btn-use-selected"
            onClick={() => {
              const selectedImagesData = images.filter(img => selectedImages.includes(img.id));
              onImageSelect?.(selectedImagesData as any);
            }}
          >
            Use Selected
          </button>
          <button 
            className="btn-clear-selection"
            onClick={() => setSelectedImages([])}
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <ImagePreviewModal
          image={previewImage}
          onClose={() => setPreviewImage(null)}
          onDelete={handleDeleteImage}
          onUpdateAltText={handleUpdateAltText}
          canDelete={user.role === 'admin' || user.id === previewImage.upload_user_id}
        />
      )}
    </div>
  );
};

// Image Preview Modal Component
interface ImagePreviewModalProps {
  image: ImageFile;
  onClose: () => void;
  onDelete: (imageId: string) => void;
  onUpdateAltText: (imageId: string, altText: string) => void;
  canDelete: boolean;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  image,
  onClose,
  onDelete,
  onUpdateAltText,
  canDelete
}) => {
  const [altText, setAltText] = useState(image.alt_text || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveAltText = () => {
    onUpdateAltText(image.id, altText);
    setIsEditing(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="image-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Image Details</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="preview-image">
            <img 
              src={image.variants.original} 
              alt={image.alt_text || image.filename}
              style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
            />
          </div>

          <div className="image-details">
            <div className="detail-row">
              <strong>Filename:</strong> {image.original_filename}
            </div>
            <div className="detail-row">
              <strong>File Size:</strong> {formatFileSize(image.file_size)}
            </div>
            {image.width && image.height && (
              <div className="detail-row">
                <strong>Dimensions:</strong> {image.width} × {image.height}px
              </div>
            )}
            <div className="detail-row">
              <strong>Uploaded:</strong> {new Date(image.created_at).toLocaleDateString()}
            </div>
            {image.uploaded_by_name && (
              <div className="detail-row">
                <strong>Uploaded by:</strong> {image.uploaded_by_name}
              </div>
            )}
            
            <div className="detail-row alt-text-row">
              <strong>Alt Text:</strong>
              {isEditing ? (
                <div className="alt-text-edit">
                  <input
                    type="text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Describe this image for accessibility"
                  />
                  <button onClick={handleSaveAltText}>Save</button>
                  <button onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
              ) : (
                <div className="alt-text-display">
                  <span>{image.alt_text || 'No alt text'}</span>
                  <button onClick={() => setIsEditing(true)}>Edit</button>
                </div>
              )}
            </div>

            <div className="detail-row">
              <strong>Available Variants:</strong>
              <div className="variants-list">
                <a href={image.variants.original} target="_blank" rel="noopener noreferrer">
                  Original
                </a>
                <a href={image.variants.thumbnail} target="_blank" rel="noopener noreferrer">
                  Thumbnail (150x150)
                </a>
                <a href={image.variants.social} target="_blank" rel="noopener noreferrer">
                  Social Media (1024x768)
                </a>
                <a href={image.variants.responsive.small} target="_blank" rel="noopener noreferrer">
                  Small (320w)
                </a>
                <a href={image.variants.responsive.medium} target="_blank" rel="noopener noreferrer">
                  Medium (768w)
                </a>
                <a href={image.variants.responsive.large} target="_blank" rel="noopener noreferrer">
                  Large (1200w)
                </a>
                {image.variants.webp && (
                  <>
                    <a href={image.variants.webp.original} target="_blank" rel="noopener noreferrer">
                      WebP Original
                    </a>
                    <a href={image.variants.webp.thumbnail} target="_blank" rel="noopener noreferrer">
                      WebP Thumbnail
                    </a>
                    <a href={image.variants.webp.social} target="_blank" rel="noopener noreferrer">
                      WebP Social
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          {canDelete && (
            <button 
              className="btn-delete-image"
              onClick={() => onDelete(image.id)}
            >
              Delete Image
            </button>
          )}
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ImageManager;