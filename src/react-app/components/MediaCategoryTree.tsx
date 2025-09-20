import React, { useState, useEffect } from 'react';
import { calculateMediaCounts } from '../../utils/mediaCountUtils';
import './MediaCategoryTree.css';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface MediaCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
  parent_id?: number;
  sort_order: number;
  file_count: number;
  children?: MediaCategory[];
}

interface MediaCategoryTreeProps {
  user: User;
  onCategorySelect?: (categorySlug: string | null) => void;
}

const MediaCategoryTree: React.FC<MediaCategoryTreeProps> = ({ user, onCategorySelect }) => {
  const [categories, setCategories] = useState<MediaCategory[]>([]);
  const [rawCategories, setRawCategories] = useState<MediaCategory[]>([]);
  const [allMediaFiles, setAllMediaFiles] = useState<any[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set([1, 2, 3, 4, 5])); // Auto-expand common categories
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    parent_id: null as number | null
  });

  useEffect(() => {
    fetchCategories();
    fetchAllMediaFiles();
  }, []);

  // Rebuild category tree when both raw categories and media files are loaded
  useEffect(() => {
    if (rawCategories.length > 0 && allMediaFiles.length > 0) {
      const hierarchicalCategories = buildCategoryTree(rawCategories);
      setCategories(hierarchicalCategories);
    }
  }, [rawCategories, allMediaFiles]);

  // Listen for file movement events to refresh counts
  useEffect(() => {
    const handleFilesMovedEvent = () => {
      fetchAllMediaFiles(); // Refresh files to update counts
      fetchCategories(); // Also refresh categories
    };
    
    window.addEventListener('mediaFilesMoved', handleFilesMovedEvent);
    
    return () => {
      window.removeEventListener('mediaFilesMoved', handleFilesMovedEvent);
    };
  }, []);


  const fetchAllMediaFiles = async () => {
    try {
      const response = await fetch('/api/media?limit=1000&category=all_including_non_viewable', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setAllMediaFiles(data.files);
      }
    } catch (error) {
      console.error('Failed to load media files for counting:', error);
    }
  };

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/media/categories', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        // Don't build tree here - let the useEffect handle it when both data is ready
        setRawCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buildCategoryTree = (flatCategories: MediaCategory[]): MediaCategory[] => {
    // Use shared utility for consistent counting
    const counts = calculateMediaCounts(allMediaFiles, flatCategories);

    const categoryMap = new Map<number, MediaCategory>();
    const rootCategories: MediaCategory[] = [];

    // Create a map of all categories with updated counts
    flatCategories.forEach(category => {
      const deduplicatedCount = counts.hierarchical.get(category.id) || 0;
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

  const toggleExpanded = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCategorySelect = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    
    // Find the category slug for navigation
    const category = categoryId ? findCategoryById(categories, categoryId) : null;
    const categorySlug = category?.slug || null;
    
    onCategorySelect?.(categorySlug);
  };

  const handleDoubleClick = (category: MediaCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(category.id);
    setEditingName(category.name);
  };

  const handleEditSave = async (categoryId: number) => {
    if (!editingName.trim() || editingName === findCategoryById(categories, categoryId)?.name) {
      setEditingCategory(null);
      setEditingName('');
      return;
    }

    try {
      const category = findCategoryById(categories, categoryId);
      if (!category) return;

      const response = await fetch(`/api/media/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: editingName.trim(),
          description: category.description || '',
          color: category.color || '#3B82F6',
          parent_id: category.parent_id,
        }),
      });

      if (response.ok) {
        setEditingCategory(null);
        setEditingName('');
        fetchCategories(); // Refresh to get updated data
      } else {
        console.error('Failed to update category:', await response.text());
      }
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleEditCancel = () => {
    setEditingCategory(null);
    setEditingName('');
  };

  const handleDragOver = (e: React.DragEvent, categoryId: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCategory(categoryId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCategory(null);
  };

  const handleDrop = async (e: React.DragEvent, targetCategoryId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCategory(null);

    const dragData = e.dataTransfer.getData('application/json');
    if (!dragData) return;

    try {
      const draggedItem = JSON.parse(dragData);
      
      // Check if we're dragging a category or a file
      if (draggedItem.type === 'category') {
        // Prevent dropping a category on itself or its descendants
        if (draggedItem.id === targetCategoryId || isDescendant(draggedItem.id, targetCategoryId)) {
          console.warn('Cannot move category to itself or its descendant');
          return;
        }

        // Prevent more than 2 levels of nesting
        const targetDepth = getCategoryDepth(targetCategoryId);
        if (targetDepth >= 2) {
          console.warn('Maximum nesting level (2) reached');
          return;
        }

        // Update category parent via API
        const response = await fetch(`/api/media/categories/${draggedItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name: draggedItem.name,
            description: draggedItem.description || '',
            color: draggedItem.color || '#3B82F6',
            parent_id: targetCategoryId,
          }),
        });

        if (response.ok) {
          // Auto-expand target category to show moved category
          setExpandedCategories(prev => new Set([...prev, targetCategoryId]));
          
          // Refresh categories
          fetchCategories();
          
          const targetCategory = findCategoryById(categories, targetCategoryId);
          console.log(`Category "${draggedItem.name}" moved to "${targetCategory?.name || 'category'}"`);
        } else {
          console.error('Failed to move category:', await response.text());
        }
      } else {
        // Handle file drop (existing functionality)
        const response = await fetch(`/api/media/${draggedItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            ...draggedItem,
            category_id: targetCategoryId,
          }),
        });

        if (response.ok) {
          // Refresh categories to update file counts
          fetchCategories();
          
          // Notify any MediaLibrary components that files were moved
          window.dispatchEvent(new CustomEvent('mediaFilesMoved'));
          
          // Show success feedback
          const category = findCategoryById(categories, targetCategoryId);
          console.log(`File moved to ${category?.name || 'category'}`);
        }
      }
    } catch (error) {
      console.error('Failed to move item:', error);
    }
  };

  const findCategoryById = (cats: MediaCategory[], id: number): MediaCategory | null => {
    for (const cat of cats) {
      if (cat.id === id) return cat;
      if (cat.children) {
        const found = findCategoryById(cat.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const getCategoryDepth = (categoryId: number): number => {
    const findDepth = (cats: MediaCategory[], targetId: number, currentDepth: number = 0): number => {
      for (const cat of cats) {
        if (cat.id === targetId) return currentDepth;
        if (cat.children) {
          const depth = findDepth(cat.children, targetId, currentDepth + 1);
          if (depth !== -1) return depth;
        }
      }
      return -1;
    };
    return findDepth(categories, categoryId);
  };

  const isDescendant = (ancestorId: number, potentialDescendantId: number): boolean => {
    const ancestor = findCategoryById(categories, ancestorId);
    if (!ancestor || !ancestor.children) return false;
    
    const checkDescendants = (cats: MediaCategory[]): boolean => {
      for (const cat of cats) {
        if (cat.id === potentialDescendantId) return true;
        if (cat.children && checkDescendants(cat.children)) return true;
      }
      return false;
    };
    
    return checkDescendants(ancestor.children);
  };

  const handleCategoryDragStart = (e: React.DragEvent, category: MediaCategory) => {
    e.stopPropagation();
    const dragData = {
      type: 'category',
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      parent_id: category.parent_id
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleAddCategory = async () => {
    if (!newCategoryData.name.trim()) return;

    try {
      const response = await fetch('/api/media/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: newCategoryData.name,
          description: '',
          color: '#3B82F6',
          parent_id: newCategoryData.parent_id
        }),
      });

      if (response.ok) {
        setShowAddForm(false);
        setNewCategoryData({ name: '', parent_id: null });
        fetchCategories();
        
        // Auto-expand parent if adding subcategory
        if (newCategoryData.parent_id) {
          setExpandedCategories(prev => new Set([...prev, newCategoryData.parent_id!]));
        }
      }
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const renderCategory = (category: MediaCategory, depth: number = 0, isLast: boolean = false, parentConnectors: boolean[] = []) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategory === category.id;
    const isDragOver = dragOverCategory === category.id;
    const isEditing = editingCategory === category.id;
    
    // Simplified file tree styling
    const folderIcon = hasChildren ? (isExpanded ? '📁' : '📂') : '📄';
    
    // Build tree connectors more carefully
    let treePrefix = '';
    if (depth > 0) {
      // Add parent level connectors
      treePrefix = parentConnectors.map(hasMore => hasMore ? '│  ' : '   ').join('');
      // Add connector for this level
      treePrefix += isLast ? '└─ ' : '├─ ';
    }

    return (
      <div key={category.id} className={`tree-item depth-${depth}`}>
        <div 
          className={`tree-row ${isSelected ? 'selected' : ''} ${isDragOver ? 'drag-over' : ''} ${isEditing ? 'editing' : ''}`}
          draggable={!isEditing}
          onDragStart={!isEditing ? (e) => handleCategoryDragStart(e, category) : undefined}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragOver={(e) => handleDragOver(e, category.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, category.id)}
          onClick={!isEditing ? () => handleCategorySelect(category.id) : undefined}
          onDoubleClick={!isEditing ? (e) => handleDoubleClick(category, e) : undefined}
        >
          <span className="tree-connector">{treePrefix}</span>
          
          {hasChildren && (
            <button 
              className="tree-toggle"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(category.id);
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          
          <span className="tree-icon">{folderIcon}</span>
          
          {isEditing ? (
            <div className="inline-edit">
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleEditSave(category.id);
                  } else if (e.key === 'Escape') {
                    handleEditCancel();
                  }
                }}
                onBlur={() => handleEditSave(category.id)}
                autoFocus
                className="edit-input"
              />
            </div>
          ) : (
            <span className="tree-name" title="Double-click to edit">{category.name}</span>
          )}
          
          {!isEditing && (
            <span className="tree-count">{category.file_count > 0 ? `(${category.file_count})` : ''}</span>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="tree-children">
            {category.children!.map((child, index) => 
              renderCategory(
                child, 
                depth + 1, 
                index === category.children!.length - 1,
                depth === 0 ? [] : [...parentConnectors, !isLast]
              )
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="file-tree">
        <div className="tree-skeleton">
          <div className="skeleton-row">
            <div className="skeleton-icon"></div>
            <div className="skeleton-text skeleton-text-long"></div>
          </div>
          <div className="skeleton-row">
            <div className="skeleton-connector">├─</div>
            <div className="skeleton-icon"></div>
            <div className="skeleton-text"></div>
          </div>
          <div className="skeleton-row">
            <div className="skeleton-connector">├─</div>
            <div className="skeleton-icon"></div>
            <div className="skeleton-text skeleton-text-short"></div>
          </div>
          <div className="skeleton-row">
            <div className="skeleton-connector">└─</div>
            <div className="skeleton-icon"></div>
            <div className="skeleton-text"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="file-tree">
      {/* All Files root */}
      <div 
        className={`tree-row root-item ${selectedCategory === null ? 'selected' : ''}`}
        onClick={() => handleCategorySelect(null)}
      >
        <span className="tree-icon">🗂️</span>
        <span className="tree-name">All Files</span>
        <span className="tree-count">
          ({(() => {
            const counts = calculateMediaCounts(allMediaFiles, rawCategories);
            return counts.totalExcludingNonViewable;
          })()})
        </span>
      </div>
      
      {/* Category tree */}
      <div className="tree-list">
        {categories.map((category, index) => 
          renderCategory(category, 0, false, [])
        )}
      </div>
      
      {/* Quick add for admins */}
      {user.role === 'admin' && (
        <div className="tree-actions">
          <button 
            className="add-root-btn"
            onClick={() => {
              setNewCategoryData({ name: '', parent_id: null });
              setShowAddForm(true);
            }}
            title="Add root category"
          >
            + Add Category
          </button>
        </div>
      )}
      
      {/* Minimal add form */}
      {showAddForm && (
        <div className="quick-add-form">
          <input
            type="text"
            placeholder="Category name"
            value={newCategoryData.name}
            onChange={(e) => setNewCategoryData(prev => ({ ...prev, name: e.target.value }))}
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddCategory();
              } else if (e.key === 'Escape') {
                setShowAddForm(false);
              }
            }}
          />
          <div className="form-buttons">
            <button onClick={handleAddCategory} className="save">✓</button>
            <button onClick={() => setShowAddForm(false)} className="cancel">✕</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaCategoryTree;