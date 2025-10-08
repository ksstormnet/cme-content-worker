import React from 'react';
import { Editor } from '@tiptap/react';

interface EditorToolbarProps {
  editor: Editor | null;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const insertAccentTip = (type: 'tip' | 'warning' | 'info' | 'success') => {
    editor.commands.setAccentTip(type);
  };

  const insertCTA = () => {
    const url = prompt('Enter URL:');
    const text = prompt('Enter button text:');
    if (url && text) {
      editor.commands.setCTA({ text, url, type: 'primary', external: false });
    }
  };

  const insertImage = () => {
    const src = prompt('Enter image URL (Phase 2 will use media library):');
    const alt = prompt('Enter alt text:');
    if (src) {
      editor.commands.setImage({ src, alt: alt || '', alignment: 'center', size: 'large' });
    }
  };

  return (
    <div className="editor-toolbar">
      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive('code') ? 'is-active' : ''}
          title="Code"
        >
          {'<>'}
        </button>
      </div>

      <div className="toolbar-separator"></div>

      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
          title="Heading 3"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          className={editor.isActive('heading', { level: 4 }) ? 'is-active' : ''}
          title="Heading 4"
        >
          H4
        </button>
      </div>

      <div className="toolbar-separator"></div>

      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'is-active' : ''}
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'is-active' : ''}
          title="Ordered List"
        >
          1.
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'is-active' : ''}
          title="Quote"
        >
          "
        </button>
      </div>

      <div className="toolbar-separator"></div>

      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => insertAccentTip('tip')}
          title="Tip"
        >
          💡
        </button>
        <button
          type="button"
          onClick={() => insertAccentTip('warning')}
          title="Warning"
        >
          ⚠️
        </button>
        <button
          type="button"
          onClick={() => insertAccentTip('info')}
          title="Info"
        >
          ℹ️
        </button>
        <button
          type="button"
          onClick={() => insertAccentTip('success')}
          title="Success"
        >
          ✅
        </button>
      </div>

      <div className="toolbar-separator"></div>

      <div className="toolbar-group">
        <button
          type="button"
          onClick={insertImage}
          title="Insert Image"
        >
          🖼️
        </button>
        <button
          type="button"
          onClick={insertCTA}
          title="Insert CTA Button"
        >
          🔘
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Divider"
        >
          ─
        </button>
      </div>

      <div className="toolbar-separator"></div>

      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          ↷
        </button>
      </div>
    </div>
  );
};

export default EditorToolbar;
