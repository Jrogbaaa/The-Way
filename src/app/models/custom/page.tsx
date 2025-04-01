'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { runCustomModel } from '@/lib/api/replicate';
import Link from 'next/link';

export default function CustomModelPage() {
  const [owner, setOwner] = useState('');
  const [modelName, setModelName] = useState('');
  const [version, setVersion] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const output = await runCustomModel(
        owner,
        modelName,
        version,
        { prompt }
      );
      
      // The output is typically an array of image URLs
      if (Array.isArray(output)) {
        setImageUrls(output);
      } else if (typeof output === 'string') {
        setImageUrls([output]);
      } else {
        console.log('Unexpected output format:', output);
        setImageUrls([]);
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/models">
            ← Back to Models
          </Link>
        </Button>
        <h2 className="text-2xl font-bold">Custom Model Test</h2>
      </div>
      
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
        <p>
          <strong>Note:</strong> For this to work, you need to provide a valid Replicate model in the format:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Owner: The account name (e.g., "stability-ai")</li>
          <li>Model Name: The model name (e.g., "stable-diffusion")</li>
          <li>Version: The specific version hash (e.g., "db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf")</li>
        </ul>
      </div>
      
      <form onSubmit={handleGenerate} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="owner" className="block text-sm font-medium mb-1">
              Owner
            </label>
            <input
              id="owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="stability-ai"
              required
            />
          </div>
          
          <div>
            <label htmlFor="model-name" className="block text-sm font-medium mb-1">
              Model Name
            </label>
            <input
              id="model-name"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="stable-diffusion"
              required
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="version" className="block text-sm font-medium mb-1">
            Version Hash
          </label>
          <input
            id="version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf"
            required
          />
        </div>
        
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium mb-1">
            Prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            rows={3}
            placeholder="A photo of a cat in space"
            required
          />
        </div>
        
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Generating...' : 'Generate Image'}
        </Button>
      </form>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {imageUrls.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Generated Images</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {imageUrls.map((url, index) => (
              <div key={index} className="overflow-hidden rounded-lg border bg-card">
                <img 
                  src={url} 
                  alt={`Generated image ${index + 1}`} 
                  className="w-full h-auto"
                />
                <div className="p-3 border-t">
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Open Full Size
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 