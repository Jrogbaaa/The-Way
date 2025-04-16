'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';

export default function TestBriaPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [direction, setDirection] = useState<string>('bottom');
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{ url: string | null; method: string | null }>({ url: null, method: null });
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult({ url: null, method: null });
    setError(null);

    if (!imageFile) {
      setError('Please select an image');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('direction', direction);
      if (prompt) {
        formData.append('prompt', prompt);
      }

      const response = await fetch('/api/bria/expand', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Error: API call failed');
      }

      if (data.success && data.results && data.results[0] && data.results[0].url) {
        setResult({ 
          url: data.results[0].url,
          method: data.method || 'mock-api'
        });
      } else if (data.success && data.result_url) {
        setResult({
          url: data.result_url,
          method: data.method || 'unknown'
        });
      } else {
        throw new Error('No result URL returned');
      }
    } catch (err: any) {
      console.error('Error testing Bria API:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">BRIA AI API Test Page</h1>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <p className="text-yellow-800">
          This page tests BRIA API integration using two different approaches:
        </p>
        <ol className="list-decimal ml-5 mt-2 text-yellow-700">
          <li>Direct FormData approach with file upload (matches CURL examples in docs)</li>
          <li>Two-step register + expand approach (register image first, then expand with visual_id)</li>
          <li>Basic binary upload as fallback</li>
        </ol>
        <p className="mt-2 text-yellow-800">Check server logs for detailed error information.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 mb-8 p-6 bg-white rounded-lg shadow-md">
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
            Upload Image (required)
          </label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {imagePreview && (
            <div className="mt-2 relative h-48 w-full">
              <Image
                src={imagePreview}
                alt="Preview"
                fill
                className="object-contain rounded-md"
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="direction" className="block text-sm font-medium text-gray-700 mb-1">
            Expansion Direction
          </label>
          <select
            id="direction"
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="top">Top</option>
            <option value="right">Right</option>
            <option value="bottom">Bottom</option>
            <option value="left">Left</option>
          </select>
        </div>

        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
            Prompt (optional)
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
            placeholder="Enter prompt for the expanded area"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test BRIA API'}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p className="font-medium">Error:</p>
          <p className="whitespace-pre-wrap">{error}</p>
          <p className="mt-2 text-sm">See browser console and server logs for more details.</p>
        </div>
      )}

      {result.url && (
        <div className="rounded-lg overflow-hidden shadow-lg bg-white p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Success! Using method: <span className="text-green-600">{result.method}</span>
          </h2>
          {result.method === 'mock-fallback' && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="text-yellow-800">
                <strong>Note:</strong> Using mock response because the API call failed. Check server logs for details.
              </p>
            </div>
          )}
          {result.method === 'mock-api' && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <p className="text-blue-800">
                <strong>Note:</strong> Using mock API response since no Bria API key is configured.
              </p>
            </div>
          )}
          <div className="relative h-96 w-full">
            <Image
              src={result.url}
              alt="Result"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
} 