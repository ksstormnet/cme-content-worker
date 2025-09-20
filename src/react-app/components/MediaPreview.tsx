import React, { useState, useEffect } from 'react';

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

interface MediaPreviewProps {
  file: MediaFile | null;
  isOpen: boolean;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  showNavigation?: boolean;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({
  file,
  isOpen,
  onClose,
  onPrevious,
  onNext,
  showNavigation = false
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProxyUrl = (originalUrl: string): string => {
    // Convert CDN URL to proxy URL to bypass CORS issues
    if (originalUrl.includes('cdn.cruisemadeeasy.com/')) {
      const path = originalUrl.split('cdn.cruisemadeeasy.com/')[1];
      return `/api/media/proxy/${path}`;
    }
    return originalUrl;
  };

  useEffect(() => {
    if (isOpen && file) {
      setLoading(true);
      setError(null);
      
      // For images, we can preload to check if they exist
      if (file.file_type === 'image') {
        const img = new Image();
        img.onload = () => setLoading(false);
        img.onerror = () => {
          setError('Failed to load image');
          setLoading(false);
        };
        img.src = getProxyUrl(file.file_url);
      } else {
        setLoading(false);
      }
    }
  }, [isOpen, file]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        if (onPrevious) onPrevious();
        break;
      case 'ArrowRight':
        if (onNext) onNext();
        break;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderPreviewContent = () => {
    if (!file) return null;

    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-96 text-red-500">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <div>{error}</div>
          </div>
        </div>
      );
    }

    switch (file.file_type) {
      case 'image':
        return (
          <div className="flex items-center justify-center max-h-[70vh] overflow-hidden">
            <img
              src={getProxyUrl(file.file_url)}
              alt={file.alt_text || file.title}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              style={{ maxHeight: '70vh' }}
            />
          </div>
        );

      case 'video':
        return (
          <div className="flex items-center justify-center">
            <video
              src={getProxyUrl(file.file_url)}
              controls
              className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
              preload="metadata"
            >
              <p className="text-gray-500">
                Your browser doesn't support HTML video. 
                <a href={file.file_url} className="text-blue-500 hover:underline ml-1">
                  Download the file
                </a>
              </p>
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-8xl mb-6">🎵</div>
            <h3 className="text-xl font-semibold mb-4">{file.title}</h3>
            <audio
              src={getProxyUrl(file.file_url)}
              controls
              className="w-full max-w-md"
              preload="metadata"
            >
              <p className="text-gray-500">
                Your browser doesn't support HTML audio.
                <a href={file.file_url} className="text-blue-500 hover:underline ml-1">
                  Download the file
                </a>
              </p>
            </audio>
          </div>
        );

      case 'document':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-8xl mb-6">
              {file.mime_type === 'application/pdf' ? '📄' : '📝'}
            </div>
            <h3 className="text-xl font-semibold mb-4">{file.title}</h3>
            <p className="text-gray-600 mb-6">Document preview not available</p>
            <div className="flex gap-4">
              <a
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                View Document
              </a>
              <a
                href={file.file_url}
                download={file.original_filename}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Download
              </a>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-8xl mb-6">📁</div>
            <h3 className="text-xl font-semibold mb-4">{file.title}</h3>
            <p className="text-gray-600 mb-6">Preview not available for this file type</p>
            <div className="flex gap-4">
              <a
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Open File
              </a>
              <a
                href={file.file_url}
                download={file.original_filename}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Download
              </a>
            </div>
          </div>
        );
    }
  };

  if (!isOpen || !file) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl max-h-[95vh] w-full mx-4 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {file.title}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {file.file_type.toUpperCase()}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {showNavigation && onPrevious && (
              <button
                onClick={onPrevious}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Previous (←)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            {showNavigation && onNext && (
              <button
                onClick={onNext}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Next (→)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            
            <button
              onClick={onClose}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Close (Esc)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-4">
          {renderPreviewContent()}
        </div>

        {/* Footer - File Details */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">File Name:</span>
              <p className="text-gray-600 dark:text-gray-400 truncate" title={file.original_filename}>
                {file.original_filename}
              </p>
            </div>
            
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">File Size:</span>
              <p className="text-gray-600 dark:text-gray-400">{formatFileSize(file.file_size)}</p>
            </div>
            
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Category:</span>
              <p className="text-gray-600 dark:text-gray-400">{file.category_name || 'General'}</p>
            </div>
            
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Upload Date:</span>
              <p className="text-gray-600 dark:text-gray-400">{formatDate(file.upload_date)}</p>
            </div>

            {file.width && file.height && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Dimensions:</span>
                <p className="text-gray-600 dark:text-gray-400">{file.width} × {file.height}px</p>
              </div>
            )}
            
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">MIME Type:</span>
              <p className="text-gray-600 dark:text-gray-400">{file.mime_type}</p>
            </div>
            
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">File URL:</span>
              <a 
                href={file.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline truncate block"
                title={file.file_url}
              >
                View Direct Link
              </a>
            </div>

            {file.caption && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Caption:</span>
                <p className="text-gray-600 dark:text-gray-400">{file.caption}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPreview;