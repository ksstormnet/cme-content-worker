import React from 'react';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface MediaLibraryProps {
  user: User;
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({ user }) => {
  return (
    <div className="media-library">
      <h2>Media Library</h2>
      <p>Advanced R2-based media library coming soon...</p>
      <p>Features planned:</p>
      <ul>
        <li>Drag & drop upload to R2 bucket</li>
        <li>Image optimization and resizing</li>
        <li>CDN integration</li>
        <li>Search and filtering</li>
        <li>Folder organization</li>
      </ul>
      <p>User: {user.name}</p>
    </div>
  );
};

export default MediaLibrary;