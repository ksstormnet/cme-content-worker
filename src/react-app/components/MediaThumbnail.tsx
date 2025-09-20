import React, { useState } from 'react';

interface MediaFile {
  id: number;
  filename: string;
  original_filename: string;
  title: string;
  file_path: string;
  file_url: string;
  file_type: 'image' | 'video' | 'audio' | 'document' | 'file';
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  alt_text?: string;
  caption?: string;
  category_id: number;
  category_name?: string;
  uploaded_by: number;
  upload_date: string;
}

interface MediaThumbnailProps {
  file: MediaFile;
  onClick?: () => void;
  onSelect?: (file: MediaFile) => void;
  isSelected?: boolean;
  showSelection?: boolean;
  className?: string;
}

const MediaThumbnail: React.FC<MediaThumbnailProps> = ({
  file,
  onClick,
  onSelect,
  isSelected = false,
  showSelection = false,
  className = ""
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string, fileType: string): string => {
    // Handle specific MIME types and file types
    switch (mimeType) {
      case 'application/pdf':
        return '📄';
      case 'text/markdown':
        return '📝';
      case 'image/svg+xml':
        return '🖼️';
      case 'image/jpeg':
      case 'image/jpg':
      case 'image/png':
      case 'image/avif':
      case 'image/webp':
      case 'image/gif':
        return '🖼️';
      case 'video/mp4':
      case 'video/webm':
      case 'video/avi':
      case 'video/quicktime':
        return '🎬';
      case 'audio/mpeg':
      case 'audio/wav':
      case 'audio/ogg':
        return '🎵';
      default:
        // Fallback to file type
        switch (fileType) {
          case 'image':
            return '🖼️';
          case 'video':
            return '🎬';
          case 'audio':
            return '🎵';
          case 'document':
            return '📄';
          default:
            return '📁';
        }
    }
  };

  const canShowImageThumbnail = (mimeType: string): boolean => {
    const imageTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/avif',
      'image/webp',
      'image/gif',
      'image/svg+xml'
    ];
    return imageTypes.includes(mimeType) && !imageError;
  };

  const getProxyUrl = (originalUrl: string): string => {
    // Convert CDN URL to proxy URL to bypass CORS issues
    // Example: https://cdn.cruisemadeeasy.com/2025/02/file.jpg -> /api/media/proxy/2025/02/file.jpg
    if (originalUrl.includes('cdn.cruisemadeeasy.com/')) {
      const path = originalUrl.split('cdn.cruisemadeeasy.com/')[1];
      return `/api/media/proxy/${path}`;
    }
    return originalUrl;
  };

  const renderThumbnailContent = () => {
    if (canShowImageThumbnail(file.mime_type)) {
      return (
        <div className="relative w-full h-16 bg-gray-100 dark:bg-gray-700 overflow-hidden">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            </div>
          )}
          <img
            src={getProxyUrl(file.file_url)}
            alt={file.alt_text || file.title}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
          />
          {file.file_type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <div className="bg-black bg-opacity-70 rounded-full p-1">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Fallback to icon-based thumbnail
    return (
      <div className="w-full h-16 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <div className="text-2xl">
          {getFileIcon(file.mime_type, file.file_type)}
        </div>
      </div>
    );
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleSelectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(file);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: file.id,
      filename: file.filename,
      title: file.title,
      alt_text: file.alt_text,
      caption: file.caption,
      description: file.description || '',
      category_id: file.category_id
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
        hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 
        transition-all duration-200 cursor-pointer
        ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        ${className}
      `}
      onClick={handleClick}
      draggable
      onDragStart={handleDragStart}
    >
      {/* Thumbnail Image/Icon */}
      <div className="relative">
        {renderThumbnailContent()}
        
        {/* Selection checkbox */}
        {showSelection && (
          <div className="absolute top-2 right-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleSelectionClick}
              className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded 
                         focus:ring-blue-500 focus:ring-2"
            />
          </div>
        )}

        {/* File type badge for non-images */}
        {!canShowImageThumbnail(file.mime_type) && (
          <div className="absolute top-2 left-2">
            <span className="bg-gray-900 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
              {file.file_type.toUpperCase()}
            </span>
          </div>
        )}
      </div>

    </div>
  );
};

export default MediaThumbnail;