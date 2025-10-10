/**
 * Block Settings Sidebar - Slides in when block is focused
 * Shows block-type-specific settings
 */
import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import './BlockSettingsSidebar.css';

interface BlockSettingsSidebarProps {
  editor: Editor | null;
  isOpen: boolean;
  blockType: string | null;
  onClose: () => void;
}


const BlockSettingsSidebar: React.FC<BlockSettingsSidebarProps> = ({
  editor,
  isOpen,
  blockType,
  onClose,
}) => {
  if (!editor || !isOpen || !blockType) {
    return null;
  }

  const renderHeadingSettings = () => (
    <div className="settings-content">
      <h4 className="settings-title">Heading Settings</h4>

      <div className="setting-group">
        <label className="setting-label">Heading Level</label>
        <div className="button-group">
          <button
            className={`btn-setting ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </button>
          <button
            className={`btn-setting ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            H3
          </button>
          <button
            className={`btn-setting ${editor.isActive('heading', { level: 4 }) ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          >
            H4
          </button>
        </div>
      </div>
    </div>
  );

  const renderParagraphSettings = () => (
    <div className="settings-content">
      <h4 className="settings-title">Paragraph Settings</h4>

      <div className="setting-group">
        <label className="setting-label">Text Formatting</label>
        <div className="button-group">
          <button
            className={`btn-setting ${editor.isActive('bold') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            className={`btn-setting ${editor.isActive('italic') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            className={`btn-setting ${editor.isActive('code') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleCode().run()}
            title="Code"
          >
            {'<>'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderAccentTipSettings = () => {
    // Get current callout type from editor
    const { $from } = editor.state.selection;
    const node = $from.node($from.depth);
    const currentType = node?.attrs?.type || 'tip';

    const [calloutType, setCalloutType] = useState<string>(currentType);

    // Sync state when selection changes
    useEffect(() => {
      const { $from } = editor.state.selection;
      const node = $from.node($from.depth);
      if (node && node.type.name === 'accentTip') {
        setCalloutType(node.attrs.type || 'tip');
      }
    }, [editor.state.selection]);

    const handleTypeChange = (type: 'tip' | 'warning' | 'alert' | 'info' | 'success') => {
      setCalloutType(type);
      // Use updateAttributes instead of setAccentTip to change type of existing block
      editor.chain().focus().updateAttributes('accentTip', { type }).run();
    };

    return (
      <div className="settings-content">
        <h4 className="settings-title">Callout Settings</h4>

        <div className="setting-group">
          <label className="setting-label">Callout Type</label>
          <div className="callout-types">
            <button
              className={`callout-type-btn tip ${calloutType === 'tip' ? 'active' : ''}`}
              onClick={() => handleTypeChange('tip')}
            >
              <span className="callout-icon">💡</span>
              <span>Tip</span>
            </button>
            <button
              className={`callout-type-btn warning ${calloutType === 'warning' ? 'active' : ''}`}
              onClick={() => handleTypeChange('warning')}
            >
              <span className="callout-icon">⚠️</span>
              <span>Warning</span>
            </button>
            <button
              className={`callout-type-btn alert ${calloutType === 'alert' ? 'active' : ''}`}
              onClick={() => handleTypeChange('alert')}
            >
              <span className="callout-icon">🚨</span>
              <span>Alert</span>
            </button>
            <button
              className={`callout-type-btn info ${calloutType === 'info' ? 'active' : ''}`}
              onClick={() => handleTypeChange('info')}
            >
              <span className="callout-icon">ℹ️</span>
              <span>Info</span>
            </button>
            <button
              className={`callout-type-btn success ${calloutType === 'success' ? 'active' : ''}`}
              onClick={() => handleTypeChange('success')}
            >
              <span className="callout-icon">✅</span>
              <span>Success</span>
            </button>
          </div>
          <p className="setting-help">
            Choose the semantic meaning of this callout
          </p>
        </div>
      </div>
    );
  };

  const renderImageSettings = () => {
    // Get current image attributes from editor
    const { $from } = editor.state.selection;
    const node = $from.node($from.depth);
    const attrs = node?.attrs || {};

    const [caption, setCaption] = useState<string>(attrs.caption || '');
    const [alignment, setAlignment] = useState<string>(attrs.alignment || 'center');
    const [size, setSize] = useState<string>(attrs.size || 'large');

    // Sync state when selection changes
    useEffect(() => {
      const { $from } = editor.state.selection;
      const node = $from.node($from.depth);
      if (node && node.type.name === 'image') {
        setCaption(node.attrs.caption || '');
        setAlignment(node.attrs.alignment || 'center');
        setSize(node.attrs.size || 'large');
      }
    }, [editor.state.selection]);

    const handleCaptionChange = (value: string) => {
      setCaption(value);
      editor.chain().focus().setImageCaption(value || null).run();
    };

    const handleAlignmentChange = (newAlignment: 'left' | 'center' | 'right') => {
      setAlignment(newAlignment);
      editor.chain().focus().setImageAlignment(newAlignment).run();
    };

    const handleSizeChange = (newSize: 'thumbnail' | 'medium' | 'large' | 'full') => {
      setSize(newSize);
      editor.chain().focus().setImageSize(newSize).run();
    };

    return (
      <div className="settings-content">
        <h4 className="settings-title">Image Settings</h4>

        <div className="setting-group">
          <label className="setting-label">Alignment</label>
          <div className="button-group">
            <button
              className={`btn-setting ${alignment === 'left' ? 'active' : ''}`}
              onClick={() => handleAlignmentChange('left')}
            >
              Left
            </button>
            <button
              className={`btn-setting ${alignment === 'center' ? 'active' : ''}`}
              onClick={() => handleAlignmentChange('center')}
            >
              Center
            </button>
            <button
              className={`btn-setting ${alignment === 'right' ? 'active' : ''}`}
              onClick={() => handleAlignmentChange('right')}
            >
              Right
            </button>
          </div>
        </div>

        <div className="setting-group">
          <label className="setting-label">Size</label>
          <select
            className="setting-select"
            value={size}
            onChange={(e) => handleSizeChange(e.target.value as any)}
          >
            <option value="thumbnail">Thumbnail</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="full">Full Width</option>
          </select>
        </div>

        <div className="setting-group">
          <label className="setting-label">Caption (Optional)</label>
          <textarea
            className="setting-textarea"
            placeholder="Add a caption to provide context..."
            rows={3}
            value={caption}
            onChange={(e) => handleCaptionChange(e.target.value)}
          />
          <p className="setting-help">
            Helps with accessibility and provides context for readers
          </p>
        </div>
      </div>
    );
  };

  const renderQuoteSettings = () => (
    <div className="settings-content">
      <h4 className="settings-title">Quote Settings</h4>

      <div className="setting-group">
        <label className="setting-label">Alignment</label>
        <div className="button-group">
          <button className="btn-setting">
            Left
          </button>
          <button className="btn-setting">
            Center
          </button>
          <button className="btn-setting">
            Right
          </button>
        </div>
      </div>

      <div className="setting-group">
        <label className="setting-label">Citation</label>
        <input
          type="text"
          className="setting-input"
          placeholder="Author name..."
        />
      </div>
    </div>
  );

  const renderCTASettings = () => (
    <div className="settings-content">
      <h4 className="settings-title">CTA Button Settings</h4>

      <div className="setting-group">
        <label className="setting-label">Button Style</label>
        <div className="button-group">
          <button className="btn-setting active">
            Primary
          </button>
          <button className="btn-setting">
            Secondary
          </button>
        </div>
      </div>

      <div className="setting-group">
        <label className="setting-label">Button Text</label>
        <input
          type="text"
          className="setting-input"
          placeholder="Click Here"
        />
      </div>

      <div className="setting-group">
        <label className="setting-label">URL</label>
        <input
          type="url"
          className="setting-input"
          placeholder="https://..."
        />
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input type="checkbox" />
          <span>Open in new tab</span>
        </label>
      </div>
    </div>
  );

  const renderListSettings = () => (
    <div className="settings-content">
      <h4 className="settings-title">List Settings</h4>

      <div className="setting-group">
        <label className="setting-label">List Type</label>
        <div className="button-group">
          <button
            className={`btn-setting ${editor.isActive('bulletList') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            Bullet
          </button>
          <button
            className={`btn-setting ${editor.isActive('orderedList') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            Numbered
          </button>
        </div>
      </div>
    </div>
  );

  const renderDefaultSettings = () => (
    <div className="settings-content">
      <h4 className="settings-title">Block Settings</h4>
      <p className="settings-empty">No settings available for this block type.</p>
    </div>
  );

  const renderSettings = () => {
    switch (blockType) {
      case 'heading':
        return renderHeadingSettings();
      case 'paragraph':
        return renderParagraphSettings();
      case 'accentTip':
        return renderAccentTipSettings();
      case 'image':
        return renderImageSettings();
      case 'blockquote':
        return renderQuoteSettings();
      case 'cta':
        return renderCTASettings();
      case 'bulletList':
      case 'orderedList':
        return renderListSettings();
      default:
        return renderDefaultSettings();
    }
  };

  return (
    <div className={`block-settings-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h3>Block Settings</h3>
        <button
          className="close-btn"
          onClick={onClose}
          aria-label="Close settings"
        >
          ×
        </button>
      </div>
      {renderSettings()}
    </div>
  );
};

export default BlockSettingsSidebar;
