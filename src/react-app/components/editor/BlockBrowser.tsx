/**
 * Block Browser Modal - Unified Alt+I interaction for block insertion and wrapping
 */
import React, { useEffect, useState } from 'react';
import './BlockBrowser.css';

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'accent_tip'
  | 'quote'
  | 'cta'
  | 'divider'
  | 'list'
  | 'bulletList'
  | 'orderedList'
  | 'section'
  | 'columns_2'
  | 'columns_3'
  | 'columns_4';

interface BlockDefinition {
  type: BlockType;
  icon: string;
  label: string;
  hotkey: string;
  category: 'common' | 'media' | 'layout';
  description: string;
}

interface BlockBrowserProps {
  isOpen: boolean;
  mode: 'insert' | 'wrap';
  selectedText: string | null;
  onBlockSelect: (blockType: BlockType, subtype?: string) => void;
  onClose: () => void;
}

const blockTypes: BlockDefinition[] = [
  {
    type: 'heading',
    icon: 'H',
    label: 'Heading',
    hotkey: 'H',
    category: 'common',
    description: 'Section heading (H2-H4)'
  },
  {
    type: 'paragraph',
    icon: '¶',
    label: 'Paragraph',
    hotkey: 'P',
    category: 'common',
    description: 'Standard text paragraph'
  },
  {
    type: 'accent_tip',
    icon: '💡',
    label: 'Callout',
    hotkey: 'C',
    category: 'common',
    description: 'Tip, warning, info, or success box'
  },
  {
    type: 'quote',
    icon: '"',
    label: 'Quote',
    hotkey: 'Q',
    category: 'common',
    description: 'Blockquote with optional citation'
  },
  {
    type: 'bulletList',
    icon: '•',
    label: 'Bullet List',
    hotkey: 'U',
    category: 'common',
    description: 'Unordered list'
  },
  {
    type: 'orderedList',
    icon: '1.',
    label: 'Numbered List',
    hotkey: 'O',
    category: 'common',
    description: 'Ordered list'
  },
  {
    type: 'image',
    icon: '🖼️',
    label: 'Image',
    hotkey: 'I',
    category: 'media',
    description: 'Insert from media library'
  },
  {
    type: 'section',
    icon: '📦',
    label: 'Section',
    hotkey: 'S',
    category: 'layout',
    description: 'Container for grouped content with background and padding'
  },
  {
    type: 'columns_2',
    icon: '▯▯',
    label: '2 Columns',
    hotkey: '2',
    category: 'layout',
    description: 'Two-column layout'
  },
  {
    type: 'columns_3',
    icon: '▯▯▯',
    label: '3 Columns',
    hotkey: '3',
    category: 'layout',
    description: 'Three-column layout'
  },
  {
    type: 'columns_4',
    icon: '▯▯▯▯',
    label: '4 Columns',
    hotkey: '4',
    category: 'layout',
    description: 'Four-column layout'
  },
  {
    type: 'cta',
    icon: '🔘',
    label: 'CTA Button',
    hotkey: 'B',
    category: 'layout',
    description: 'Call-to-action button'
  },
  {
    type: 'divider',
    icon: '━',
    label: 'Divider',
    hotkey: 'D',
    category: 'layout',
    description: 'Horizontal rule separator'
  },
];

