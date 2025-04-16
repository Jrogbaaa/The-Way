'use client';

import React from 'react';
import PhotoEditor from '@/components/PhotoEditor'; // Import the component we worked on

const PhotoEditorPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Render the actual PhotoEditor component */}
      <PhotoEditor />
    </div>
  );
};

export default PhotoEditorPage; 