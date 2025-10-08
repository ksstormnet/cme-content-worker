import React from 'react';
import { EditorContent, Editor } from '@tiptap/react';
import EditorToolbar from './EditorToolbar';

interface EditorCanvasProps {
  editor: Editor | null;
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({ editor }) => {
  return (
    <div className="editor-canvas">
      <EditorToolbar editor={editor} />
      <div className="editor-content-wrapper">
        <EditorContent editor={editor} className="tiptap-editor" />
      </div>
      <div className="editor-hints">
        <p className="hint-text">
          💡 <strong>Tip:</strong> Type <code>/</code> for slash commands or use the toolbar above
        </p>
      </div>
    </div>
  );
};

export default EditorCanvas;
