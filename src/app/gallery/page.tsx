/**
 * IMPORTANT: Run the following SQL in your Supabase SQL Editor to fix storage permissions
 * 
 * -- Check if the bucket exists, if not create it
 * INSERT INTO storage.buckets (id, name, public)
 * VALUES ('gallery-uploads', 'gallery-uploads', false)
 * ON CONFLICT (id) DO NOTHING;
 * 
 * -- Enable RLS on storage.objects
 * ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
 * 
 * -- Create policy to allow authenticated users to select their own files
 * CREATE POLICY "Users can view their own files"
 * ON storage.objects
 * FOR SELECT
 * TO authenticated
 * USING (auth.uid()::text = (storage.foldername(name))[1]);
 * 
 * -- Create policy to allow authenticated users to insert their own files
 * CREATE POLICY "Users can upload files to their own folder"
 * ON storage.objects
 * FOR INSERT
 * TO authenticated
 * WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
 * 
 * -- Create policy to allow authenticated users to update their own files
 * CREATE POLICY "Users can update their own files"
 * ON storage.objects
 * FOR UPDATE
 * TO authenticated
 * USING (auth.uid()::text = (storage.foldername(name))[1])
 * WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
 * 
 * -- Create policy to allow authenticated users to delete their own files
 * CREATE POLICY "Users can delete their own files"
 * ON storage.objects
 * FOR DELETE
 * TO authenticated
 * USING (auth.uid()::text = (storage.foldername(name))[1]);
 */

'use client';

import React, { useState, useEffect, useCallback, FormEvent, SyntheticEvent, DragEvent } from 'react';
import Image from 'next/image';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/config';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  Heart,
  MessageCircle,
  Share2,
  Plus,
  FolderPlus,
  Move,
  Trash2,
  Filter,
  Zap,
  Camera,
  Clock,
  ImageIcon,
  Upload,
  Folder as FolderIcon,
  Home,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Lightbulb,
  FolderOpen,
  XCircle,
  Menu,
  X
} from 'lucide-react';
import { redirect } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import GalleryUpload from '@/components/gallery/GalleryUpload';

type FolderItem = {
  name: string;
  type: 'folder';
  path?: string;
};

type FileItem = {
  name: string;
  id: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: Record<string, any>;
  type: 'file';
  path: string;
  imageUrl?: string;
  title?: string;
  description?: string;
  likes?: number;
  comments?: number;
  date?: string;
  tags?: string[];
  author?: {
    name: string;
    avatar: string;
  };
};

type CombinedItem = FolderItem | FileItem;

type ListApiResponse = {
  success: boolean;
  items: CombinedItem[];
  currentPrefix: string;
  error?: string;
};

type Breadcrumb = {
  name: string;
  path: string;
};

type DestinationFolder = {
    name: string;
    path: string;
}

const getTimeAgo = (dateString?: string): string => {
  if (!dateString) return 'unknown date';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'invalid date';

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

const generateBreadcrumbs = (prefix: string): Breadcrumb[] => {
  const parts = prefix.split('/').filter(Boolean);
  const crumbs: Breadcrumb[] = [{ name: 'Gallery Home', path: '' }];
  let currentPath = '';
  parts.forEach((part) => {
    currentPath += `${part}/`;
    crumbs.push({ name: part, path: currentPath.replace(/\/$/, '') });
  });
  return crumbs;
};

const handleImageError = (event: SyntheticEvent<HTMLImageElement, Event>, name?: string) => {
    console.warn(`GalleryPage: Failed to load image: ${name || 'Unknown'}`);
    event.currentTarget.src = '/placeholder-image.png'; // Ensure you have a placeholder image at this path
};

const filters = [
  { name: 'all', label: 'All Items' },
  { name: 'images', label: 'Images' },
  { name: 'folders', label: 'Folders' },
  // Add more filters as needed (e.g., videos, documents)
];

const verifyBucket = async (supabase: any, bucketName: string): Promise<boolean> => {
  try {
    console.log(`GalleryPage: Verifying bucket '${bucketName}'...`);
    
    // First test with a direct bucket existence check via list
    try {
      const { data: storageData, error: listError } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 1 });
        
      if (!listError) {
        console.log(`GalleryPage: Successfully verified access to bucket '${bucketName}'`);
        return true;
      }
      
      // If we got an error, it might be that the bucket doesn't exist, or it could be an RLS policy issue
      console.error(`Error when listing bucket contents:`, listError);
      
      if (listError.statusCode === 400 && listError.message.includes('bucket not found')) {
        console.error(`Bucket '${bucketName}' does not exist. Will attempt to create it.`);
      } else if (listError.message.includes('permission denied') || listError.message.includes('row-level security')) {
        console.error('RLS policy error detected. Please run the SQL commands at the top of this file.');
        return false;
      }
    } catch (listErr) {
      console.warn('Error in initial bucket check:', listErr);
    }
    
    // Attempt to create the bucket if not found
    try {
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: false,
      });
      
      if (createError) {
        if (createError.message.includes('duplicate key value') || 
            createError.message.includes('already exists')) {
          console.log(`Bucket '${bucketName}' already exists but might have access issues.`);
          // Run another test to check if the bucket can be accessed after confirming it exists
          const { error: secondListError } = await supabase.storage
            .from(bucketName)
            .list('', { limit: 1 });
            
          if (secondListError) {
            console.error('RLS policy error. Please run the SQL commands at the top of this file in your Supabase SQL editor.');
            return false;
          }
          return true;
        } else {
          console.error(`Failed to create bucket '${bucketName}':`, createError);
          return false;
        }
      }
      
      console.log(`Successfully created bucket: '${bucketName}'`);
      return true;
    } catch (createErr: any) {
      console.error('Error in createBucket:', createErr);
      return false;
    }
  } catch (error: any) {
    console.error('Unexpected error verifying bucket:', error);
    return false;
  }
};