const BlockBrowser: React.FC<BlockBrowserProps> = ({
  isOpen,
  mode,
  selectedText,
  onBlockSelect,
  onClose,
}) => {
  const [filter, setFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'common' | 'media' | 'layout'>('all');

  // Reset filter when modal opens
  useEffect(() => {
    if (isOpen) {
      setFilter('');
      setSelectedCategory('all');
    }
  }, [isOpen]);

  // Keyboard shortcuts handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes modal
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Hotkey shortcuts (single letter)
      const block = blockTypes.find(
        b => b.hotkey.toLowerCase() === e.key.toLowerCase()
      );

      if (block) {
        e.preventDefault();
        onBlockSelect(block.type);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onBlockSelect, onClose]);

  if (!isOpen) return null;

  // Filter blocks based on search and category
  const filteredBlocks = blockTypes.filter(block => {
    const matchesSearch = !filter ||
      block.label.toLowerCase().includes(filter.toLowerCase()) ||
      block.description.toLowerCase().includes(filter.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || block.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const renderBlockPreview = (block: BlockDefinition) => {
    switch (block.type) {
      case 'heading':
        return <div className="preview-heading">Heading Text</div>;
      case 'paragraph':
        return <div className="preview-paragraph">Paragraph text...</div>;
      case 'accent_tip':
        return (
          <div className="preview-callout">
            <span className="preview-callout-icon">💡</span>
            <span>Callout content</span>
          </div>
        );
      case 'quote':
        return <div className="preview-quote">"Quote text"</div>;
      case 'bulletList':
        return (
          <ul className="preview-list">
            <li>Item one</li>
            <li>Item two</li>
          </ul>
        );
      case 'orderedList':
        return (
          <ol className="preview-list">
            <li>Item one</li>
            <li>Item two</li>
          </ol>
        );
      case 'image':
        return <div className="preview-image">🖼️</div>;
      case 'section':
        return (
          <div className="preview-section">
            <div className="preview-section-content">Section container</div>
          </div>
        );
      case 'columns_2':
        return (
          <div className="preview-columns">
            <div className="preview-column">Col 1</div>
            <div className="preview-column">Col 2</div>
          </div>
        );
      case 'columns_3':
        return (
          <div className="preview-columns">
            <div className="preview-column">Col 1</div>
            <div className="preview-column">Col 2</div>
            <div className="preview-column">Col 3</div>
          </div>
        );
      case 'columns_4':
        return (
          <div className="preview-columns">
            <div className="preview-column">1</div>
            <div className="preview-column">2</div>
            <div className="preview-column">3</div>
            <div className="preview-column">4</div>
          </div>
        );
      case 'cta':
        return <div className="preview-cta">Button</div>;
      case 'divider':
        return <hr className="preview-divider" />;
      default:
        return null;
    }
  };

  return (
    <div className="block-browser-overlay" onClick={onClose}>
      <div className="block-browser" onClick={(e) => e.stopPropagation()}>
        <div className="block-browser-header">
          <div className="header-content">
            <h3>{mode === 'wrap' ? 'Wrap Selected Text' : 'Insert Block'}</h3>
            {selectedText && mode === 'wrap' && (
              <p className="selected-text-preview">
                "{selectedText.substring(0, 50)}{selectedText.length > 50 ? '...' : ''}"
              </p>
            )}
          </div>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="block-browser-search">
          <input
            type="text"
            placeholder="Search blocks or press hotkey..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            autoFocus
            className="search-input"
          />
        </div>

        <div className="block-browser-filters">
          <button
            className={`filter-button ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </button>
          <button
            className={`filter-button ${selectedCategory === 'common' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('common')}
          >
            Common
          </button>
          <button
            className={`filter-button ${selectedCategory === 'media' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('media')}
          >
            Media
          </button>
          <button
            className={`filter-button ${selectedCategory === 'layout' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('layout')}
          >
            Layout
          </button>
        </div>

        <div className="block-browser-grid">
          {filteredBlocks.map((block) => (
            <div
              key={block.type}
              className="block-card"
              onClick={() => onBlockSelect(block.type)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onBlockSelect(block.type);
                }
              }}
            >
              <div className="block-card-header">
                <span className="block-icon">{block.icon}</span>
                <kbd className="block-hotkey">{block.hotkey}</kbd>
              </div>
              <div className="block-name">{block.label}</div>
              <div className="block-description">{block.description}</div>
              <div className="block-preview">
                {renderBlockPreview(block)}
              </div>
            </div>
          ))}
        </div>

        {filteredBlocks.length === 0 && (
          <div className="no-results">
            <p>No blocks found matching "{filter}"</p>
          </div>
        )}

        <div className="block-browser-footer">
          <p className="footer-hint">
            <kbd>Esc</kbd> to close · Press hotkey letter to insert block
          </p>
        </div>
      </div>
    </div>
  );
};

export default BlockBrowser;
