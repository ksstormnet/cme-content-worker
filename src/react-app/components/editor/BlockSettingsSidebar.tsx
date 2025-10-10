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
  // ===== ALL HOOKS AT COMPONENT LEVEL =====
  // Image settings state
  const [imageCaption, setImageCaption] = useState<string>('');
  const [imageAlignment, setImageAlignment] = useState<string>('center');
  const [imageSize, setImageSize] = useState<string>('large');

  // Callout settings state
  const [calloutType, setCalloutType] = useState<string>('tip');

  // Section settings state
  const [sectionBackgroundColor, setSectionBackgroundColor] = useState<string>('');
  const [sectionTextColor, setSectionTextColor] = useState<string>('');
  const [sectionPadding, setSectionPadding] = useState<string>('medium');
  const [sectionStyle, setSectionStyle] = useState<string>('default');
  const [sectionFullWidth, setSectionFullWidth] = useState<boolean>(false);

  // Columns settings state
  const [columnsCount, setColumnsCount] = useState<number>(2);
  const [columnsGap, setColumnsGap] = useState<string>('medium');

  // Sync state when editor selection changes
  useEffect(() => {
    if (!editor) return;

    const { $from } = editor.state.selection;
    const node = $from.node($from.depth);

    if (node && node.type.name === 'image') {
      setImageCaption(node.attrs.caption || '');
      setImageAlignment(node.attrs.alignment || 'center');
      setImageSize(node.attrs.size || 'large');
    }

    if (node && node.type.name === 'accentTip') {
      setCalloutType(node.attrs.type || 'tip');
    }

    if (node && node.type.name === 'section') {
      setSectionBackgroundColor(node.attrs.backgroundColor || '');
      setSectionTextColor(node.attrs.textColor || '');
      setSectionPadding(node.attrs.padding || 'medium');
      setSectionStyle(node.attrs.style || 'default');
      setSectionFullWidth(node.attrs.fullWidth || false);
    }

    if (node && node.type.name === 'columns') {
      setColumnsCount(node.attrs.columnCount || 2);
      setColumnsGap(node.attrs.gap || 'medium');
    }
  }, [editor, editor?.state.selection]);

  // ===== HANDLERS =====
  const handleImageCaptionChange = (value: string) => {
    setImageCaption(value);
    editor?.chain().focus().setImageCaption(value || null).run();
  };

  const handleImageAlignmentChange = (newAlignment: 'left' | 'center' | 'right') => {
    setImageAlignment(newAlignment);
    editor?.chain().focus().setImageAlignment(newAlignment).run();
  };

  const handleImageSizeChange = (newSize: 'thumbnail' | 'medium' | 'large' | 'full') => {
    setImageSize(newSize);
    editor?.chain().focus().setImageSize(newSize).run();
  };

  const handleCalloutTypeChange = (type: 'tip' | 'warning' | 'alert' | 'info' | 'success') => {
    setCalloutType(type);
    editor?.chain().focus().updateAttributes('accentTip', { type }).run();
  };

  const handleSectionBackgroundColorChange = (value: string) => {
    setSectionBackgroundColor(value);
    editor?.chain().focus().updateAttributes('section', { backgroundColor: value || null }).run();
  };

  const handleSectionTextColorChange = (value: string) => {
    setSectionTextColor(value);
    editor?.chain().focus().updateAttributes('section', { textColor: value || null }).run();
  };

  const handleSectionPaddingChange = (padding: 'none' | 'small' | 'medium' | 'large') => {
    setSectionPadding(padding);
    editor?.chain().focus().updateAttributes('section', { padding }).run();
  };

  const handleSectionStyleChange = (style: 'default' | 'accent' | 'highlight') => {
    setSectionStyle(style);
    editor?.chain().focus().updateAttributes('section', { style }).run();
  };

  const handleSectionFullWidthChange = (fullWidth: boolean) => {
    setSectionFullWidth(fullWidth);
    editor?.chain().focus().updateAttributes('section', { fullWidth }).run();
  };

  const handleColumnsCountChange = (count: 2 | 3 | 4) => {
    setColumnsCount(count);
    editor?.chain().focus().updateAttributes('columns', { columnCount: count }).run();
  };

  const handleColumnsGapChange = (gap: 'none' | 'small' | 'medium' | 'large') => {
    setColumnsGap(gap);
    editor?.chain().focus().updateAttributes('columns', { gap }).run();
  };

  // ===== RENDER GUARDS =====
  if (!editor || !isOpen || !blockType) {
    return null;
  }

  // ===== RENDER FUNCTIONS =====
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
    return (
      <div className="settings-content">
        <h4 className="settings-title">Callout Settings</h4>

        <div className="setting-group">
          <label className="setting-label">Callout Type</label>
          <div className="callout-types">
            <button
              className={`callout-type-btn tip ${calloutType === 'tip' ? 'active' : ''}`}
              onClick={() => handleCalloutTypeChange('tip')}
            >
              <span className="callout-icon">💡</span>
              <span>Tip</span>
            </button>
            <button
              className={`callout-type-btn warning ${calloutType === 'warning' ? 'active' : ''}`}
              onClick={() => handleCalloutTypeChange('warning')}
            >
              <span className="callout-icon">⚠️</span>
              <span>Warning</span>
            </button>
            <button
              className={`callout-type-btn alert ${calloutType === 'alert' ? 'active' : ''}`}
              onClick={() => handleCalloutTypeChange('alert')}
            >
              <span className="callout-icon">🚨</span>
              <span>Alert</span>
            </button>
            <button
              className={`callout-type-btn info ${calloutType === 'info' ? 'active' : ''}`}
              onClick={() => handleCalloutTypeChange('info')}
            >
              <span className="callout-icon">ℹ️</span>
              <span>Info</span>
            </button>
            <button
              className={`callout-type-btn success ${calloutType === 'success' ? 'active' : ''}`}
              onClick={() => handleCalloutTypeChange('success')}
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
    return (
      <div className="settings-content">
        <h4 className="settings-title">Image Settings</h4>

        <div className="setting-group">
          <label className="setting-label">Alignment</label>
          <div className="button-group">
            <button
              className={`btn-setting ${imageAlignment === 'left' ? 'active' : ''}`}
              onClick={() => handleImageAlignmentChange('left')}
            >
              Left
            </button>
            <button
              className={`btn-setting ${imageAlignment === 'center' ? 'active' : ''}`}
              onClick={() => handleImageAlignmentChange('center')}
            >
              Center
            </button>
            <button
              className={`btn-setting ${imageAlignment === 'right' ? 'active' : ''}`}
              onClick={() => handleImageAlignmentChange('right')}
            >
              Right
            </button>
          </div>
        </div>

        <div className="setting-group">
          <label className="setting-label">Size</label>
          <select
            className="setting-select"
            value={imageSize}
            onChange={(e) => handleImageSizeChange(e.target.value as any)}
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
            value={imageCaption}
            onChange={(e) => handleImageCaptionChange(e.target.value)}
          />
          <p className="setting-help">
            Helps with accessibility and provides context for readers
          </p>
        </div>
      </div>
    );
  };

  const renderSectionSettings = () => {
    return (
      <div className="settings-content">
        <h4 className="settings-title">Section Settings</h4>

        <div className="setting-group">
          <label className="setting-label">Background Color</label>
          <input
            type="text"
            className="setting-input"
            placeholder="#ffffff or rgba(255, 255, 255, 0.5)"
            value={sectionBackgroundColor}
            onChange={(e) => handleSectionBackgroundColorChange(e.target.value)}
          />
          <p className="setting-help">
            Use hex colors (#ffffff) or rgba values
          </p>
        </div>

        <div className="setting-group">
          <label className="setting-label">Text Color</label>
          <input
            type="text"
            className="setting-input"
            placeholder="#000000 or rgba(0, 0, 0, 1)"
            value={sectionTextColor}
            onChange={(e) => handleSectionTextColorChange(e.target.value)}
          />
          <p className="setting-help">
            Color for all text within this section
          </p>
        </div>

        <div className="setting-group">
          <label className="setting-label">Padding</label>
          <div className="button-group">
            <button
              className={`btn-setting ${sectionPadding === 'none' ? 'active' : ''}`}
              onClick={() => handleSectionPaddingChange('none')}
            >
              None
            </button>
            <button
              className={`btn-setting ${sectionPadding === 'small' ? 'active' : ''}`}
              onClick={() => handleSectionPaddingChange('small')}
            >
              Small
            </button>
            <button
              className={`btn-setting ${sectionPadding === 'medium' ? 'active' : ''}`}
              onClick={() => handleSectionPaddingChange('medium')}
            >
              Medium
            </button>
            <button
              className={`btn-setting ${sectionPadding === 'large' ? 'active' : ''}`}
              onClick={() => handleSectionPaddingChange('large')}
            >
              Large
            </button>
          </div>
        </div>

        <div className="setting-group">
          <label className="setting-label">Style Preset</label>
          <div className="button-group">
            <button
              className={`btn-setting ${sectionStyle === 'default' ? 'active' : ''}`}
              onClick={() => handleSectionStyleChange('default')}
            >
              Default
            </button>
            <button
              className={`btn-setting ${sectionStyle === 'accent' ? 'active' : ''}`}
              onClick={() => handleSectionStyleChange('accent')}
            >
              Accent
            </button>
            <button
              className={`btn-setting ${sectionStyle === 'highlight' ? 'active' : ''}`}
              onClick={() => handleSectionStyleChange('highlight')}
            >
              Highlight
            </button>
          </div>
          <p className="setting-help">
            Applies predefined styling to the section
          </p>
        </div>

        <div className="setting-group">
          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={sectionFullWidth}
              onChange={(e) => handleSectionFullWidthChange(e.target.checked)}
            />
            <span>Full Width</span>
          </label>
          <p className="setting-help">
            Expand section to full page width
          </p>
        </div>
      </div>
    );
  };

  const renderColumnsSettings = () => {
    return (
      <div className="settings-content">
        <h4 className="settings-title">Columns Settings</h4>

        <div className="setting-group">
          <label className="setting-label">Column Count</label>
          <div className="button-group">
            <button
              className={`btn-setting ${columnsCount === 2 ? 'active' : ''}`}
              onClick={() => handleColumnsCountChange(2)}
            >
              2 Columns
            </button>
            <button
              className={`btn-setting ${columnsCount === 3 ? 'active' : ''}`}
              onClick={() => handleColumnsCountChange(3)}
            >
              3 Columns
            </button>
            <button
              className={`btn-setting ${columnsCount === 4 ? 'active' : ''}`}
              onClick={() => handleColumnsCountChange(4)}
            >
              4 Columns
            </button>
          </div>
          <p className="setting-help">
            Number of columns in the layout
          </p>
        </div>

        <div className="setting-group">
          <label className="setting-label">Gap Size</label>
          <div className="button-group">
            <button
              className={`btn-setting ${columnsGap === 'none' ? 'active' : ''}`}
              onClick={() => handleColumnsGapChange('none')}
            >
              None
            </button>
            <button
              className={`btn-setting ${columnsGap === 'small' ? 'active' : ''}`}
              onClick={() => handleColumnsGapChange('small')}
            >
              Small
            </button>
            <button
              className={`btn-setting ${columnsGap === 'medium' ? 'active' : ''}`}
              onClick={() => handleColumnsGapChange('medium')}
            >
              Medium
            </button>
            <button
              className={`btn-setting ${columnsGap === 'large' ? 'active' : ''}`}
              onClick={() => handleColumnsGapChange('large')}
            >
              Large
            </button>
          </div>
          <p className="setting-help">
            Space between columns
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
      case 'section':
        return renderSectionSettings();
      case 'columns':
        return renderColumnsSettings();
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
