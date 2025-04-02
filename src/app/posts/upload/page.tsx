import PostUploadForm from '@/components/PostUploadForm';

export const metadata = {
  title: 'Analyze Post - The Way',
  description: 'Upload a new post with social media suitability analysis',
};

export default function UploadPostPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analyze Post</h1>
          <p className="text-gray-600">
            Create a new post with automatic image analysis for social media engagement
          </p>
        </div>
        
        <PostUploadForm />
      </div>
    </div>
  );
} 