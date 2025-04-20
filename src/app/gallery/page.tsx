'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import { Tooltip } from '@/components/ui/tooltip';
import { Heart, MessageCircle, Share2, Plus, Filter, Zap, Camera, Clock, ImageIcon, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/config';
import { supabase } from '@/lib/supabase';

type GalleryItem = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  likes: number;
  comments: number;
  date: string;
  tags: string[];
  author: {
    name: string;
    avatar: string;
  };
};

export default function GalleryPage() {
  const router = useRouter();
  const { user } = useAuth();
  // Example gallery items for presentation
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([
    {
      id: '1',
      title: 'Sunset at the Beach',
      description: 'A beautiful sunset captured at Malibu Beach with vibrant orange and purple hues.',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      likes: 248,
      comments: 42,
      date: '2 days ago',
      tags: ['nature', 'sunset', 'beach', 'photography'],
      author: {
        name: 'Alex Morgan',
        avatar: 'https://i.pravatar.cc/150?img=11',
      },
    },
    {
      id: '2',
      title: 'Urban Coffee Shop',
      description: 'Minimalist coffee shop interior with modern design elements and warm lighting.',
      imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      likes: 176,
      comments: 28,
      date: '3 days ago',
      tags: ['coffee', 'interior', 'design', 'urban'],
      author: {
        name: 'Jamie Chen',
        avatar: 'https://i.pravatar.cc/150?img=29',
      },
    },
    {
      id: '3',
      title: 'Mountain Adventure',
      description: 'Hiking through the misty mountains at dawn, capturing the first light of day.',
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      likes: 324,
      comments: 56,
      date: '1 week ago',
      tags: ['mountains', 'hiking', 'adventure', 'nature'],
      author: {
        name: 'Chris Walker',
        avatar: 'https://i.pravatar.cc/150?img=8',
      },
    },
    {
      id: '4',
      title: 'City Skyline at Night',
      description: 'Breathtaking view of the city skyline illuminated at night from a rooftop perspective.',
      imageUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      likes: 412,
      comments: 67,
      date: '2 weeks ago',
      tags: ['cityscape', 'night', 'urban', 'skyline'],
      author: {
        name: 'Taylor Kim',
        avatar: 'https://i.pravatar.cc/150?img=23',
      },
    },
    {
      id: '5',
      title: 'Minimalist Product Photography',
      description: 'Clean product photography with minimalist aesthetics and careful attention to composition.',
      imageUrl: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      likes: 198,
      comments: 32,
      date: '3 weeks ago',
      tags: ['product', 'minimalist', 'photography', 'design'],
      author: {
        name: 'Jordan Reed',
        avatar: 'https://i.pravatar.cc/150?img=15',
      },
    },
    {
      id: '6',
      title: 'Spring Flowers in Bloom',
      description: 'Vibrant spring flowers blooming in a meadow, showcasing the colors of the season.',
      imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      likes: 287,
      comments: 45,
      date: '1 month ago',
      tags: ['flowers', 'spring', 'nature', 'colorful'],
      author: {
        name: 'Sam Johnson',
        avatar: 'https://i.pravatar.cc/150?img=12',
      },
    },
  ]);

  const [selectedFilter, setSelectedFilter] = useState('all');
  const [animateIn, setAnimateIn] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filters = [
    { name: 'all', label: 'All' },
    { name: 'nature', label: 'Nature' },
    { name: 'urban', label: 'Urban' },
    { name: 'design', label: 'Design' },
    { name: 'photography', label: 'Photography' },
  ];

  // Trigger animations after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateIn(true);
    }, 100);
    
    // Auto-hide tip after 8 seconds
    const tipTimer = setTimeout(() => {
      setShowTip(false);
    }, 8000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(tipTimer);
    };
  }, []);

  // Load user's gallery items on page load
  useEffect(() => {
    if (user) {
      fetchGalleryItems();
    }
  }, [user]);

  // Function to fetch gallery items from Supabase storage
  const fetchGalleryItems = async () => {
    if (!user) {
      console.log('GalleryPage: No user, skipping gallery fetch');
      return;
    }

    try {
      console.log('GalleryPage: Fetching user gallery items for user:', user.id);
      
      // Show loading spinner or message
      setIsLoadingGallery(true);
      
      // Fetch items from Supabase storage
      const { data: files, error } = await supabase
        .storage
        .from('gallery-uploads')
        .list(`${user.id}`, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('GalleryPage: Error fetching gallery items:', error.message);
        toast.error('Failed to load gallery items');
        return;
      }

      if (!files || files.length === 0) {
        console.log('GalleryPage: No gallery items found for user');
        // Set empty user gallery items but keep example items
        const updatedGalleryItems = galleryItems.filter(item => !item.tags.includes('user-uploads'));
        setGalleryItems(updatedGalleryItems);
        return;
      }

      console.log('GalleryPage: Gallery items retrieved:', files.length, files);

      // Get public URLs for each file
      const userGalleryItems: GalleryItem[] = await Promise.all(
        files
          .filter(file => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) // Filter image files only
          .map(async (file, index) => {
            const { data: publicURL } = supabase
              .storage
              .from('gallery-uploads')
              .getPublicUrl(`${user.id}/${file.name}`);

            // Log each public URL to help with debugging
            console.log('GalleryPage: Public URL:', publicURL.publicUrl, 'for file:', file.name);

            // Get a timestamp to show relative time
            const createdAt = file.created_at 
              ? new Date(file.created_at) 
              : new Date();
            const timeAgo = getTimeAgo(createdAt);

            return {
              id: `user-${index}-${file.id || file.name}`,
              title: file.name.split('.')[0].replace(/-|_/g, ' '),
              description: `Uploaded ${timeAgo}`,
              imageUrl: publicURL.publicUrl,
              likes: Math.floor(Math.random() * 50),
              comments: Math.floor(Math.random() * 10),
              date: timeAgo,
              tags: ['user-uploads', 'gallery'],
              author: {
                name: user.email?.split('@')[0] || 'User',
                avatar: 'https://i.pravatar.cc/150?img=1',
              },
            };
          })
      );

      if (userGalleryItems.length === 0) {
        console.log('GalleryPage: No image files found among retrieved files');
      } else {
        console.log('GalleryPage: User gallery items processed:', userGalleryItems.length);
      }

      // Combine with example gallery items - user uploads at the beginning 
      const updatedGalleryItems = [...userGalleryItems, ...galleryItems.filter(item => !item.tags.includes('user-uploads')).slice(0, 6 - userGalleryItems.length)];
      setGalleryItems(updatedGalleryItems);
      
    } catch (fetchError) {
      console.error('GalleryPage: Unexpected error fetching gallery items:', fetchError);
      toast.error('Failed to load your gallery items');
    } finally {
      // Hide loading spinner
      setIsLoadingGallery(false);
    }
  };

  // Helper function to calculate time ago
  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000; // Years
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000; // Months
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400; // Days
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600; // Hours
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60; // Minutes
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return 'just now';
  };

  // Handle file selection
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Basic validation (optional)
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // Example: 10MB limit
        toast.error('Image file size should not exceed 10MB.');
        return;
      }
      
      setSelectedFile(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      }
      reader.readAsDataURL(file);
      console.log('Selected file:', file.name);
      toast.success(`${file.name} selected. Ready to upload.`);
      // Clear the input value so the same file can be selected again if needed
      if (fileInputRef.current) {
          fileInputRef.current.value = ""; 
      }
    } else {
      setSelectedFile(null);
      setImagePreview(null);
    }
  };

  // Trigger hidden file input click
  const handleUploadClick = () => {
    if (!user) {
      router.push(ROUTES.signup);
      return;
    }
    
    fileInputRef.current?.click();
  };
  
  // Updated function to call the new API route
  const handleUpload = async () => {
    if (!user) {
      toast.error('Please sign in to upload images.');
      router.push(ROUTES.signup);
      return;
    }
    
    if (!selectedFile) {
      toast.error('No file selected for upload.');
      return;
    }
    
    setIsUploading(true);
    const uploadToastId = toast.loading('Uploading image...');
    console.log('GalleryPage: Starting upload for:', selectedFile.name);
    console.log('GalleryPage: User authenticated status:', !!user);
    console.log('GalleryPage: User ID:', user?.id);
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      // First, explicitly refresh the session to ensure cookies are current
      console.log('GalleryPage: Explicitly refreshing session before upload');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('GalleryPage: Failed to refresh session:', refreshError.message);
        throw new Error('Authentication error: Failed to refresh session');
      }
      
      console.log('GalleryPage: Session refresh successful:', !!refreshData.session);
      
      // Get fresh session with token
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      console.log('GalleryPage: Session check result:', {
        success: !!sessionData.session,
        expires_at: sessionData.session?.expires_at ? new Date(sessionData.session.expires_at * 1000).toISOString() : 'none',
        current_time: new Date().toISOString(),
        error: sessionError?.message || 'none'
      });
      
      if (sessionError || !sessionData.session) {
        console.error('GalleryPage: Session check failed:', sessionError?.message || 'No active session');
        throw new Error('Authentication session error. Please sign in again.');
      }
      
      // Extract the token to use as a backup for cookies
      const accessToken = sessionData.session.access_token;
      
      // Check if token is still valid (not expired)
      const tokenExpiration = sessionData.session.expires_at;
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      
      console.log('GalleryPage: Token validation check:', {
        token_prefix: accessToken ? `${accessToken.substring(0, 8)}...` : 'none',
        expires_at: tokenExpiration ? new Date(tokenExpiration * 1000).toISOString() : 'unknown',
        current_time: new Date(currentTime * 1000).toISOString(),
        is_valid: tokenExpiration ? (tokenExpiration > currentTime) : false,
        time_remaining: tokenExpiration ? `${tokenExpiration - currentTime} seconds` : 'unknown'
      });
      
      if (tokenExpiration && tokenExpiration <= currentTime) {
        console.error('GalleryPage: Token is expired!');
        // Force another refresh attempt
        const { error: forceRefreshError } = await supabase.auth.refreshSession();
        if (forceRefreshError) {
          throw new Error('Authentication token expired and refresh failed. Please sign in again.');
        }
      }
      
      // Prepare request headers with explicit authorization
      const headers: HeadersInit = {
        'Accept': 'application/json',
      };
      
      // ALWAYS add Authorization header with the token
      if (accessToken) {
        console.log('GalleryPage: Adding Authorization header with token');
        headers['Authorization'] = `Bearer ${accessToken}`;
      } else {
        console.error('GalleryPage: ⚠️ No access token available for Authorization header!');
      }
      
      // Log the full headers we're about to send (except sensitive values)
      console.log('GalleryPage: Request headers being sent:', 
        Object.entries(headers)
          .map(([key, value]) => key === 'Authorization' 
            ? `${key}: Bearer ${value.toString().substring(7, 15)}...` 
            : `${key}: ${value}`)
          .join(', ')
      );
      
      // Explicitly add auth headers and full credentials
      console.log('GalleryPage: Sending upload request to API with full auth credentials');
      const response = await fetch('/api/gallery/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies
        headers,
      });
      
      console.log('GalleryPage: Upload response status:', response.status);
      console.log('GalleryPage: Response headers:', 
        Array.from(response.headers.entries())
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')
      );
      
      if (!response.ok) {
        console.error('GalleryPage: Upload failed with status:', response.status);
        console.error('GalleryPage: Upload error details:', await response.text());
        
        // More specific error messages based on status code
        let errorMessage;
        switch (response.status) {
          case 401:
            errorMessage = 'Authentication error. Please sign in again.';
            break;
          case 403:
            errorMessage = 'You do not have permission to upload to this gallery.';
            break;
          case 404:
            errorMessage = 'Upload destination not found. Please contact support.';
            break;
          case 413:
            errorMessage = 'File is too large.';
            break;
          default:
            errorMessage = await response.text() || 'Upload failed with status ' + response.status;
        }
        
        throw new Error(errorMessage);
      }
      
      const jsonResponse = await response.json();
      toast.success('Image uploaded successfully!');
      setSelectedFile(null);
      setImagePreview('');
      setIsUploading(false);

      // Improved gallery refresh with logging and delay
      console.log('GalleryPage: Upload successful, refreshing gallery items...');
      
      // Clear existing items first to show loading state
      setGalleryItems(prevItems => {
        // Keep example items but remove user items
        return prevItems.filter(item => !item.tags.includes('user-uploads'));
      });
      
      // Short delay to ensure storage backend has processed the upload
      setTimeout(() => {
        fetchGalleryItems();
        // Scroll to the top to show the newly added image
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 1000); // 1 second delay
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      console.error('GalleryPage: Upload error:', errorMessage);
      toast.error(`Upload failed: ${errorMessage}`, { id: uploadToastId });
      
      // If authentication error, redirect to login
      if (errorMessage.includes('Authentication') || errorMessage.includes('sign in')) {
        toast.error('Please sign in to upload images');
        setTimeout(() => {
          router.push(ROUTES.signup);
        }, 2000);
      }
    }
  };

  const filteredItems = selectedFilter === 'all'
    ? galleryItems
    : galleryItems.filter(item => item.tags.includes(selectedFilter));

  return (
    <MainLayout>
      <div className={`space-y-6 transition-opacity duration-500 ${animateIn ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div
            className="opacity-0 animate-slide-in"
            style={{
              animationDelay: '0.1s',
              animationFillMode: 'forwards'
            }}
          >
            <h1 className="text-3xl font-bold">My Gallery</h1>
            <p className="text-gray-600 mt-1">Upload and manage your visual content</p>
          </div>
          
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            style={{ display: 'none' }}
          />

          <div
            className="flex space-x-2 opacity-0 animate-slide-in"
            style={{
              animationDelay: '0.3s',
              animationFillMode: 'forwards'
            }}
          >
            <Tooltip content="Sort by most recent">
              <Button 
                variant="outline" 
                className="transition-all duration-300 hover:-translate-y-1"
              >
                <Clock className="h-4 w-4 mr-2" />
                Most Recent
              </Button>
            </Tooltip>
            
            <Button 
              onClick={handleUploadClick}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Photo
            </Button>
            
            {selectedFile && (
              <Button 
                onClick={handleUpload}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Confirm Upload
              </Button>
            )}
            
            <Tooltip content="Refresh gallery items">
              <Button 
                variant="outline" 
                onClick={() => fetchGalleryItems()}
                className="transition-all duration-300 hover:-translate-y-1"
                disabled={isLoadingGallery}
              >
                {isLoadingGallery ? (
                  <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-blue-500 rounded-full"></span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </Button>
            </Tooltip>
          </div>
        </div>

        {selectedFile && imagePreview && (
          <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg flex flex-col md:flex-row items-center gap-4 opacity-0 animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
            <img src={imagePreview} alt="Selected preview" className="w-20 h-20 object-cover rounded-md border" />
            <div className="flex-grow text-sm">
              <p className="font-medium text-gray-800">Ready to upload:</p>
              <p className="text-gray-600">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</p>
            </div>
            <Button 
              onClick={handleUpload}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Confirm Upload
            </Button>
             <Button 
              onClick={() => { setSelectedFile(null); setImagePreview(null); }} 
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </Button>
          </div>
        )}

        {showTip && (
          <div
            className="p-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-between transition-all duration-500 ease-in-out opacity-0 animate-fade-in"
            style={{
              animationDelay: '0.4s',
              animationFillMode: 'forwards'
            }}
          >
            <div className="flex items-center">
              <Zap className="h-5 w-5 mr-3" />
              <p className="font-medium">Pro Tip: Apply AI analysis to your images to get engagement predictions and optimization suggestions.</p>
            </div>
            <button 
              className="px-3 py-1 rounded-full bg-white/20 text-sm hover:bg-white/30 transition-colors"
              onClick={() => setShowTip(false)}
            >
              Got it
            </button>
          </div>
        )}

        <div 
          className="flex flex-wrap gap-2 bg-gray-50 p-4 rounded-lg dark:bg-gray-800/50 mb-6 opacity-0 animate-fade-in"
          style={{
            animationDelay: '0.2s',
            animationFillMode: 'forwards'
          }}
        >
          <div className="flex items-center mr-2 text-gray-500">
            <Filter className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Filter by:</span>
          </div>
          {filters.map((filter, index) => (
            <button
              key={filter.name}
              onClick={() => setSelectedFilter(filter.name)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedFilter === filter.name
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
              }`}
              style={{
                animationDelay: `${0.2 + (index * 0.05)}s`,
                animationFillMode: 'forwards'
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
            <div className="mx-auto w-24 h-24 mb-4 text-gray-400 flex items-center justify-center rounded-full bg-gray-100">
              <ImageIcon className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No images found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {user ? 'Upload your first image to get started!' : 'Sign in to upload your own images.'}
            </p>
            <div className="mt-6">
              <Button 
                onClick={user ? handleUploadClick : () => router.push(ROUTES.signup)}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
              >
                {user ? (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload First Image
                  </>
                ) : (
                  <>
                    Sign in to Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-0 animate-fade-in"
            style={{
              animationDelay: '0.2s',
              animationFillMode: 'forwards'
            }}
          >
            {filteredItems.map((item, index) => (
              <div 
                key={item.id} 
                className="rounded-xl overflow-hidden border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-2 opacity-0 animate-fade-in"
                style={{
                  animationDelay: `${0.3 + (index * 0.1)}s`,
                  animationFillMode: 'forwards'
                }}
              >
                <div className="relative h-60 w-full group">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    fill
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <div className="w-full">
                      <div className="flex items-center justify-between text-white">
                        <h3 className="text-lg font-bold truncate">{item.title}</h3>
                        <div className="flex space-x-2">
                          <Tooltip content="Analyze this image">
                            <button className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                              <ImageIcon className="h-4 w-4" />
                            </button>
                          </Tooltip>
                          <Tooltip content="View details">
                            <button className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                              <Camera className="h-4 w-4" />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full overflow-hidden relative">
                        <Image 
                          src={item.author.avatar} 
                          alt={item.author.name}
                          className="object-cover"
                          fill
                        />
                      </div>
                      <span className="text-sm font-medium">{item.author.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {item.date}
                    </span>
                  </div>
                  <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{item.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs transition-colors duration-300 hover:bg-indigo-100 cursor-pointer"
                        onClick={() => setSelectedFilter(tag)}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-300">
                        <Heart className="h-5 w-5 mr-1" />
                        {item.likes}
                      </button>
                      <button className="flex items-center text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-300">
                        <MessageCircle className="h-5 w-5 mr-1" />
                        {item.comments}
                      </button>
                    </div>
                    <button className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-300">
                      <Share2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div 
          className="flex justify-center mt-8 opacity-0 animate-fade-in"
          style={{
            animationDelay: '0.8s',
            animationFillMode: 'forwards'
          }}
        >
          <Button 
            variant="outline" 
            className="w-full max-w-xs transition-all duration-300 hover:-translate-y-1"
          >
            Load More
          </Button>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-in-out;
        }
        
        .animate-slide-in {
          animation: slide-in 0.5s ease-in-out;
        }
      `}</style>
    </MainLayout>
  );
} 