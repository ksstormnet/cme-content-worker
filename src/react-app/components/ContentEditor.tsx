import React from 'react';

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
  created_at: string;
  updated_at: string;
  author_name?: string;
  excerpt?: string;
}

interface ContentEditorProps {
  user: User;
  onPostUpdated: (post: Post) => void;
}

const ContentEditor: React.FC<ContentEditorProps> = ({ user, onPostUpdated }) => {
  return (
    <div className="content-editor">
      <h2>Content Editor</h2>
      <p>Block-based content editor coming soon...</p>
      <p>User: {user.name}</p>
    </div>
  );
};

export default ContentEditor;