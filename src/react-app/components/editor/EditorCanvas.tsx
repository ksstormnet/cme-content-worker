import React from 'react';
import { EditorContent, Editor } from '@tiptap/react';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface EditorCanvasProps {
  editor: Editor | null;
  user: User;
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({ editor }) => {
  return (
    <div className="editor-canvas">
      <div className="editor-content-wrapper">
        <EditorContent editor={editor} className="tiptap-editor" />
      </div>
      <div className="editor-hints">
        <p className="hint-text">
          <strong>Tip:</strong> Press <kbd>Alt+I</kbd> to insert or wrap blocks
        </p>
      </div>
    </div>
  );
};

export default EditorCanvas;
