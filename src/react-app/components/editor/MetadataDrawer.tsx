import React from 'react';
import './MetadataDrawer.css';

interface MetadataDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  excerpt: string;
  category: string;
  tags: string[];
  status: 'draft' | 'scheduled' | 'published';
  postType: 'monday' | 'wednesday' | 'friday' | 'saturday' | 'newsletter';
  persona: 'easy_breezy' | 'thrill_seeker' | 'luxe_seafarer' | null;
  onExcerptChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTagsChange: (value: string[]) => void;
  onStatusChange: (value: 'draft' | 'scheduled' | 'published') => void;
  onPostTypeChange: (value: 'monday' | 'wednesday' | 'friday' | 'saturday' | 'newsletter') => void;
  onPersonaChange: (value: 'easy_breezy' | 'thrill_seeker' | 'luxe_seafarer' | null) => void;
}

export const MetadataDrawer: React.FC<MetadataDrawerProps> = ({
  isOpen,
  onClose,
  excerpt,
  category,
  tags,
  status,
  postType,
  persona,
  onExcerptChange,
  onCategoryChange,
  onTagsChange,
  onStatusChange,
  onPostTypeChange,
  onPersonaChange
}) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="metadata-drawer-overlay" onClick={onClose} />
      )}

      {/* Drawer */}
      <div className={`metadata-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2>Post Settings</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="drawer-content">
          <div className="drawer-section">
            <label>Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => onExcerptChange(e.target.value)}
              placeholder="Brief summary of the post..."
              rows={4}
            />
          </div>

          <div className="drawer-section">
            <label>Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              placeholder="cruise-planning"
            />
          </div>

          <div className="drawer-section">
            <label>Tags</label>
            <input
              type="text"
              value={tags.join(', ')}
              onChange={(e) => onTagsChange(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
              placeholder="tag1, tag2, tag3"
            />
            {tags.length > 0 && (
              <div className="tags-preview">
                {tags.map((tag, i) => (
                  <span key={i} className="tag-badge">{tag}</span>
                ))}
              </div>
            )}
          </div>

          <div className="drawer-section">
            <label>Status</label>
            <select value={status} onChange={(e) => onStatusChange(e.target.value as any)}>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="drawer-section">
            <label>Post Type</label>
            <select value={postType} onChange={(e) => onPostTypeChange(e.target.value as any)}>
              <option value="monday">Monday - Awareness</option>
              <option value="wednesday">Wednesday - Practical</option>
              <option value="friday">Friday - Aspirational</option>
              <option value="saturday">Saturday - Inspirational</option>
              <option value="newsletter">Sunday - Newsletter</option>
            </select>
          </div>

          <div className="drawer-section">
            <label>Persona</label>
            <select value={persona || ''} onChange={(e) => onPersonaChange(e.target.value as any || null)}>
              <option value="">None</option>
              <option value="easy_breezy">Easy Breezy</option>
              <option value="thrill_seeker">Thrill Seeker</option>
              <option value="luxe_seafarer">Luxe Seafarer</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
};

export default MetadataDrawer;
