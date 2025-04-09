import PhotoEditor from '../../components/PhotoEditor';

export const metadata = {
  title: 'Photo Editor - THE WAY',
  description: 'Edit your photos using AI and enhance them with just a few clicks',
};

export default function PhotoEditorPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <PhotoEditor />
    </div>
  );
} 