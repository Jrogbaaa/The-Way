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
  
  // Placeholder for actual upload logic
  const handleUpload = async () => {
    if (!user) {
      router.push(ROUTES.signup);
      return;
    }
    
    if (!selectedFile) {
      toast.error('No file selected for upload.');
      return;
    }
    console.log('Uploading file:', selectedFile.name);
    // --- Add your actual upload API call here --- 
    
    toast('Upload functionality not yet implemented.', {
        icon: 'ℹ️',
    }); 
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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