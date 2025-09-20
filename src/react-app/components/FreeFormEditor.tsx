import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import './FreeFormEditor.css';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface Post {
  id: number;
  title: string;
  status: 'draft' | 'approved' | 'scheduled' | 'published';
  post_type: 'monday' | 'wednesday' | 'friday' | 'saturday' | 'newsletter';
  persona?: 'easy_breezy' | 'thrill_seeker' | 'luxe_seafarer';
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  author_name?: string;
  excerpt?: string;
}

interface FreeFormEditorProps {
  user: User;
  onPostCreated: (post: Post) => void;
}

interface ContentBlock {
  type: string;
  content: string;
  level?: number;
  alt?: string;
  caption?: string;
  citation?: string;
  text?: string;
  url?: string;
}

const FreeFormEditor: React.FC<FreeFormEditorProps> = ({ user, onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [postType, setPostType] = useState<'monday' | 'wednesday' | 'friday' | 'saturday' | 'newsletter'>('monday');
  const [persona, setPersona] = useState<'easy_breezy' | 'thrill_seeker' | 'luxe_seafarer' | ''>('');
  const [category, setCategory] = useState('general');
  const [tags, setTags] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdPostId, setCreatedPostId] = useState<number | null>(null);

  const blockTypes = [
    { type: 'paragraph', label: '📄 Paragraph', description: 'Regular text content' },
    { type: 'heading', label: '📝 Heading', description: 'Section headers (H2, H3, H4)' },
    { type: 'accent_tip', label: '💡 Accent Tip', description: 'Highlighted planning tips' },
    { type: 'quote', label: '💬 Quote', description: 'Blockquotes and testimonials' },
    { type: 'image', label: '🖼️ Image', description: 'Images with captions' },
    { type: 'cta', label: '🔗 Call to Action', description: 'Buttons and links' }
  ];

  const postTypeDescriptions = {
    monday: 'Awareness/Big Picture - Seasonal urgency, wanderlust, future planning focus',
    wednesday: 'Practical/Consideration - Evergreen expertise, comparisons, myth-busting',
    friday: 'Aspirational/Deep Dive - Milestones, detailed planning, comprehensive guides',
    saturday: 'Inspirational/Shareable - Wow-factor content, lifestyle resonance, viral potential',
    newsletter: 'Weekly Newsletter - The Sunday Compass with persona-specific intro'
  };

  const addBlock = (type: string) => {
    const newBlock: ContentBlock = {
      type,
      content: getDefaultContent(type)
    };

    if (type === 'heading') {
      newBlock.level = 2;
    }

    setContentBlocks([...contentBlocks, newBlock]);
  };

  const getDefaultContent = (type: string): string => {
    switch (type) {
      case 'paragraph':
        return 'Enter your paragraph content here...';
      case 'heading':
        return 'Your Section Header';
      case 'accent_tip':
        return 'Add a planning tip or key insight here...';
      case 'quote':
        return 'Your inspirational quote or important statement...';
      case 'image':
        return 'Image description';
      case 'cta':
        return 'Button Text';
      default:
        return '';
    }
  };

  const updateBlock = (index: number, field: string, value: string | number) => {
    const updatedBlocks = [...contentBlocks];
    updatedBlocks[index] = {
      ...updatedBlocks[index],
      [field]: value
    };
    setContentBlocks(updatedBlocks);
  };

  const removeBlock = (index: number) => {
    setContentBlocks(contentBlocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...contentBlocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newBlocks.length) {
      [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
      setContentBlocks(newBlocks);
    }
  };

  const createFreeFormPost = async () => {
    if (!title.trim()) {
      setError('Please enter a title for your post');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/content-advanced/free-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          content_blocks: contentBlocks,
          post_type: postType,
          persona: persona || null,
          category: category,
          tags: tags,
          save_as_draft: true
        })
      });

      const data = await response.json();

      if (data.success) {
        const newPost: Post = {
          id: data.data.post_id,
          title: title,
          status: 'draft',
          post_type: postType,
          persona: persona || undefined,
          category: category,
          tags: tags,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          author_name: user.name,
          excerpt: `Free-form content: ${title}`
        };

        onPostCreated(newPost);
        setCreatedPostId(data.data.post_id);
        setShowSuccess(true);
      } else {
        setError(data.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Create post error:', error);
      setError('Network error - please try again');
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContentBlocks([]);
    setPostType('monday');
    setPersona('');
    setCategory('general');
    setTags([]);
    setShowSuccess(false);
    setCreatedPostId(null);
    setError(null);
  };

  if (showSuccess && createdPostId) {
    return (
      <div className="free-form-editor">
        <div className="success-state">
          <div className="success-header">
            <h2>🎉 Free-Form Post Created!</h2>
            <p>Your post has been created and saved as a draft.</p>
          </div>

          <div className="success-content">
            <div className="created-post-info">
              <h3>📝 "{title}"</h3>
              <p><strong>Type:</strong> {postType.charAt(0).toUpperCase() + postType.slice(1)}</p>
              {persona && <p><strong>Persona:</strong> {persona.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</p>}
              <p><strong>Blocks:</strong> {contentBlocks.length} content blocks</p>
              <p><strong>Status:</strong> Draft</p>
            </div>

            <div className="success-actions">
              <button 
                className="btn btn-primary"
                onClick={() => window.location.href = `/create/edit/${createdPostId}`}
              >
                Edit This Post
              </button>
              <button 
                className="btn btn-secondary"
                onClick={resetForm}
              >
                Create Another Post
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="free-form-editor">
      <div className="editor-header">
        <h2>✍️ Free-Form Content Editor</h2>
        <p>Create content from scratch with full creative control. Build your post block by block!</p>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="editor-container">
        <div className="editor-sidebar">
          <h3>🧱 Add Content Blocks</h3>
          <p className="sidebar-description">Click to add blocks to your post</p>
          
          <div className="block-types">
            {blockTypes.map((blockType) => (
              <button
                key={blockType.type}
                onClick={() => addBlock(blockType.type)}
                className="block-type-btn"
                disabled={isCreating}
              >
                <span className="block-label">{blockType.label}</span>
                <span className="block-description">{blockType.description}</span>
              </button>
            ))}
          </div>

          <div className="cme-guidelines">
            <h4>📋 CME Guidelines</h4>
            <ul>
              <li>Write in first-person agent POV</li>
              <li>Always "Norwegian Cruise Line" first, then "Norwegian" or "NCL"</li>
              <li>Never invent facts or testimonials</li>
              <li>Maximum 2 CTAs per post</li>
              <li>Include planning tips and insights</li>
            </ul>
          </div>
        </div>

        <div className="editor-main">
          <div className="post-settings">
            <div className="settings-row">
              <div className="setting-group">
                <label htmlFor="title">Post Title *</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your post title..."
                  className="title-input"
                  disabled={isCreating}
                />
              </div>
            </div>

            <div className="settings-row">
              <div className="setting-group">
                <label htmlFor="post-type">Post Type</label>
                <select
                  id="post-type"
                  value={postType}
                  onChange={(e) => setPostType(e.target.value as any)}
                  className="setting-select"
                  disabled={isCreating}
                >
                  {Object.entries(postTypeDescriptions).map(([type, description]) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
                <p className="setting-description">{postTypeDescriptions[postType]}</p>
              </div>

              <div className="setting-group">
                <label htmlFor="persona">Target Persona (Optional)</label>
                <select
                  id="persona"
                  value={persona}
                  onChange={(e) => setPersona(e.target.value as any)}
                  className="setting-select"
                  disabled={isCreating}
                >
                  <option value="">All Personas</option>
                  <option value="easy_breezy">Easy Breezy</option>
                  <option value="thrill_seeker">Thrill Seeker</option>
                  <option value="luxe_seafarer">Luxe Seafarer</option>
                </select>
              </div>
            </div>

            <div className="settings-row">
              <div className="setting-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="setting-select"
                  disabled={isCreating}
                >
                  <option value="general">General</option>
                  <option value="cruise-tips">Cruise Tips</option>
                  <option value="destinations">Destinations</option>
                  <option value="cruise-lines">Cruise Lines</option>
                  <option value="planning">Planning</option>
                  <option value="ship-reviews">Ship Reviews</option>
                  <option value="port-guides">Port Guides</option>
                  <option value="dining">Dining</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="excursions">Excursions</option>
                </select>
                <p className="setting-description">Choose the most relevant category for SEO and organization</p>
              </div>

              <div className="setting-group">
                <label htmlFor="tags">Tags (comma-separated)</label>
                <input
                  id="tags"
                  type="text"
                  value={tags.join(', ')}
                  onChange={(e) => setTags(e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0))}
                  placeholder="e.g., alaska, glacier bay, norwegian bliss, first time"
                  className="setting-input"
                  disabled={isCreating}
                />
                <p className="setting-description">Add relevant tags for better content discovery</p>
              </div>
            </div>
          </div>

          <div className="content-blocks-area">
            <h3>📝 Content Blocks</h3>
            
            {contentBlocks.length === 0 ? (
              <div className="empty-blocks">
                <p>No content blocks yet. Add blocks from the sidebar to start building your post!</p>
              </div>
            ) : (
              <div className="blocks-list">
                {contentBlocks.map((block, index) => (
                  <div key={index} className={`block-editor block-${block.type}`}>
                    <div className="block-header">
                      <span className="block-type-label">
                        {blockTypes.find(bt => bt.type === block.type)?.label || block.type}
                      </span>
                      <div className="block-actions">
                        {index > 0 && (
                          <button
                            onClick={() => moveBlock(index, 'up')}
                            className="btn-icon"
                            title="Move up"
                          >
                            ⬆️
                          </button>
                        )}
                        {index < contentBlocks.length - 1 && (
                          <button
                            onClick={() => moveBlock(index, 'down')}
                            className="btn-icon"
                            title="Move down"
                          >
                            ⬇️
                          </button>
                        )}
                        <button
                          onClick={() => removeBlock(index)}
                          className="btn-icon btn-danger"
                          title="Remove block"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="block-content">
                      {block.type === 'heading' && (
                        <>
                          <div className="heading-controls">
                            <label>Heading Level:</label>
                            <select
                              value={block.level || 2}
                              onChange={(e) => updateBlock(index, 'level', parseInt(e.target.value))}
                              className="level-select"
                            >
                              <option value={2}>H2</option>
                              <option value={3}>H3</option>
                              <option value={4}>H4</option>
                            </select>
                          </div>
                          <input
                            type="text"
                            value={block.content}
                            onChange={(e) => updateBlock(index, 'content', e.target.value)}
                            className="block-input heading-input"
                            placeholder="Section heading..."
                          />
                        </>
                      )}

                      {(block.type === 'paragraph' || block.type === 'accent_tip' || block.type === 'quote') && (
                        <textarea
                          value={block.content}
                          onChange={(e) => updateBlock(index, 'content', e.target.value)}
                          className="block-textarea"
                          rows={block.type === 'paragraph' ? 4 : 3}
                          placeholder={`Enter ${block.type.replace('_', ' ')} content...`}
                        />
                      )}

                      {block.type === 'image' && (
                        <>
                          <input
                            type="text"
                            value={block.alt || ''}
                            onChange={(e) => updateBlock(index, 'alt', e.target.value)}
                            className="block-input"
                            placeholder="Image description/alt text..."
                          />
                          <input
                            type="text"
                            value={block.caption || ''}
                            onChange={(e) => updateBlock(index, 'caption', e.target.value)}
                            className="block-input"
                            placeholder="Image caption..."
                          />
                        </>
                      )}

                      {block.type === 'cta' && (
                        <>
                          <input
                            type="text"
                            value={block.text || ''}
                            onChange={(e) => updateBlock(index, 'text', e.target.value)}
                            className="block-input"
                            placeholder="Button text..."
                          />
                          <input
                            type="text"
                            value={block.url || ''}
                            onChange={(e) => updateBlock(index, 'url', e.target.value)}
                            className="block-input"
                            placeholder="URL or path..."
                          />
                        </>
                      )}

                      {block.type === 'quote' && (
                        <input
                          type="text"
                          value={block.citation || ''}
                          onChange={(e) => updateBlock(index, 'citation', e.target.value)}
                          className="block-input"
                          placeholder="Citation/source (optional)..."
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="editor-actions">
            <button
              onClick={createFreeFormPost}
              disabled={isCreating || !title.trim()}
              className="btn btn-primary create-btn"
            >
              {isCreating ? (
                <>
                  <LoadingSpinner size="small" />
                  Creating Post...
                </>
              ) : (
                '🚀 Create Post'
              )}
            </button>
            
            <button
              onClick={resetForm}
              disabled={isCreating}
              className="btn btn-secondary"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeFormEditor;