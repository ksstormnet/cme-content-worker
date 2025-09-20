// Media Upload Component with Drag & Drop
// WordPress-style media upload with category support

import React, { useState, useCallback, useRef } from 'react';
import './MediaUpload.css';

interface MediaUploadProps {
  onUploadComplete?: (media: any) => void;
  onUploadStart?: () => void;
  onUploadProgress?: (progress: number) => void;
  defaultCategoryId?: number;
  multiple?: boolean;
  accept?: string;
  maxSize?: number; // in MB
}

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  media?: any;
  preview?: string;
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  onUploadComplete,
  onUploadStart,
  onUploadProgress,
  defaultCategoryId,
  multiple = true,
  accept = "image/*,video/*,audio/*,.pdf",
  maxSize = 10
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploads, setUploads] = useState<UploadFile[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load categories on mount
  React.useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/media/categories', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const validateFile = (file: File): string | null => {
    // Size check
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`;
    }

    // Type check
    const allowedTypes = accept.split(',').map(type => type.trim());
    const isAllowed = allowedTypes.some(type => {
      if (type === 'image/*') return file.type.startsWith('image/');
      if (type === 'video/*') return file.type.startsWith('video/');
      if (type === 'audio/*') return file.type.startsWith('audio/');
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type === type;
    });

    if (!isAllowed) {
      return `File type ${file.type} not allowed`;
    }

    return null;
  };

  const generatePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(undefined);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(file);
    });
  };

  const addFiles = async (files: File[]) => {
    const newUploads: UploadFile[] = [];

    for (const file of files) {
      const error = validateFile(file);
      const preview = await generatePreview(file);

      newUploads.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        progress: 0,
        status: error ? 'error' : 'pending',
        error,
        preview,
      });
    }

    setUploads(prev => [...prev, ...newUploads]);
  };

  const uploadFile = async (uploadFile: UploadFile, categoryId?: number) => {
    const formData = new FormData();
    formData.append('file', uploadFile.file);
    formData.append('title', uploadFile.file.name);
    formData.append('category_id', String(categoryId || defaultCategoryId || ''));

    try {
      // Update status
      setUploads(prev => prev.map(u => 
        u.id === uploadFile.id 
          ? { ...u, status: 'uploading', progress: 0 }
          : u
      ));

      onUploadStart?.();

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();

      // Update with completed status
      setUploads(prev => prev.map(u => 
        u.id === uploadFile.id 
          ? { ...u, status: 'completed', progress: 100, media: data.media }
          : u
      ));

      onUploadComplete?.(data.media);
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploads(prev => prev.map(u => 
        u.id === uploadFile.id 
          ? { ...u, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
          : u
      ));
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      addFiles(files);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      addFiles(Array.from(files));
    }
  }, []);

  const handleUploadAll = () => {
    const pendingUploads = uploads.filter(u => u.status === 'pending');
    pendingUploads.forEach(upload => uploadFile(upload));
  };

  const handleRetry = (uploadFile: UploadFile) => {
    uploadFile(uploadFile);
  };

  const handleRemove = (uploadId: string) => {
    setUploads(prev => prev.filter(u => u.id !== uploadId));
  };

  const updateCategory = (uploadId: string, categoryId: number) => {
    // For now, just trigger upload with the category
    const upload = uploads.find(u => u.id === uploadId);
    if (upload && upload.status === 'pending') {
      uploadFile(upload, categoryId);
    }
  };

  const pendingCount = uploads.filter(u => u.status === 'pending').length;
  const uploadingCount = uploads.filter(u => u.status === 'uploading').length;
  const completedCount = uploads.filter(u => u.status === 'completed').length;
  const errorCount = uploads.filter(u => u.status === 'error').length;

  return (
    <div className="media-upload">
      {/* Drop Zone */}
      <div 
        className={`upload-dropzone ${dragOver ? 'drag-over' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="dropzone-content">
          <div className="upload-icon">📁</div>
          <div className="upload-text">
            <strong>Drop files here or click to browse</strong>
            <p>Supports: Images, Videos, Audio, PDFs</p>
            <p>Max size: {maxSize}MB per file</p>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      {/* Upload Queue */}
      {uploads.length > 0 && (
        <div className="upload-queue">
          <div className="queue-header">
            <div className="queue-stats">
              <span className="stat">
                📄 {uploads.length} file{uploads.length !== 1 ? 's' : ''}
              </span>
              {completedCount > 0 && (
                <span className="stat completed">✅ {completedCount} completed</span>
              )}
              {uploadingCount > 0 && (
                <span className="stat uploading">⬆️ {uploadingCount} uploading</span>
              )}
              {errorCount > 0 && (
                <span className="stat error">❌ {errorCount} failed</span>
              )}
            </div>
            <div className="queue-actions">
              {pendingCount > 0 && (
                <button 
                  className="btn-primary"
                  onClick={handleUploadAll}
                  disabled={uploadingCount > 0}
                >
                  Upload All ({pendingCount})
                </button>
              )}
              <button 
                className="btn-secondary"
                onClick={() => setUploads([])}
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="upload-items">
            {uploads.map(upload => (
              <div key={upload.id} className={`upload-item status-${upload.status}`}>
                <div className="item-preview">
                  {upload.preview ? (
                    <img src={upload.preview} alt={upload.file.name} />
                  ) : (
                    <div className="file-icon">📄</div>
                  )}
                </div>
                
                <div className="item-details">
                  <div className="item-name">{upload.file.name}</div>
                  <div className="item-info">
                    {(upload.file.size / (1024 * 1024)).toFixed(2)} MB • {upload.file.type}
                  </div>
                  
                  {upload.status === 'pending' && (
                    <div className="item-category">
                      <select 
                        onChange={(e) => updateCategory(upload.id, parseInt(e.target.value))}
                        defaultValue={defaultCategoryId || ''}
                      >
                        <option value="">No Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {upload.status === 'uploading' && (
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  )}
                  
                  {upload.error && (
                    <div className="item-error">{upload.error}</div>
                  )}
                </div>
                
                <div className="item-actions">
                  {upload.status === 'pending' && (
                    <button 
                      className="btn-upload"
                      onClick={() => uploadFile(upload)}
                      title="Upload this file"
                    >
                      ⬆️
                    </button>
                  )}
                  {upload.status === 'error' && (
                    <button 
                      className="btn-retry"
                      onClick={() => handleRetry(upload)}
                      title="Retry upload"
                    >
                      🔄
                    </button>
                  )}
                  {upload.status === 'completed' && (
                    <div className="status-icon completed" title="Upload completed">
                      ✅
                    </div>
                  )}
                  {upload.status === 'uploading' && (
                    <div className="status-icon uploading" title="Uploading...">
                      ⬆️
                    </div>
                  )}
                  <button 
                    className="btn-remove"
                    onClick={() => handleRemove(upload.id)}
                    title="Remove from queue"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;