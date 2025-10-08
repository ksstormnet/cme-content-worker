/**
 * Collapsible Metadata Panel - Default shows Title + Category only
 */
import React, { useState } from 'react';
import './CollapsibleMetadata.css';

interface CollapsibleMetadataProps {
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  status: 'draft' | 'scheduled' | 'published';
  postType: 'monday' | 'wednesday' | 'friday' | 'saturday' | 'newsletter';
  persona: 'easy_breezy' | 'thrill_seeker' | 'luxe_seafarer' | null;
  onTitleChange: (title: string) => void;
  onExcerptChange: (excerpt: string) => void;
  onCategoryChange: (category: string) => void;
  onTagsChange: (tags: string[]) => void;
  onStatusChange: (status: 'draft' | 'scheduled' | 'published') => void;
  onPostTypeChange: (postType: 'monday' | 'wednesday' | 'friday' | 'saturday' | 'newsletter') => void;
  onPersonaChange: (persona: 'easy_breezy' | 'thrill_seeker' | 'luxe_seafarer' | null) => void;
}

const CollapsibleMetadata: React.FC<CollapsibleMetadataProps> = ({
  title,
  excerpt,
  category,
  tags,
  status,
  postType,
  persona,
  onTitleChange,
  onExcerptChange,
  onCategoryChange,
  onTagsChange,
  onStatusChange,
  onPostTypeChange,
  onPersonaChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const input = e.currentTarget;
      const newTag = input.value.trim();
      if (newTag && !tags.includes(newTag)) {
        onTagsChange([...tags, newTag]);
        input.value = '';
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className={`collapsible-metadata ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Always visible: Title and Category */}
      <div className="metadata-essentials">
        <div className="metadata-field">
          <label htmlFor="post-title" className="field-label">
            Title
          </label>
          <input
            id="post-title"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Enter post title..."
            className="metadata-input title-input"
          />
        </div>

        <div className="metadata-field">
          <label htmlFor="post-category" className="field-label">
            Category
          </label>
          <input
            id="post-category"
            type="text"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            placeholder="cruise-tips"
            className="metadata-input category-input"
          />
        </div>
      </div>

      {/* Toggle button */}
      <button
        type="button"
        className="toggle-button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Show less metadata' : 'Show more metadata'}
      >
        {isExpanded ? (
          <>
            <span>Show Less</span>
            <span className="toggle-icon">▲</span>
          </>
        ) : (
          <>
            <span>More Options</span>
            <span className="toggle-icon">▼</span>
          </>
        )}
      </button>

      {/* Expandable section */}
      {isExpanded && (
        <div className="metadata-expanded">
          <div className="metadata-field">
            <label htmlFor="post-excerpt" className="field-label">
              Excerpt
            </label>
            <textarea
              id="post-excerpt"
              value={excerpt}
              onChange={(e) => onExcerptChange(e.target.value)}
              placeholder="Brief summary of the post..."
              className="metadata-textarea"
              rows={3}
            />
          </div>

          <div className="metadata-field">
            <label className="field-label">Tags</label>
            <div className="tags-container">
              {tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="tag-remove"
                    aria-label={`Remove ${tag} tag`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Type tag and press Enter..."
              onKeyDown={handleTagInput}
              className="metadata-input"
            />
          </div>

          <div className="metadata-row">
            <div className="metadata-field">
              <label htmlFor="post-status" className="field-label">
                Status
              </label>
              <select
                id="post-status"
                value={status}
                onChange={(e) => onStatusChange(e.target.value as 'draft' | 'scheduled' | 'published')}
                className="metadata-select"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="metadata-field">
              <label htmlFor="post-type" className="field-label">
                Post Type
              </label>
              <select
                id="post-type"
                value={postType}
                onChange={(e) => onPostTypeChange(e.target.value as 'monday' | 'wednesday' | 'friday' | 'saturday' | 'newsletter')}
                className="metadata-select"
              >
                <option value="monday">Monday</option>
                <option value="wednesday">Wednesday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
                <option value="newsletter">Newsletter</option>
              </select>
            </div>
          </div>

          <div className="metadata-field">
            <label htmlFor="post-persona" className="field-label">
              Persona
            </label>
            <select
              id="post-persona"
              value={persona || ''}
              onChange={(e) => onPersonaChange(e.target.value ? e.target.value as 'easy_breezy' | 'thrill_seeker' | 'luxe_seafarer' : null)}
              className="metadata-select"
            >
              <option value="">None</option>
              <option value="easy_breezy">Easy Breezy</option>
              <option value="thrill_seeker">Thrill Seeker</option>
              <option value="luxe_seafarer">Luxe Seafarer</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollapsibleMetadata;
