/**
 * Block Settings Sidebar - Slides in when block is focused
 * Shows block-type-specific settings
 */
import React from 'react';
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

  const renderAccentTipSettings = () => (
    <div className="settings-content">
      <h4 className="settings-title">Callout Settings</h4>

      <div className="setting-group">
        <label className="setting-label">Callout Type</label>
        <div className="callout-types">
          <button
            className={`callout-type-btn tip ${editor.isActive('accentTip', { type: 'tip' }) ? 'active' : ''}`}
            onClick={() => editor.commands.setAccentTip('tip')}
          >
            <span className="callout-icon">💡</span>
            <span>Tip</span>
          </button>
          <button
            className={`callout-type-btn warning ${editor.isActive('accentTip', { type: 'warning' }) ? 'active' : ''}`}
            onClick={() => editor.commands.setAccentTip('warning')}
          >
            <span className="callout-icon">⚠️</span>
            <span>Warning</span>
          </button>
          <button
            className={`callout-type-btn info ${editor.isActive('accentTip', { type: 'info' }) ? 'active' : ''}`}
            onClick={() => editor.commands.setAccentTip('info')}
          >
            <span className="callout-icon">ℹ️</span>
            <span>Info</span>
          </button>
          <button
            className={`callout-type-btn success ${editor.isActive('accentTip', { type: 'success' }) ? 'active' : ''}`}
            onClick={() => editor.commands.setAccentTip('success')}
          >
            <span className="callout-icon">✅</span>
            <span>Success</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderImageSettings = () => (
    <div className="settings-content">
      <h4 className="settings-title">Image Settings</h4>

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
        <label className="setting-label">Size</label>
        <select className="setting-select">
          <option value="thumbnail">Thumbnail</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="full">Full Width</option>
        </select>
      </div>

      <div className="setting-group">
        <label className="setting-label">Alt Text</label>
        <input
          type="text"
          className="setting-input"
          placeholder="Describe the image..."
        />
      </div>

      <div className="setting-group">
        <label className="setting-label">Caption</label>
        <textarea
          className="setting-textarea"
          placeholder="Optional caption..."
          rows={2}
        />
      </div>
    </div>
  );

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
