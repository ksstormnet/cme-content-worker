// Media Category Manager Component
// Admin interface for managing media library categories

import React, { useState, useEffect } from 'react';
import './MediaCategoryManager.css';

interface MediaCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  sort_order: number;
  file_count: number;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface MediaCategoryManagerProps {
  user: User;
  onClose?: () => void;
}

const MediaCategoryManager: React.FC<MediaCategoryManagerProps> = ({ user, onClose }) => {
  const [categories, setCategories] = useState<MediaCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<MediaCategory | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  });

  // Predefined color options
  const colorOptions = [
    { value: '#3B82F6', name: 'Blue' },
    { value: '#10B981', name: 'Green' },
    { value: '#F59E0B', name: 'Amber' },
    { value: '#EF4444', name: 'Red' },
    { value: '#8B5CF6', name: 'Purple' },
    { value: '#06B6D4', name: 'Cyan' },
    { value: '#84CC16', name: 'Lime' },
    { value: '#F97316', name: 'Orange' },
    { value: '#EC4899', name: 'Pink' },
    { value: '#6B7280', name: 'Gray' },
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/media/categories', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      } else {
        throw new Error('Failed to load categories');
      }
    } catch (error) {
      setError('Failed to load categories');
      console.error('Categories fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
    });
    setEditingCategory(null);
    setShowCreateForm(false);
  };

  const handleCreate = () => {
    resetForm();
    setShowCreateForm(true);
  };

  const handleEdit = (category: MediaCategory) => {
    setFormData({
      name: category.name,
      description: category.description,
      color: category.color,
    });
    setEditingCategory(category);
    setShowCreateForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Category name is required');
      return;
    }

    try {
      const url = editingCategory 
        ? `/api/media/categories/${editingCategory.id}`
        : '/api/media/categories';
      
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (response.ok) {
        await fetchCategories(); // Refresh the list
        resetForm();
      } else {
        const errorData = await response.json();
        alert(`Failed to ${editingCategory ? 'update' : 'create'} category: ${errorData.error}`);
      }
    } catch (error) {
      alert(`Failed to ${editingCategory ? 'update' : 'create'} category. Please try again.`);
      console.error('Category save error:', error);
    }
  };

  const handleDelete = async (categoryId: number, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete the "${categoryName}" category? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/media/categories/${categoryId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchCategories(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`Failed to delete category: ${errorData.error}`);
      }
    } catch (error) {
      alert('Failed to delete category. Please try again.');
      console.error('Category delete error:', error);
    }
  };

  const handleReorder = async (categoryId: number, newOrder: number) => {
    try {
      const response = await fetch(`/api/media/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: newOrder }),
        credentials: 'include',
      });

      if (response.ok) {
        await fetchCategories(); // Refresh the list
      } else {
        throw new Error('Failed to reorder category');
      }
    } catch (error) {
      console.error('Category reorder error:', error);
    }
  };

  // Check if user is admin
  if (user.role !== 'admin') {
    return (
      <div className="category-manager">
        <div className="access-denied">
          <h3>Access Denied</h3>
          <p>Only administrators can manage media categories.</p>
          {onClose && (
            <button onClick={onClose} className="btn-close">Close</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="category-manager">
      <div className="category-manager-header">
        <div className="header-title">
          <h2>Media Categories</h2>
          <span className="category-count">{categories.length} categories</span>
        </div>
        <div className="header-actions">
          <button className="btn-create" onClick={handleCreate}>
            ➕ New Category
          </button>
          {onClose && (
            <button className="btn-close" onClick={onClose}>✕</button>
          )}
        </div>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="category-form-section">
          <div className="form-header">
            <h3>{editingCategory ? 'Edit Category' : 'Create New Category'}</h3>
            <button className="btn-cancel" onClick={resetForm}>✕</button>
          </div>
          
          <form onSubmit={handleSubmit} className="category-form">
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Category name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Color</label>
                <div className="color-picker">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`color-option ${formData.color === color.value ? 'selected' : ''}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                      title={color.name}
                    />
                  ))}
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="color-input"
                  />
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description for this category"
                rows={3}
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-save">
                {editingCategory ? 'Update Category' : 'Create Category'}
              </button>
              <button type="button" className="btn-cancel" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="categories-section">
        {loading && <div className="loading">Loading categories...</div>}
        
        {error && (
          <div className="error">
            {error}
            <button onClick={fetchCategories}>Retry</button>
          </div>
        )}

        {!loading && !error && (
          <>
            {categories.length === 0 ? (
              <div className="no-categories">
                <p>No categories created yet.</p>
                <button className="btn-create" onClick={handleCreate}>
                  Create your first category
                </button>
              </div>
            ) : (
              <div className="categories-list">
                <div className="list-header">
                  <div className="header-cell">Category</div>
                  <div className="header-cell">Files</div>
                  <div className="header-cell">Order</div>
                  <div className="header-cell">Actions</div>
                </div>
                
                {categories.map((category, index) => (
                  <div key={category.id} className="category-item">
                    <div className="category-info">
                      <div className="category-visual">
                        <div 
                          className="category-color"
                          style={{ backgroundColor: category.color }}
                        />
                        <div className="category-details">
                          <div className="category-name">{category.name}</div>
                          {category.description && (
                            <div className="category-description">{category.description}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="file-count">
                      <span className="count">{category.file_count}</span>
                      <span className="label">files</span>
                    </div>
                    
                    <div className="order-controls">
                      <button
                        className="order-btn"
                        disabled={index === 0}
                        onClick={() => handleReorder(category.id, category.sort_order - 15)}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <span className="order-number">{index + 1}</span>
                      <button
                        className="order-btn"
                        disabled={index === categories.length - 1}
                        onClick={() => handleReorder(category.id, category.sort_order + 15)}
                        title="Move down"
                      >
                        ↓
                      </button>
                    </div>
                    
                    <div className="category-actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(category)}
                        title="Edit category"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(category.id, category.name)}
                        disabled={category.file_count > 0}
                        title={category.file_count > 0 ? 'Cannot delete category with files' : 'Delete category'}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Usage Tips */}
      <div className="tips-section">
        <h4>💡 Tips</h4>
        <ul>
          <li>Categories help organize your media library and make files easier to find</li>
          <li>Choose distinct colors for categories to make them visually recognizable</li>
          <li>You cannot delete categories that contain files - move files to other categories first</li>
          <li>Use the order controls to arrange categories in your preferred sequence</li>
          <li>Categories with meaningful names and descriptions improve team workflows</li>
        </ul>
      </div>
    </div>
  );
};

export default MediaCategoryManager;