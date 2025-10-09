import React, { useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';
import './FloatingToolbar.css';

interface FloatingToolbarProps {
  editor: Editor;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ editor }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleSelectionChange = () => {
      const { state } = editor;
      const { selection } = state;
      const { from, to } = selection;

      // Show toolbar if text is selected
      if (from !== to) {
        const domSelection = window.getSelection();
        if (domSelection && domSelection.rangeCount > 0) {
          const range = domSelection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          setPosition({
            top: rect.top - 50 + window.scrollY,
            left: rect.left + rect.width / 2
          });
          setIsVisible(true);
        }
      } else {
        setIsVisible(false);
      }
    };

    editor.on('selectionUpdate', handleSelectionChange);
    return () => {
      editor.off('selectionUpdate', handleSelectionChange);
    };
  }, [editor]);

  if (!isVisible) return null;

  return (
    <div
      className="floating-toolbar"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)'
      }}
    >
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'active' : ''}
        title="Bold"
      >
        <strong>B</strong>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'active' : ''}
        title="Italic"
      >
        <em>I</em>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
        title="Heading"
      >
        H
      </button>
      <button
        onClick={() => {
          const url = window.prompt('Enter URL:');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={editor.isActive('link') ? 'active' : ''}
        title="Link"
      >
        🔗
      </button>
    </div>
  );
};

export default FloatingToolbar;
