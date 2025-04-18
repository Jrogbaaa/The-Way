'use client';

import { useState } from 'react';

const PhotoEditor = () => {
  const [image, setImage] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Photo Editor</h2>
      <p className="text-gray-600">Upload a photo to edit and enhance.</p>
      
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
        {!image ? (
          <div className="space-y-4">
            <div className="text-gray-500">Drag and drop an image or click to browse</div>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload} 
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>
        ) : (
          <div className="space-y-4 w-full">
            <img src={image} alt="Uploaded" className="max-h-[400px] mx-auto" />
            <div className="flex gap-2 justify-center">
              <button 
                onClick={() => setImage(null)} 
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm"
              >
                Remove
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Placeholder for future editing tools */}
      <div className="mt-8">
        <p className="text-sm text-gray-500">More editing features coming soon.</p>
      </div>
    </div>
  );
};

export default PhotoEditor;