export default function GalleryPage() {
  const { user, loading, session } = useAuth();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  // Debug Auth State
  useEffect(() => {
    if (!loading) {
      console.log('GalleryPage: Auth state check:');
      console.log('- User:', user ? `ID: ${user.id}, Email: ${user.email}` : 'No user');
      console.log('- Session:', session ? 'Available' : 'No session');
      
      // Check if Supabase instance is properly initialized
      if (supabase) {
        console.log('- Supabase client: Initialized');
        // Test Supabase storage access
        supabase.storage.listBuckets().then(
          ({ data, error }: { data: any; error: any }) => {
            if (error) {
              console.error('GalleryPage: Error accessing Supabase storage:', error);
            } else {
              console.log('GalleryPage: Successfully connected to Supabase storage. Buckets:', 
                data?.map((b: any) => b.name).join(', ') || 'none');
            }
          }
        );
      } else {
        console.error('GalleryPage: Supabase client not initialized');
      }
    }
  }, [loading, user, session, supabase]);

  const [items, setItems] = useState<CombinedItem[]>([]);
  const [currentPathPrefix, setCurrentPathPrefix] = useState<string>('');
  const [isLoadingItems, setIsLoadingItems] = useState<boolean>(true);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>(generateBreadcrumbs(''));
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [createFolderError, setCreateFolderError] = useState<string | null>(null);

  const [isMoveModalOpen, setIsMoveModalOpen] = useState<boolean>(false);
  const [itemToMove, setItemToMove] = useState<CombinedItem | null>(null);
  const [moveDestinationFolders, setMoveDestinationFolders] = useState<DestinationFolder[]>([]);
  const [selectedMoveDestination, setSelectedMoveDestination] = useState<string | null>(null);
  const [isLoadingMoveFolders, setIsLoadingMoveFolders] = useState<boolean>(false);
  const [isMovingItem, setIsMovingItem] = useState<boolean>(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<CombinedItem | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState<boolean>(false);

  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<FileItem | null>(null);

  const [showTip, setShowTip] = useState<boolean>(false);
  const [animateIn, setAnimateIn] = useState<boolean>(false);

  const [draggedItem, setDraggedItem] = useState<FileItem | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const fetchItems = useCallback(async (pathPrefix: string): Promise<ListApiResponse | null> => {
    setIsLoadingItems(true);
    setItems([]);

    console.log(`GalleryPage: Fetching item list for prefix: "${pathPrefix}"`);

    // Check if we have a user from auth context
    if (!user) {
      console.error('GalleryPage: No authenticated user found');
      toast.error('Authentication required. Please sign in.');
      setIsLoadingItems(false);
      router.push(ROUTES.login);
      return null;
    }

    // Extract user ID from NextAuth or Supabase user
    // Expand the options to find a usable ID
    let userIdToUse = null;
    
    try {
      if (user.id) {
        userIdToUse = user.id;
      } else if (user.sub) {
        userIdToUse = user.sub;
      } else if (user.uid) {
        userIdToUse = user.uid;
      } else if ((user as any).userId) {
        userIdToUse = (user as any).userId;
      } else if (session?.user?.id) {
        userIdToUse = session.user.id;
      } else if (session?.user?.sub) {
        userIdToUse = session.user.sub;
      }
      
      // If we still don't have an ID, try to get it from Supabase directly
      if (!userIdToUse && supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user?.id) {
            userIdToUse = data.session.user.id;
            console.log('Found user ID from Supabase session:', userIdToUse);
          }
        } catch (e) {
          console.error('Error getting Supabase session:', e);
        }
      }
      
      // Last resort - create a deterministic ID from the email
      if (!userIdToUse && user.email) {
        userIdToUse = `email-${user.email.replace(/[^a-zA-Z0-9]/g, '-')}`;
        console.log('Created user ID from email:', userIdToUse);
      }
    } catch (err) {
      console.error('Error extracting user ID:', err);
    }
    
    console.log(`GalleryPage/FetchItems: Using user ID: ${userIdToUse || 'UNKNOWN'}`);

    // Validate user ID
    if (!userIdToUse) {
      console.error('GalleryPage/FetchItems: User ID is missing');
      toast.error('Authentication error: User ID is missing');
        setIsLoadingItems(false);
        return null;
    }

    try {
      // Verify the bucket exists
      const bucketName = 'gallery-uploads';
      const bucketExists = await verifyBucket(supabase, bucketName);
      
      if (!bucketExists) {
        console.error(`GalleryPage/FetchItems: Bucket '${bucketName}' does not exist or access is restricted`);
        toast.error(`Gallery storage is not properly configured. Please check RLS policies.`);
      setIsLoadingItems(false);
        return null;
    }

      // List files and folders directly using Supabase Storage API
      let { data: storageData, error: storageError } = await supabase.storage
        .from(bucketName)
        .list(`${userIdToUse}/${pathPrefix}`, {
          limit: 1000,
        });

      if (storageError) {
        // Special handling for empty directory which sometimes returns NotFound
        if (storageError.message.includes('Not Found') && pathPrefix !== '') {
          // Try to create the directory by adding a placeholder file
          console.log(`Directory '${pathPrefix}' not found, creating it...`);
          try {
            const { error: createDirError } = await supabase.storage
              .from(bucketName)
              .upload(`${userIdToUse}/${pathPrefix}.keep`, new Blob(['']));
              
            if (createDirError) {
              console.error('Error creating directory:', createDirError);
              toast.error(`Error accessing directory: ${storageError.message}`);
              setIsLoadingItems(false);
              return null;
            }
            
            // Now try listing again
            const { data: retryData, error: retryError } = await supabase.storage
              .from(bucketName)
              .list(`${userIdToUse}/${pathPrefix}`, {
                limit: 1000,
              });
              
            if (retryError) {
              console.error('Error listing items after creating directory:', retryError);
              toast.error(`Error loading gallery: ${retryError.message}`);
              setIsLoadingItems(false);
              return null;
            }
            
            // Proceed with empty folder or new data
            if (!retryData || retryData.length === 0) {
              console.log(`Directory '${pathPrefix}' is empty`);
              setBreadcrumbs(generateBreadcrumbs(pathPrefix));
              setCurrentPathPrefix(pathPrefix);
              setItems([]);
              setIsLoadingItems(false);
              return {
                success: true,
                items: [],
                currentPrefix: pathPrefix,
              };
            }
            
            // Use the retry data instead
            storageData = retryData; 
          } catch (createErr) {
            console.error('Error creating directory:', createErr);
            toast.error(`Error accessing directory: ${storageError.message}`);
            setIsLoadingItems(false);
            return null;
          }
      } else {
          console.error('GalleryPage/FetchItems: Error fetching items from storage:', storageError);
          toast.error(`Error loading gallery: ${storageError.message}`);
          setIsLoadingItems(false);
          return null;
        }
      }

      // Process the data to extract files and folders
      const processedItems: CombinedItem[] = [];

      // Process folders first
      const folderItems = storageData?.filter((item: any) => !item.metadata || !item.metadata.mimetype) || [];
      for (const folder of folderItems) {
        // Extract folder name - remove any trailing slash
        const folderName = folder.name.endsWith('/') ? folder.name.slice(0, -1) : folder.name;
        
        processedItems.push({
          name: folderName,
          type: 'folder',
          path: `${pathPrefix}${folderName}`,
        });
      }

      // Then process files
      const fileItems = storageData?.filter((item: any) => item.metadata && item.metadata.mimetype) || [];
      for (const file of fileItems) {
        // Skip .keep files used for folder creation
        if (file.name === '.keep') continue;
        
        // Get a URL for the file
        const { data: urlData } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(`${userIdToUse}/${pathPrefix}${file.name}`, 3600);
        
        processedItems.push({
          id: file.id,
          name: file.name,
          type: 'file',
          path: `${pathPrefix}${file.name}`,
          imageUrl: urlData?.signedUrl || '',
          metadata: file.metadata,
          created_at: file.created_at,
          updated_at: file.updated_at,
        });
      }

      console.log(`GalleryPage/FetchItems: Found ${processedItems.length} items (${folderItems.length} folders, ${fileItems.length} files)`);
      
      // Update the breadcrumbs
      setBreadcrumbs(generateBreadcrumbs(pathPrefix));
      setCurrentPathPrefix(pathPrefix);
    setItems(processedItems);
    setIsLoadingItems(false);
      
      return {
        success: true,
        items: processedItems,
        currentPrefix: pathPrefix,
      };
    } catch (error: any) {
      console.error('GalleryPage/FetchItems: Error fetching gallery items:', error);
      toast.error('Failed to fetch gallery items. Please try again.');
      setIsLoadingItems(false);
      return null;
    }
  }, [user, router, session, supabase]);

  useEffect(() => {
    if (!loading) {
      if (!user || !session) {
        console.log("No user/session found after auth check, redirecting to login.");
        router.push(ROUTES.login);
      } else {
        console.log("User authenticated, fetching initial items for prefix:", currentPathPrefix);
        fetchItems(currentPathPrefix);
      }
    }
  }, [user, loading, session, router, fetchItems, currentPathPrefix]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTip(true);
      setTimeout(() => setAnimateIn(true), 50);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleFolderClick = (folderName: string) => {
    const newPrefix = `${currentPathPrefix}${folderName}/`;
    console.log(`GalleryPage: Navigating to folder: "${newPrefix}"`);
    setCurrentPathPrefix(newPrefix);
  };

  const handleBreadcrumbClick = (path: string) => {
    console.log(`GalleryPage: Navigating via breadcrumb to: "${path}"`);
    const newPrefix = path ? `${path}/` : '';
    setCurrentPathPrefix(newPrefix);
  };

  const handleOpenCreateFolderModal = () => {
    setNewFolderName('');
    setIsCreateFolderModalOpen(true);
  };

  const handleCreateFolder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newFolderName.trim()) {
      toast.error('Folder name cannot be empty.');
      return;
    }

    setIsCreatingFolder(true);
    setCreateFolderError(null);

    console.log(`GalleryPage: Attempting to create folder "${newFolderName}" in prefix "${currentPathPrefix}"`);

    // Check if we have a user from auth context
    if (!user) {
      console.error('GalleryPage: No authenticated user found for create folder');
      toast.error('Authentication required. Please sign in.');
      setIsCreatingFolder(false);
      setCreateFolderError('Failed to get authentication token.');
      router.push(ROUTES.login);
      return;
    }

    // Extract user ID using the same logic as in fetchItems
    let userIdToUse = null;
    
    try {
      if (user.id) {
        userIdToUse = user.id;
      } else if (user.sub) {
        userIdToUse = user.sub;
      } else if (user.uid) {
        userIdToUse = user.uid;
      } else if ((user as any).userId) {
        userIdToUse = (user as any).userId;
      } else if (session?.user?.id) {
        userIdToUse = session.user.id;
      } else if (session?.user?.sub) {
        userIdToUse = session.user.sub;
      }
      
      // If we still don't have an ID, try to get it from Supabase directly
      if (!userIdToUse && supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user?.id) {
            userIdToUse = data.session.user.id;
          }
        } catch (e) {
          console.error('Error getting Supabase session:', e);
        }
      }
      
      // Last resort - create a deterministic ID from the email
      if (!userIdToUse && user.email) {
        userIdToUse = `email-${user.email.replace(/[^a-zA-Z0-9]/g, '-')}`;
      }
    } catch (err) {
      console.error('Error extracting user ID:', err);
    }
    
    console.log(`GalleryPage: Using user ID: ${userIdToUse || 'UNKNOWN'}`);

    // Validate user ID
    if (!userIdToUse) {
      console.error('GalleryPage: User ID is missing');
      toast.error('Authentication error: User ID is missing');
      setIsCreatingFolder(false);
      setCreateFolderError('User ID is required.');
      return;
    }
    
    // First try the server-side API approach which bypasses RLS issues
    try {
      console.log('GalleryPage: Attempting server-side folder creation API first');
      const folderPath = `${currentPathPrefix}${newFolderName}/`;
      
      // Call the server API
      const response = await fetch('/api/gallery/create-directory', {
            method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
            body: JSON.stringify({ 
          path: folderPath,
          userId: userIdToUse,
          bucketName: 'gallery-uploads',
            }),
        });

      // If the server API fails with a 4xx/5xx status
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server API folder creation failed:', errorData);
        
        // Only if the server API fails, try client-side approaches
        console.log('GalleryPage: Server API failed, falling back to client methods');
        await createFolderClientSide(userIdToUse, currentPathPrefix, newFolderName);
      } else {
        // Server API succeeded
        const result = await response.json();
        console.log('GalleryPage: Server API created folder successfully:', result);
            toast.success(`Folder "${newFolderName.trim()}" created successfully.`);
            setIsCreateFolderModalOpen(false);
            setNewFolderName('');
            await fetchItems(currentPathPrefix);
      }
    } catch (error: any) {
      console.error('GalleryPage: All folder creation methods failed:', error);
      const errorMessage = typeof error === 'object' ? 
        (error.message || JSON.stringify(error)) : String(error);
      setCreateFolderError(`Error creating folder: ${errorMessage}`);
      toast.error(`An error occurred while creating the folder: ${errorMessage}`);
    } finally {
      setIsCreatingFolder(false);
    }
  };
  
  // Helper function for client-side folder creation
  const createFolderClientSide = async (userId: string, pathPrefix: string, folderName: string): Promise<void> => {
    // Verify the bucket exists before trying to use it
    const bucketName = 'gallery-uploads';
    const bucketExists = await verifyBucket(supabase, bucketName);
    
    if (!bucketExists) {
      console.error(`GalleryPage: Bucket '${bucketName}' does not exist and could not be created`);
      toast.error(`Gallery storage is not properly configured. Please contact support.`);
      throw new Error(`Storage bucket '${bucketName}' is not available.`);
    }
    
    // Use Supabase Storage API directly
    const folderPath = `${pathPrefix}${folderName}/`;
    const placeholderFile = '.keep';
    const fullPath = `${userId}/${folderPath}${placeholderFile}`;
    
    console.log(`GalleryPage: Attempting client-side folder creation at path: ${fullPath}`);
    
    // Create a text blob with a specific content type
    const emptyContent = '';
    const blob = new Blob([emptyContent], { type: 'text/plain' });
    
    // Use upload options with contentType specified
    const uploadOptions = {
      cacheControl: '3600',
      upsert: true,
      contentType: 'text/plain'
    };
    
    try {
      // Upload an empty file to create the folder
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fullPath, blob, uploadOptions);
      
      if (error) {
        console.error('GalleryPage: Failed to create folder via Supabase storage:', 
          error.message ? error : JSON.stringify(error), 
          'Path:', fullPath
        );
        
        // Check for specific error types
        if (error.message && error.message.includes('row-level security policy')) {
          throw new Error('Permission denied due to RLS policy. Please check your Supabase policies.');
        } else if (error.statusCode === 404 || (error.message && error.message.includes('not found'))) {
          throw new Error('Storage bucket not found. Please create the gallery-uploads bucket.');
        }
        
        throw error;
      }
      
      console.log('GalleryPage: Folder created successfully:', data);
      return;
    } catch (error) {
      console.error('GalleryPage: Client-side folder creation failed:', error);
      throw error;
    }
  };

  const handleOpenMoveModal = (item: CombinedItem) => {
    console.log("GalleryPage: Opening move modal for item:", item.name, "Type:", item.type);
    setItemToMove(item);
    setSelectedMoveDestination(null);
    fetchMoveDestinationFolders();
    setIsMoveModalOpen(true);
  };

  const handleOpenDeleteModal = (item: CombinedItem) => {
    console.log("GalleryPage: Opening delete modal for item:", item.name, "Type:", item.type);
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const fetchMoveDestinationFolders = async () => {
      if (!itemToMove) return;

      setIsLoadingMoveFolders(true);
      setMoveDestinationFolders([]);

    // Check if we have a user from auth context
    if (!session || !user) {
      console.error('GalleryPage/FetchMoveDest: No authenticated user found');
      toast.error('Authentication required. Please sign in.');
        router.push(ROUTES.login);
        setIsLoadingMoveFolders(false);
        return;
      }

      try {
      // Add "Root" as a potential destination
      const destinations: DestinationFolder[] = [
        { name: 'Root (Gallery Home)', path: '' }
      ];
      
      // Get a direct list of just the top-level folders
      // This is a simplified approach that should be more reliable
      const { data: folderItems, error } = await supabase.storage
        .from('gallery-uploads')
        .list(`${user.id}`, {
          limit: 1000,
        });

      if (error) {
        console.error('GalleryPage/FetchMoveDest: Error listing folders:', error);
        throw error;
      }

      // Find all folders at this level
      for (const item of folderItems || []) {
        // Check if item is a directory (folders don't have mimetype)
        if (!item.metadata || !item.metadata.mimetype) {
          const folderName = item.name.endsWith('/') ? item.name.slice(0, -1) : item.name;
          
          // Don't add the folder if it's the current folder the file is in
          if (itemToMove.type === 'file') {
            const itemParentPath = itemToMove.path?.substring(0, itemToMove.path.lastIndexOf('/') + 1) || '';
            if (itemParentPath === `${folderName}/`) {
              console.log(`Filtering out current parent folder: ${folderName}`);
              continue;
            }
          }
          
          // Don't add the folder if we're trying to move a folder into itself
          if (itemToMove.type === 'folder' && itemToMove.name === folderName) {
            console.log(`Filtering out the folder itself when moving: ${folderName}`);
            continue;
          }
          
          destinations.push({
            name: folderName,
            path: `${folderName}/`
          });
        }
      }

      // Check if we're in a subfolder, we also need to show option to move to parent folder
      if (currentPathPrefix) {
        const lastSlashIndex = currentPathPrefix.lastIndexOf('/', currentPathPrefix.length - 2);
        if (lastSlashIndex >= 0) {
          const parentPath = currentPathPrefix.substring(0, lastSlashIndex + 1);
          const parentName = parentPath === '' ? 'Root' : 
            parentPath.substring(0, parentPath.length - 1).split('/').pop() || 'Parent';
          
          destinations.push({
            name: `Parent (${parentName})`,
            path: parentPath
          });
        }
      }
      
      console.log(`GalleryPage/FetchMoveDest: Found ${destinations.length} potential destinations`, destinations);
      
      setMoveDestinationFolders(destinations);
      } catch (error: any) {
      console.error('GalleryPage/FetchMoveDest: Error fetching folders:', error.message);
      toast.error('Failed to fetch destination folders. Please try again.');
      } finally {
          setIsLoadingMoveFolders(false);
      }
  };

  const handleConfirmMove = async () => {
    if (!itemToMove || selectedMoveDestination === null) {
      toast.error('Please select a destination folder.');
      return;
    }
    const itemParentPath = itemToMove.path?.substring(0, itemToMove.path.lastIndexOf('/') + 1) ?? currentPathPrefix;
     if (selectedMoveDestination === itemParentPath) {
         toast('Item is already in the selected destination folder.');
      setIsMoveModalOpen(false);
         return;
     }

    setIsMovingItem(true);

    // Check if we have a user from auth context
    if (!session || !user) {
      console.error('GalleryPage/MoveItem: No authenticated user found');
      toast.error('Authentication required. Please sign in.');
      setIsMovingItem(false);
      setIsMoveModalOpen(false);
      router.push(ROUTES.login);
      return;
    }

    const sourcePath = itemToMove.path;
     if (!sourcePath) {
         console.error("GalleryPage/MoveItem: Source path missing for item:", itemToMove);
         toast.error("Cannot move item: source path information missing.");
         setIsMovingItem(false);
      setIsMoveModalOpen(false);
         return;
     }

    const itemType = itemToMove.type;
    const destinationPath = `${selectedMoveDestination}${itemToMove.name}${itemType === 'folder' ? '/' : ''}`;

    console.log(`GalleryPage/MoveItem: Moving ${itemType} from "${sourcePath}" to "${destinationPath}"`);

    try {
      if (itemType === 'file') {
        // For files, we need to:
        // 1. Download the file from the source
        // 2. Upload it to the destination
        // 3. Delete the original
        
        // Download the file
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('gallery-uploads')
          .download(`${user.id}/${sourcePath}`);
          
        if (downloadError || !fileData) {
          throw downloadError || new Error('Failed to download the file');
        }
        
        // Upload to new location
        const { error: uploadError } = await supabase.storage
          .from('gallery-uploads')
          .upload(`${user.id}/${destinationPath}`, fileData, {
            upsert: false
          });
          
        if (uploadError) {
          throw uploadError;
        }
        
        // Delete the original
        const { error: deleteError } = await supabase.storage
          .from('gallery-uploads')
          .remove([`${user.id}/${sourcePath}`]);
          
        if (deleteError) {
          console.warn('GalleryPage/MoveItem: Failed to delete original file:', deleteError);
          // Continue anyway, as we've successfully copied the file
        }
      } else if (itemType === 'folder') {
        // For folders:
        // 1. List all files in the folder
        // 2. Move each file (download and upload to new location)
        // 3. Delete the originals
        
        const { data: folderContents, error: listError } = await supabase.storage
          .from('gallery-uploads')
          .list(`${user.id}/${sourcePath}`, { recursive: true });
          
        if (listError) {
          throw listError;
        }
        
        if (folderContents && folderContents.length > 0) {
          // Process each file in the folder
          const movePromises = folderContents.map(async (item: any) => {
            const sourceFilePath = `${sourcePath}${item.name}`;
            const destFilePath = `${destinationPath}${item.name}`;
            
            // Download the file
            const { data: fileData, error: downloadError } = await supabase.storage
              .from('gallery-uploads')
              .download(`${user.id}/${sourceFilePath}`);
              
            if (downloadError || !fileData) {
              console.warn(`Failed to download file: ${sourceFilePath}`, downloadError);
              return false;
            }
            
            // Upload to new location
            const { error: uploadError } = await supabase.storage
              .from('gallery-uploads')
              .upload(`${user.id}/${destFilePath}`, fileData, {
                upsert: false
              });
              
            if (uploadError) {
              console.warn(`Failed to upload file to: ${destFilePath}`, uploadError);
              return false;
            }
            
            return true;
          });
          
          await Promise.all(movePromises);
          
          // Delete the original files
          const filePaths = folderContents.map((item: any) => 
            `${user.id}/${sourcePath}${item.name}`
          );
          
          await supabase.storage
            .from('gallery-uploads')
            .remove(filePaths);
            
          // Create .keep file in the destination folder if needed
          await supabase.storage
            .from('gallery-uploads')
            .upload(`${user.id}/${destinationPath}.keep`, new Blob(['']));
        } else {
          // For empty folders, just create .keep file in destination
          await supabase.storage
            .from('gallery-uploads')
            .upload(`${user.id}/${destinationPath}.keep`, new Blob(['']));
        }
        
        // Try to delete the original .keep file
        await supabase.storage
          .from('gallery-uploads')
          .remove([`${user.id}/${sourcePath}.keep`]);
      }
      
            const destinationName = moveDestinationFolders.find(f => f.path === selectedMoveDestination)?.name || selectedMoveDestination || 'Root';
            toast.success(`"${itemToMove.name}" moved successfully to ${destinationName}!`);
      setIsMoveModalOpen(false);
            setItemToMove(null);
            await fetchItems(currentPathPrefix);
    } catch (error: any) {
      console.error('GalleryPage/MoveItem: Error moving item:', error);
      toast.error(`Failed to move item: ${error.message}`);
    } finally {
        setIsMovingItem(false);
      setIsMoveModalOpen(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeletingItem(true);

    // Check if we have a user from auth context
    if (!session || !user) {
      console.error('GalleryPage/DeleteItem: No authenticated user found');
      toast.error('Authentication required. Please sign in.');
      router.push(ROUTES.login);
      setIsDeletingItem(false);
      return;
    }

    const itemPath = itemToDelete.path;
    const itemType = itemToDelete.type;

     if (!itemPath) {
         console.error("GalleryPage/DeleteItem: Path missing for item:", itemToDelete);
         toast.error("Cannot delete item: path information missing.");
         setIsDeletingItem(false);
        return;
    }

    console.log(`GalleryPage/DeleteItem: Attempting to delete ${itemType} at path: "${itemPath}"`);

    try {
      if (itemType === 'file') {
        // Delete a single file
        const { error } = await supabase.storage
          .from('gallery-uploads')
          .remove([`${user.id}/${itemPath}`]);
        
        if (error) {
          throw error;
        }
      } else if (itemType === 'folder') {
        // For folders, we need to list all files in the folder and delete them
        const { data: folderContents, error: listError } = await supabase.storage
          .from('gallery-uploads')
          .list(`${user.id}/${itemPath}`, { recursive: true });
        
        if (listError) {
          throw listError;
        }
        
        if (folderContents && folderContents.length > 0) {
          // Collect paths of all items in the folder with correct typing
          const filePaths = folderContents.map((item: any) => `${user.id}/${itemPath}${item.name}`);
          
          // Delete all files in the folder
          const { error: deleteError } = await supabase.storage
            .from('gallery-uploads')
            .remove(filePaths);
            
          if (deleteError) {
            throw deleteError;
          }
        }
        
        // Delete the placeholder file if it exists
        await supabase.storage
          .from('gallery-uploads')
          .remove([`${user.id}/${itemPath}.keep`]);
      }
      
             toast.success(`"${itemToDelete.name}" deleted successfully!`);
             setIsDeleteModalOpen(false);
             setItemToDelete(null);
             await fetchItems(currentPathPrefix);
    } catch (error: any) {
      console.error('GalleryPage/DeleteItem: Error deleting item:', error);
      toast.error(`Failed to delete: ${error.message}`);
    } finally {
        setIsDeletingItem(false);
    }
  };

  const handleImageClick = (item: FileItem) => {
    console.log("GalleryPage: Image clicked:", item.name);
    setSelectedImage(item);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setSelectedImage(null);
  };

  const filteredItems = items.filter(item => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'images') return item.type === 'file';
    if (selectedFilter === 'folders') return item.type === 'folder';
    return false;
  });

  const foldersToRender = filteredItems.filter(item => item.type === 'folder') as FolderItem[];
  const filesToRender = filteredItems.filter(item => item.type === 'file') as FileItem[];

  // Add this handler to start dragging an image
  const handleDragStart = (e: DragEvent<HTMLDivElement>, item: FileItem) => {
    e.stopPropagation();
    setDraggedItem(item);
    // Add data to the drag event for browsers that need it
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', JSON.stringify({
        id: item.id,
        name: item.name,
        path: item.path,
        type: 'file'
      }));
      
      // Create a drag image for better visual feedback
      try {
        // Use DOM API to create an image element for drag preview
        const dragImage = document.createElement('img');
        dragImage.src = item.imageUrl || '';
        dragImage.width = 80;
        dragImage.height = 80;
        dragImage.style.objectFit = 'cover';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 40, 40);
        // Remove the element after drag starts
        setTimeout(() => document.body.removeChild(dragImage), 0);
      } catch (error) {
        console.warn('Failed to set drag image:', error);
      }
    }
    
    // Add a class to show this item is being dragged
    const element = e.currentTarget as HTMLDivElement;
    element.classList.add('opacity-50', 'scale-95');
  };

  // Add this handler for when dragging ends
  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove dragging styles
    const element = e.currentTarget as HTMLDivElement;
    element.classList.remove('opacity-50', 'scale-95');
    
    setDraggedItem(null);
    setDragOverFolderId(null);
  };

  // Add this handler for when dragging over a folder
  const handleDragOver = (e: DragEvent<HTMLDivElement>, folder: FolderItem) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(folder.name);
  };

  // Add this handler for when dragging leaves a folder
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);
  };

  // Add this handler for when dropping an image onto a folder
  const handleDrop = async (e: DragEvent<HTMLDivElement>, folder: FolderItem) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);
    
    if (!draggedItem) return;
    
    // Use folder path if available, otherwise construct from folder name
    const targetFolderPath = folder.path ? 
      (folder.path.endsWith('/') ? folder.path : `${folder.path}/`) : 
      `${folder.name}/`;
    
    console.log(`Attempting to move file to folder: ${targetFolderPath}`);
    
    // Check if the item is already in this folder
    const itemParentPath = draggedItem.path?.substring(0, draggedItem.path.lastIndexOf('/') + 1) || '';
    if (targetFolderPath === itemParentPath) {
      toast.info('File is already in this folder');
      return;
    }
    
    // Show loading indicator immediately
    const toastId = toast.loading(`Moving ${draggedItem.name} to ${folder.name}...`);
    
    try {
      // Move the item using the direct move function
      await handleDirectMove(draggedItem, targetFolderPath);
      toast.success(`Moved ${draggedItem.name} to ${folder.name}`, { id: toastId });
      
      // Refresh the current view to show changes
      await fetchItems(currentPathPrefix);
    } catch (error) {
      console.error('Error in drag and drop move operation:', error);
      toast.error(`Failed to move file: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: toastId });
    } finally {
      // Reset dragged item
      setDraggedItem(null);
    }
  };

  // Fix the handleDirectMove function to properly extract user ID
  const handleDirectMove = async (itemToMoveDirectly: CombinedItem, destinationPath: string) => {
    setIsMovingItem(true);

    // Check if we have a user from auth context
    if (!session || !user) {
      console.error('GalleryPage/DirectMove: No authenticated user found');
      toast.error('Authentication required. Please sign in.');
      setIsMovingItem(false);
      router.push(ROUTES.login);
      return;
    }

    const sourcePath = itemToMoveDirectly.path;
    if (!sourcePath) {
      console.error("GalleryPage/DirectMove: Source path missing for item:", itemToMoveDirectly);
      toast.error("Cannot move item: source path information missing.");
      setIsMovingItem(false);
      return;
    }

    const itemType = itemToMoveDirectly.type;
    const destinationFullPath = `${destinationPath}${itemToMoveDirectly.name}${itemType === 'folder' ? '/' : ''}`;

    console.log(`GalleryPage/DirectMove: Moving ${itemType} from "${sourcePath}" to "${destinationFullPath}"`);

    try {
      // Extract user ID with more comprehensive approach
      let userIdToUse = null;
      
      try {
        if (user.id) {
          userIdToUse = user.id;
        } else if (user.sub) {
          userIdToUse = user.sub;
        } else if (user.uid) {
          userIdToUse = user.uid;
        } else if ((user as any).userId) {
          userIdToUse = (user as any).userId;
        }
        
        // If we still don't have an ID, try to get it from Supabase directly
        if (!userIdToUse && supabase) {
          try {
            const { data } = await supabase.auth.getSession();
            if (data?.session?.user?.id) {
              userIdToUse = data.session.user.id;
              console.log('Found user ID from Supabase session:', userIdToUse);
            }
          } catch (e) {
            console.error('Error getting Supabase session:', e);
          }
        }
        
        // Last resort - create a deterministic ID from the email
        if (!userIdToUse && user.email) {
          userIdToUse = `email-${user.email.replace(/[^a-zA-Z0-9]/g, '-')}`;
          console.log('Created user ID from email:', userIdToUse);
        }
      } catch (err) {
        console.error('Error extracting user ID:', err);
      }
      
      if (!userIdToUse) {
        throw new Error('Unable to determine user ID for storage operations');
      }
      
      console.log(`Using user ID for move operation: ${userIdToUse}`);
      
      // Try to use the server-side API first to avoid client-side permissions issues
      try {
        console.log('GalleryPage/DirectMove: Attempting server-side move operation...');
        
        const response = await fetch('/api/gallery/move-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: userIdToUse,
            sourcePath: sourcePath,
            destinationPath: destinationFullPath,
            itemType: itemType
          })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          console.log('Server-side move completed successfully:', result);
          return;
        } else {
          console.error('Server-side move failed:', result);
          throw new Error(result.error || 'Server move operation failed');
        }
      } catch (serverError) {
        console.error('Error with server-side move operation:', serverError);
        console.log('Falling back to client-side method');
      }
    
      if (itemType === 'file') {
        // For files, we need to:
        // 1. Download the file from the source
        console.log(`Downloading from: ${userIdToUse}/${sourcePath}`);
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('gallery-uploads')
          .download(`${userIdToUse}/${sourcePath}`);
          
        if (downloadError || !fileData) {
          console.error('Download error:', downloadError);
          throw downloadError || new Error('Failed to download the file');
        }
        
        // 2. Upload to new location with explicit content type
        const contentType = itemToMoveDirectly.metadata?.mimetype || 'application/octet-stream';
        console.log(`Uploading to: ${userIdToUse}/${destinationFullPath} with content type: ${contentType}`);
        
        const { error: uploadError } = await supabase.storage
          .from('gallery-uploads')
          .upload(`${userIdToUse}/${destinationFullPath}`, fileData, {
            contentType: contentType,
            upsert: true // Use upsert to prevent conflicts
          });
          
        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }
        
        // 3. Delete the original
        console.log(`Deleting original at: ${userIdToUse}/${sourcePath}`);
        const { error: deleteError } = await supabase.storage
          .from('gallery-uploads')
          .remove([`${userIdToUse}/${sourcePath}`]);
          
        if (deleteError) {
          console.warn('GalleryPage/DirectMove: Failed to delete original file:', deleteError);
          // Continue anyway, as we've successfully copied the file
        }
      } else if (itemType === 'folder') {
        // Full folder move implementation would go here
        toast.error("Folder moving via drag and drop is not fully implemented yet");
        return;
      }
    } catch (error: any) {
      console.error('GalleryPage/DirectMove: Error moving item:', error);
      throw error; // Re-throw to be caught by the caller
    } finally {
      setIsMovingItem(false);
    }
  };

  // Add a helper function to get the parent folder path
  const getParentPath = (path: string): string => {
    if (!path) return '';
    
    // Remove trailing slash if present
    const pathWithoutTrailingSlash = path.endsWith('/') ? path.slice(0, -1) : path;
    
    // Find the last slash
    const lastSlashIndex = pathWithoutTrailingSlash.lastIndexOf('/');
    
    // If no slash found, return empty (root)
    if (lastSlashIndex === -1) return '';
    
    // Return up to the last slash
    return pathWithoutTrailingSlash.substring(0, lastSlashIndex);
  };

  // Add a helper function to get folder name from path
  const getFolderName = (path: string): string => {
    if (!path) return '';
    
    // Remove trailing slash if present
    const pathWithoutTrailingSlash = path.endsWith('/') ? path.slice(0, -1) : path;
    
    // Get the last part of the path
    const parts = pathWithoutTrailingSlash.split('/');
    return parts[parts.length - 1] || '';
  };

  if (loading) {
      return (
           <MainLayout>
              <div className="flex justify-center items-center h-screen">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading authentication...</span>
              </div>
          </MainLayout>
      );
  }

  if (!user) {
  return (
    <MainLayout>
              <div className="flex justify-center items-center h-screen">
                  <p className="text-muted-foreground">Redirecting to login...</p>
          </div>
          </MainLayout>
       );
  }

  return (
    <MainLayout>
      <div className="flex flex-col">
        <div className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 shadow-sm">
          {currentPathPrefix ? (
            // Inside a folder view
            <>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center">
                <FolderOpen className="h-7 w-7 mr-3 text-blue-500" />
                {getFolderName(currentPathPrefix)}
              </h1>
              <div className="flex items-center mt-2 text-gray-600">
                <span className="py-1 px-2 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
                  Folder
                </span>
              </div>
            </>
          ) : (
            // Root gallery view
            <>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">My Gallery</h1>
              <p className="text-gray-600">Browse, manage, and upload your content.</p>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.path}>
                {index > 0 && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
                {index === breadcrumbs.length - 1 ? (
                  <span className="font-medium text-gray-700 dark:text-gray-200" aria-current="page">
                    {index === 0 ? <Home className="h-4 w-4 inline-block align-middle" /> : crumb.name}
                  </span>
                ) : (
                  <button 
                    onClick={() => handleBreadcrumbClick(crumb.path)}
                    className="hover:underline hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded focus:outline-none focus:ring-1 focus:ring-indigo-300"
                  >
                    {index === 0 ? <Home className="h-4 w-4 inline-block align-middle" /> : crumb.name}
                  </button>
                )}
              </React.Fragment>
            ))}
          </nav>
          <div className="flex gap-2 flex-wrap">
            {currentPathPrefix && (
              <Button 
                onClick={() => {
                  // Get the parent path
                  const parentPath = getParentPath(currentPathPrefix);
                  // Navigate to parent folder
                  const newPrefix = parentPath ? `${parentPath}/` : '';
                  setCurrentPathPrefix(newPrefix);
                }} 
                variant="outline" 
                size="sm"
                className="mr-2"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button onClick={() => fetchItems(currentPathPrefix)} variant="outline" size="sm" disabled={isLoadingItems}>
              <RefreshCw className={`h-4 w-4 ${isLoadingItems ? 'animate-spin' : ''}`} />
              <span className="ml-2 hidden sm:inline">Refresh</span>
            </Button>
            <Button onClick={handleOpenCreateFolderModal} variant="outline" size="sm">
              <FolderPlus className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">New Folder</span>
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <GalleryUpload 
            pathPrefix={currentPathPrefix} 
            onUploadSuccess={() => fetchItems(currentPathPrefix)} 
          />
        </div>
        
        {isLoadingItems ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">Loading gallery...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 px-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No items in this folder</h3>
            {currentPathPrefix ? (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Use the upload box above to add images, or create folders to organize your content.
              </p>
            ) : (
              <>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new folder or uploading an image.</p>
                <div className="mt-6 flex justify-center gap-2">
                  <Button onClick={handleOpenCreateFolderModal} variant="outline" size="sm">
                    <FolderPlus className="h-4 w-4 mr-2" /> New Folder
                  </Button>
                  <label htmlFor="direct-upload-empty" className={buttonVariants({ variant: "default", size: "sm" }) + " cursor-pointer"}>
                    <Upload className="h-4 w-4 mr-2" /> Upload Image
                  </label>
                  <input 
                    id="direct-upload-empty"
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      const uploader = document.querySelector('#gallery-uploader input[type="file"]');
                      if (uploader instanceof HTMLInputElement && e.target.files) {
                        uploader.files = e.target.files;
                        uploader.dispatchEvent(new Event('change', { bubbles: true }));
                      }
                    }}
                  /> 
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Only show Folders Section when at root level */}
            {!currentPathPrefix && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
                  <FolderIcon className="h-5 w-5 mr-2 text-blue-500" />
                  Folders
                </h2>
                
                {foldersToRender.length === 0 ? (
                  <div className="text-center py-6 px-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No folders in this location</p>
                    <Button onClick={handleOpenCreateFolderModal} variant="outline" size="sm" className="mt-2">
                      <FolderPlus className="h-4 w-4 mr-2" /> Create Folder
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {foldersToRender.map((folder) => (
                      <Card 
                        key={folder.name} 
                        className={`group relative cursor-pointer overflow-hidden hover:shadow-md transition-shadow bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${dragOverFolderId === folder.name ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
                        onClick={() => handleFolderClick(folder.name)}
                        onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? handleFolderClick(folder.name) : null}
                        tabIndex={0}
                        role="button"
                        aria-label={`Open folder ${folder.name}`}
                        onDragOver={(e) => handleDragOver(e, folder)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, folder)}
                      >
                        <CardContent className="p-4 flex flex-col items-center justify-center aspect-square">
                          <FolderIcon className="h-16 w-16 text-blue-500 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-sm font-medium text-center break-words w-full line-clamp-2 text-gray-700 dark:text-gray-200">{folder.name}</span>
                        </CardContent>
                        <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button onClick={(e) => { e.stopPropagation(); handleOpenMoveModal(folder); }} variant="ghost" size="icon" className="h-6 w-6 bg-white/80 hover:bg-white dark:bg-gray-700/80 dark:hover:bg-gray-600 rounded-full">
                            <Move className="h-3 w-3" />
                            <span className="sr-only">Move folder {folder.name}</span>
                          </Button>
                          <Button onClick={(e) => { e.stopPropagation(); handleOpenDeleteModal(folder); }} variant="ghost" size="icon" className="h-6 w-6 bg-white/80 hover:bg-white dark:bg-gray-700/80 dark:hover:bg-gray-600 rounded-full text-red-500 hover:text-red-600">
                            <Trash2 className="h-3 w-3" />
                            <span className="sr-only">Delete folder {folder.name}</span>
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Images Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
                <ImageIcon className="h-5 w-5 mr-2 text-indigo-500" />
                {currentPathPrefix ? getFolderName(currentPathPrefix) : 'Images'}
              </h2>
              
              {filesToRender.length === 0 ? (
                <div className="text-center py-6 px-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentPathPrefix 
                      ? "No images in this folder yet. Use the upload box at the top to add images." 
                      : "No images in this folder"}
                  </p>
                  {!currentPathPrefix && (
                    <label htmlFor="direct-upload-empty-images" className={buttonVariants({ variant: "outline", size: "sm" }) + " mt-2 cursor-pointer"}>
                      <Upload className="h-4 w-4 mr-2" /> Upload Image
                    </label>
                  )}
                  <input 
                    id="direct-upload-empty-images"
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      const uploader = document.querySelector('#gallery-uploader input[type="file"]');
                      if (uploader instanceof HTMLInputElement && e.target.files) {
                        uploader.files = e.target.files;
                        uploader.dispatchEvent(new Event('change', { bubbles: true }));
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filesToRender.map((item) => (
                    <Card 
                      key={item.id} 
                      className="group relative overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 transition-all duration-200"
                      onClick={() => handleImageClick(item)}
                      onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? handleImageClick(item) : null}
                      tabIndex={0}
                      role="button"
                      aria-label={`View image ${item.title || item.name}`}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40 pointer-events-none opacity-0 group-hover:opacity-0 transition-opacity">
                        <div className="text-white text-xs font-medium bg-black/70 rounded-md px-2 py-1">
                          Drag to move
                        </div>
                      </div>
                      <CardContent className="p-0 aspect-square flex items-center justify-center">
                        <Image 
                          src={item.imageUrl || ''} 
                          alt={item.title || item.name} 
                          width={200} 
                          height={200} 
                          className="object-cover w-full h-full transition-transform group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => handleImageError(e, item.name)}
                        />
                      </CardContent>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                        <span className="text-white text-xs font-medium line-clamp-2 mb-1">{item.title || item.name}</span>
                        <div className="flex gap-1 justify-end">
                          <Button onClick={(e) => { e.stopPropagation(); handleOpenMoveModal(item); }} variant="ghost" size="icon" className="h-6 w-6 bg-white/80 hover:bg-white text-gray-700 rounded-full">
                            <Move className="h-3 w-3" />
                            <span className="sr-only">Move image {item.name}</span>
                          </Button>
                          <Button onClick={(e) => { e.stopPropagation(); handleOpenDeleteModal(item); }} variant="ghost" size="icon" className="h-6 w-6 bg-white/80 hover:bg-white text-red-500 hover:text-red-600 rounded-full">
                            <Trash2 className="h-3 w-3" />
                            <span className="sr-only">Delete image {item.name}</span>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {isCreateFolderModalOpen && (
        <Dialog open={isCreateFolderModalOpen} onOpenChange={setIsCreateFolderModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Enter a name for your new folder within the current directory: <span className="font-medium">{currentPathPrefix || 'Gallery Home'}</span>.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateFolder}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="folder-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="folder-name"
                    value={newFolderName}
                    onChange={(e) => {
                      setNewFolderName(e.target.value);
                      if (createFolderError) setCreateFolderError(null);
                    }}
                    className="col-span-3"
                    placeholder="e.g., Project Assets"
                    required
                    pattern="^[a-zA-Z0-9-_ ]+$"
                    title="Folder name can only contain letters, numbers, spaces, hyphens, and underscores."
                  />
                </div>
                {createFolderError && (
                  <p className="col-span-4 text-red-600 text-sm text-center">{createFolderError}</p>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" onClick={() => setCreateFolderError(null)}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isCreatingFolder || !newFolderName.trim()}>
                  {isCreatingFolder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isCreatingFolder ? 'Creating...' : 'Create Folder'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {isMoveModalOpen && itemToMove && (
        <Dialog open={isMoveModalOpen} onOpenChange={setIsMoveModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Move Item</DialogTitle>
              <DialogDescription>
                Move "{itemToMove.name}" ({itemToMove.type}) to a different folder.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {isLoadingMoveFolders ? (
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                </div>
              ) : moveDestinationFolders.length === 0 ? (
                <p className="text-center text-gray-500">No other folders available to move to.</p>
              ) : (
                <Select 
                  onValueChange={setSelectedMoveDestination} 
                  defaultValue={selectedMoveDestination || undefined}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select destination folder..." />
                  </SelectTrigger>
                  <SelectContent>
                    {moveDestinationFolders.map(folder => (
                      <SelectItem key={folder.path} value={folder.path}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                onClick={handleConfirmMove} 
                disabled={isMovingItem || isLoadingMoveFolders || !selectedMoveDestination || moveDestinationFolders.length === 0}
              >
                {isMovingItem ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isMovingItem ? 'Moving...' : 'Confirm Move'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isDeleteModalOpen && itemToDelete && (
        <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete 
                <span className="font-semibold"> "{itemToDelete.name}"</span> 
                ({itemToDelete.type}){itemToDelete.type === 'folder' ? ' and all its contents' : ''}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingItem}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete} 
                disabled={isDeletingItem}
                className={buttonVariants({ variant: "destructive" })}
              >
                {isDeletingItem ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isDeletingItem ? 'Deleting...' : 'Yes, delete it'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {isPreviewOpen && selectedImage && (
        <Dialog open={isPreviewOpen} onOpenChange={handleClosePreview}>
          <DialogContent className="max-w-4xl p-0 border-0">
            <Image 
              src={selectedImage.imageUrl || ''} 
              alt={selectedImage.title || selectedImage.name} 
              width={1024} 
              height={1024} 
              className="object-contain max-h-[80vh] w-auto rounded-md"
              onError={(e) => handleImageError(e, selectedImage.name)}
            />
          </DialogContent>
        </Dialog>
      )}
    </MainLayout>
  );
} 