import SocialMediaAnalyzer from '@/components/SocialMediaAnalyzer';

export const metadata = {
  title: 'Social Media Post Analyzer - The Way',
  description: 'Analyze your social media posts for engagement potential using AI',
};

export default function SocialAnalyzerPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Social Media Post Analyzer</h1>
        <p className="text-gray-600 mb-8">
          Upload your images to analyze their engagement potential for social media using Hugging Face AI models.
        </p>
        
        <SocialMediaAnalyzer />
        
        <div className="mt-12 bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">How It Works</h2>
          <div className="space-y-4 text-gray-600">
            <p>
              Our social media analyzer uses open-source AI models from Hugging Face to evaluate your posts:
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Upload your image to get started</li>
              <li>The AI analyzes your image content to understand what's in it</li>
              <li>The system evaluates engagement potential based on content analysis</li>
              <li>Get detailed pros, cons, and recommendations to improve performance</li>
            </ol>
            <p className="text-sm mt-6">
              This tool uses the BLIP image captioning model and natural language inference to predict engagement, 
              all powered by Hugging Face's open-source models.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 