// Media Library Component
// WordPress-style media library with categories, search, and grid view
// Uses shared media counting utilities for consistent deduplication

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import MediaUpload from './MediaUpload';
import MediaThumbnail from './MediaThumbnail';
import MediaPreview from './MediaPreview';
import { calculateMediaCounts, getAllDescendantCategoryIds, filterDuplicates } from '../../utils/mediaCountUtils';
import './MediaLibrary.css';

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
  file_type: 'image' | 'video' | 'audio' | 'document' | 'file';
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  category_id: number;
  category_name?: string;
  category_color?: string;
  uploaded_by: number;
  uploaded_by_name?: string;
  upload_date: string;
  tags?: string; // JSON string of tag array
  thumbnails?: {
    thumbnail: string;
    medium: string;
    large: string;
    full: string;
  };
}

interface MediaCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  file_count: number;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface MediaLibraryProps {
  user: User;
  onMediaSelect?: (media: MediaFile) => void;
  selectionMode?: boolean;
  allowMultiple?: boolean;
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({
  user,
  onMediaSelect,
  selectionMode = false,
  allowMultiple = false
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allMediaFiles, setAllMediaFiles] = useState<MediaFile[]>([]); // Store all files
  const [rawCategories, setRawCategories] = useState<MediaCategory[]>([]);
  const [categories, setCategories] = useState<Array<MediaCategory & { displayName: string; depth: number }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number>(-1);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const filesPerPage = 24;

  // Initial load - categories first, then media files
  useEffect(() => {
    fetchCategories();
    fetchAllMediaFiles();
  }, []);

  // Rebuild category tree when raw categories change
  useEffect(() => {
    if (rawCategories.length > 0) {
      const hierarchicalCategories = buildCategoryTree(rawCategories);
      setCategories(flattenCategoriesForDropdown(hierarchicalCategories));
    }
  }, [rawCategories, allMediaFiles]);

  // Listen for file movement events from sidebar tree
  useEffect(() => {
    const handleFilesMovedEvent = () => {
      fetchAllMediaFiles(); // Refresh all files when files are moved
      // Categories will be rebuilt automatically via useEffect when allMediaFiles changes
    };
    
    window.addEventListener('mediaFilesMoved', handleFilesMovedEvent);
    
    return () => {
      window.removeEventListener('mediaFilesMoved', handleFilesMovedEvent);
    };
  }, []);

  // Watch for URL parameter changes
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category') || 'all';
    if (categoryFromUrl !== selectedCategory) {
      setSelectedCategory(categoryFromUrl);
      setCurrentPage(1); // Reset to first page when category changes
    }
  }, [searchParams]);

  // Calculate deduplicated counts per category using shared utility
  const deduplicatedCounts = useMemo(() => {
    return calculateMediaCounts(allMediaFiles, rawCategories);
  }, [allMediaFiles, rawCategories]);

  // Client-side filtering and sorting
  const filteredAndSortedFiles = useMemo(() => {
    // First, filter out duplicate sized versions
    let filtered = deduplicatedCounts.deduplicatedFiles;

    // Category filtering - now includes hierarchical support
    if (selectedCategory !== 'all') {
      // Get all descendant category IDs (parent + all children)
      const categoryIds = getAllDescendantCategoryIds(selectedCategory, rawCategories);
      
      filtered = filtered.filter(file => {
        return categoryIds.includes(file.category_id);
      });
    } else {
      // For "All Categories", exclude Non-Viewable files
      const nonViewableCategory = rawCategories.find(cat => cat.slug === 'non-viewable');
      if (nonViewableCategory) {
        filtered = filtered.filter(file => file.category_id !== nonViewableCategory.id);
      }
    }

    // Search filtering - includes tags
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(file => {
        const matchesBasic = file.title.toLowerCase().includes(term) ||
          file.original_filename.toLowerCase().includes(term) ||
          file.alt_text?.toLowerCase().includes(term) ||
          file.filename.toLowerCase().includes(term);
        
        // Also search in tags if they exist
        const matchesTags = file.tags ? 
          JSON.parse(file.tags).some((tag: string) => 
            tag.toLowerCase().includes(term)
          ) : false;
        
        return matchesBasic || matchesTags;
      });
    }

    // Sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'size':
          aValue = a.file_size;
          bValue = b.file_size;
          break;
        case 'date':
        default:
          aValue = new Date(a.upload_date).getTime();
          bValue = new Date(b.upload_date).getTime();
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [deduplicatedCounts, rawCategories, selectedCategory, searchTerm, sortBy, sortOrder]);

  // Client-side pagination
  const totalFilteredFiles = filteredAndSortedFiles.length;
  const totalPages = Math.ceil(totalFilteredFiles / filesPerPage);
  const startIndex = (currentPage - 1) * filesPerPage;
  const paginatedFiles = filteredAndSortedFiles.slice(startIndex, startIndex + filesPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm]);

  const buildCategoryTree = (flatCategories: MediaCategory[]): MediaCategory[] => {
    const categoryMap = new Map<number, MediaCategory>();
    const rootCategories: MediaCategory[] = [];

    // Create a map of all categories with updated counts
    flatCategories.forEach(category => {
      const deduplicatedCount = deduplicatedCounts.hierarchical.get(category.id) || 0;
      categoryMap.set(category.id, { 
        ...category, 
        children: [],
        file_count: deduplicatedCount // Override with deduplicated count
      });
    });

    // Build the tree structure
    flatCategories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children!.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    // Sort categories by sort_order
    const sortCategories = (cats: MediaCategory[]) => {
      cats.sort((a, b) => a.sort_order - b.sort_order);
      cats.forEach(cat => {
        if (cat.children && cat.children.length > 0) {
          sortCategories(cat.children);
        }
      });
    };

    sortCategories(rootCategories);
    return rootCategories;
  };

  const flattenCategoriesForDropdown = (categories: MediaCategory[], depth = 0): Array<MediaCategory & { displayName: string; depth: number }> => {
    const result: Array<MediaCategory & { displayName: string; depth: number }> = [];
    
    categories.forEach(category => {
      // Use invisible characters for indentation - creates visual spacing without visible markers
      const indent = '\u00A0\u00A0'.repeat(depth); // Two non-breaking spaces per level for subtle indentation
      // For dropdown, show hierarchical counts (what you get when you select this category)
      const deduplicatedCount = deduplicatedCounts.hierarchical.get(category.id) || 0;
      result.push({
        ...category,
        displayName: `${indent}${category.name} (${deduplicatedCount})`,
        depth
      });
      
      if (category.children && category.children.length > 0) {
        result.push(...flattenCategoriesForDropdown(category.children, depth + 1));
      }
    });
    
    return result;
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/media/categories', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        // Don't build tree immediately - let it be built when deduplicatedCounts are ready
        setRawCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const fetchAllMediaFiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all media files without pagination or category filtering
      // We'll handle filtering client-side
      const response = await fetch('/api/media?limit=1000&category=all_including_non_viewable', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAllMediaFiles(data.files);
      } else {
        throw new Error('Failed to load media files');
      }
    } catch (error) {
      setError('Failed to load media files');
      console.error('Media fetch error:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleMediaSelect = (media: MediaFile) => {
    if (selectionMode) {
      if (allowMultiple) {
        setSelectedFiles(prev => 
          prev.includes(media.id) 
            ? prev.filter(id => id !== media.id)
            : [...prev, media.id]
        );
      } else {
        onMediaSelect?.(media);
      }
    } else {
      // Open preview modal instead of edit modal
      const index = filteredAndSortedFiles.findIndex(f => f.id === media.id);
      setPreviewFile(media);
      setPreviewIndex(index);
    }
  };

  const handleThumbnailSelect = (media: MediaFile) => {
    if (selectionMode) {
      if (allowMultiple) {
        setSelectedFiles(prev => 
          prev.includes(media.id) 
            ? prev.filter(id => id !== media.id)
            : [...prev, media.id]
        );
      } else {
        onMediaSelect?.(media);
      }
    }
  };

  const handlePreviewPrevious = () => {
    const newIndex = previewIndex - 1;
    if (newIndex >= 0 && filteredAndSortedFiles[newIndex]) {
      setPreviewFile(filteredAndSortedFiles[newIndex]);
      setPreviewIndex(newIndex);
    }
  };

  const handlePreviewNext = () => {
    const newIndex = previewIndex + 1;
    if (newIndex < filteredAndSortedFiles.length && filteredAndSortedFiles[newIndex]) {
      setPreviewFile(filteredAndSortedFiles[newIndex]);
      setPreviewIndex(newIndex);
    }
  };

  const handlePreviewClose = () => {
    setPreviewFile(null);
    setPreviewIndex(-1);
  };

  const handleUploadComplete = (media: MediaFile) => {
    setAllMediaFiles(prev => [media, ...prev]);
    // Categories will be rebuilt automatically via useEffect when allMediaFiles changes
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/media/${fileId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setAllMediaFiles(prev => prev.filter(f => f.id !== fileId));
        setEditingFile(null);
        // Categories will be rebuilt automatically via useEffect when allMediaFiles changes
      } else {
        const error = await response.json();
        alert(`Delete failed: ${error.error}`);
      }
    } catch (error) {
      alert('Delete failed. Please try again.');
      console.error('Delete error:', error);
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

  return (
    <div className="media-library">
      {/* Header */}
      <div className="media-library-header">
        <div className="header-title">
          <h2>Media Library</h2>
          <span className="file-count">{totalFilteredFiles} items</span>
        </div>
        <div className="header-actions">
          <button 
            className="btn-upload"
            onClick={() => setShowUpload(!showUpload)}
          >
            📤 Upload Files
          </button>
        </div>
      </div>

      {/* Upload Area */}
      {showUpload && (
        <div className="upload-section">
          <MediaUpload
            onUploadComplete={handleUploadComplete}
            defaultCategoryId={selectedCategory !== 'all' ? 
              categories.find(c => c.slug === selectedCategory)?.id : undefined
            }
          />
        </div>
      )}

      {/* Filters and Controls */}
      <div className="media-controls">
        <div className="controls-left">
          {/* Category Filter */}
          <div className="control-group">
            <label>Category:</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => {
                const newCategory = e.target.value;
                setSelectedCategory(newCategory);
                setCurrentPage(1);
                
                // Update URL parameters
                const newParams = new URLSearchParams(searchParams);
                if (newCategory === 'all') {
                  newParams.delete('category');
                } else {
                  newParams.set('category', newCategory);
                }
                setSearchParams(newParams);
              }}
            >
              <option value="all">All Categories ({deduplicatedCounts.totalExcludingNonViewable})</option>
              {categories.map(category => (
                <option key={category.id} value={category.slug}>
                  {category.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="control-group">
            <label>Search:</label>
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="btn-clear-search"
                onClick={() => {
                  setSearchTerm('');
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="controls-right">
          {/* Sort Controls */}
          <div className="control-group">
            <label>Sort by:</label>
            <select 
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-');
                setSortBy(sort as 'date' | 'name' | 'size');
                setSortOrder(order as 'asc' | 'desc');
              }}
            >
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="size-desc">Size (Largest)</option>
              <option value="size-asc">Size (Smallest)</option>
            </select>
          </div>

          {/* View Mode */}
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ⊞
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Media Grid/List */}
      <div className="media-content">
        {loading && <div className="loading">Loading media files...</div>}
        
        {error && (
          <div className="error">
            {error}
            <button onClick={fetchAllMediaFiles}>Retry</button>
          </div>
        )}

        {!loading && !error && (
          <>
            {viewMode === 'grid' ? (
              <div className="media-grid">
                {paginatedFiles.map(file => (
                  <MediaThumbnail
                    key={file.id}
                    file={file}
                    onClick={() => handleMediaSelect(file)}
                    onSelect={handleThumbnailSelect}
                    isSelected={selectedFiles.includes(file.id)}
                    showSelection={selectionMode}
                    className="media-thumbnail-item"
                  />
                ))}
              </div>
            ) : (
              <div className="media-list">
                {paginatedFiles.map(file => (
                  <div 
                    key={file.id} 
                    className={`media-list-item ${selectedFiles.includes(file.id) ? 'selected' : ''}`}
                    onClick={() => handleMediaSelect(file)}
                  >
                    <div className="list-thumbnail">
                      <MediaThumbnail
                        file={file}
                        onClick={() => handleMediaSelect(file)}
                        onSelect={handleThumbnailSelect}
                        isSelected={selectedFiles.includes(file.id)}
                        showSelection={selectionMode}
                        className="media-thumbnail-compact"
                      />
                    </div>
                    
                    <div className="list-info">
                      <div className="list-title" title={file.title}>
                        {file.title}
                      </div>
                      <div className="list-meta">
                        <span>{formatFileSize(file.file_size)}</span>
                        <span>•</span>
                        <span>{formatDate(file.upload_date)}</span>
                        {file.width && file.height && (
                          <>
                            <span>•</span>
                            <span>{file.width} × {file.height}px</span>
                          </>
                        )}
                      </div>
                      {file.category_name && (
                        <div className="list-category">
                          <span 
                            className="category-badge"
                            style={{ backgroundColor: file.category_color }}
                          >
                            {file.category_name}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="list-actions">
                      <button 
                        className="btn-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFile(file);
                        }}
                        title="Edit file details"
                      >
                        ✏️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  ← Previous
                </button>
                
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next →
                </button>
              </div>
            )}

            {paginatedFiles.length === 0 && (
              <div className="no-files">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'No files match your filters.' 
                  : 'No files uploaded yet.'}
              </div>
            )}
          </>
        )}
      </div>

      {/* Media Preview Modal */}
      <MediaPreview
        file={previewFile}
        isOpen={!!previewFile}
        onClose={handlePreviewClose}
        onPrevious={previewIndex > 0 ? handlePreviewPrevious : undefined}
        onNext={previewIndex < filteredAndSortedFiles.length - 1 ? handlePreviewNext : undefined}
        showNavigation={filteredAndSortedFiles.length > 1}
      />

      {/* Media Details Modal */}
      {editingFile && (
        <MediaFileDetails 
          file={editingFile}
          categories={categories}
          onClose={() => setEditingFile(null)}
          onDelete={handleDeleteFile}
          onUpdate={(updatedFile) => {
            setAllMediaFiles(prev => prev.map(f => 
              f.id === updatedFile.id ? updatedFile : f
            ));
            setEditingFile(updatedFile);
            // Categories will be rebuilt automatically via useEffect when allMediaFiles changes
          }}
        />
      )}

      {/* Selection Actions */}
      {selectionMode && allowMultiple && selectedFiles.length > 0 && (
        <div className="selection-actions">
          <div className="selected-count">
            {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
          </div>
          <button 
            className="btn-use-selected"
            onClick={() => {
              const selectedMedia = allMediaFiles.filter(f => selectedFiles.includes(f.id));
              onMediaSelect?.(selectedMedia as any);
            }}
          >
            Use Selected
          </button>
          <button 
            className="btn-clear-selection"
            onClick={() => setSelectedFiles([])}
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
};

// Media File Details Component
interface MediaFileDetailsProps {
  file: MediaFile;
  categories: MediaCategory[];
  onClose: () => void;
  onDelete: (id: number) => void;
  onUpdate: (file: MediaFile) => void;
}

const MediaFileDetails: React.FC<MediaFileDetailsProps> = ({
  file,
  categories,
  onClose,
  onDelete,
  onUpdate
}) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: file.title,
    alt_text: file.alt_text || '',
    caption: file.caption || '',
    description: file.description || '',
    tags: file.tags ? JSON.parse(file.tags).join(', ') : '',
    category_id: categories.find(c => c.name === file.category_name)?.id || '',
  });

  const handleSave = async () => {
    try {
      // Process tags from comma-separated string to JSON array
      const processedData = {
        ...formData,
        tags: JSON.stringify(
          formData.tags
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
        )
      };
      
      const response = await fetch(`/api/media/${file.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processedData),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        onUpdate(data.media);
        setEditing(false);
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      alert('Failed to update file. Please try again.');
      console.error('Update error:', error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="media-details-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Media Details</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="media-preview">
            {file.file_type === 'image' ? (
              <img src={file.file_url} alt={file.alt_text || file.title} />
            ) : (
              <div className="file-icon-large">
                {file.file_type === 'video' ? '🎥' : 
                 file.file_type === 'audio' ? '🎵' : '📄'}
              </div>
            )}
          </div>

          <div className="media-info">
            {editing ? (
              <div className="edit-form">
                <div className="form-group">
                  <label>Title:</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Alt Text:</label>
                  <input
                    type="text"
                    value={formData.alt_text}
                    onChange={e => setFormData(prev => ({ ...prev, alt_text: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Caption:</label>
                  <textarea
                    value={formData.caption}
                    onChange={e => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="form-group">
                  <label>Description:</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Tags:</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="Enter tags separated by commas"
                  />
                  <small>Separate multiple tags with commas</small>
                </div>
                <div className="form-group">
                  <label>Category:</label>
                  <select
                    value={formData.category_id}
                    onChange={e => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                  >
                    <option value="">No Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="display-info">
                <div className="info-item">
                  <strong>Filename:</strong> {file.original_filename}
                </div>
                <div className="info-item">
                  <strong>Title:</strong> {file.title}
                </div>
                {file.alt_text && (
                  <div className="info-item">
                    <strong>Alt Text:</strong> {file.alt_text}
                  </div>
                )}
                {file.caption && (
                  <div className="info-item">
                    <strong>Caption:</strong> {file.caption}
                  </div>
                )}
                {file.description && (
                  <div className="info-item">
                    <strong>Description:</strong> {file.description}
                  </div>
                )}
                {file.tags && (
                  <div className="info-item">
                    <strong>Tags:</strong> {JSON.parse(file.tags).join(', ')}
                  </div>
                )}
                <div className="info-item">
                  <strong>Category:</strong> {file.category_name || 'No Category'}
                </div>
                <div className="info-item">
                  <strong>File Size:</strong> {(file.file_size / (1024 * 1024)).toFixed(2)} MB
                </div>
                {file.width && file.height && (
                  <div className="info-item">
                    <strong>Dimensions:</strong> {file.width} × {file.height}
                  </div>
                )}
                <div className="info-item">
                  <strong>Uploaded:</strong> {new Date(file.upload_date).toLocaleDateString()}
                </div>
                <div className="info-item">
                  <strong>URL:</strong> 
                  <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                    {file.file_url}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          {editing ? (
            <>
              <button className="btn-save" onClick={handleSave}>Save</button>
              <button className="btn-cancel" onClick={() => setEditing(false)}>Cancel</button>
            </>
          ) : (
            <>
              <button className="btn-edit" onClick={() => setEditing(true)}>Edit</button>
              <button className="btn-delete" onClick={() => onDelete(file.id)}>Delete</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaLibrary;