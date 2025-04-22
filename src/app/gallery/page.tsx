'use client';

import React, { useState, useEffect, useCallback, FormEvent, SyntheticEvent } from 'react';
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
import { supabase } from '@/lib/supabase';
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
  Loader2,
  Lightbulb,
  FolderOpen,
} from 'lucide-react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
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

export default function GalleryPage() {
  const { user, loading, session } = useAuth();
  const router = useRouter();

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

  const fetchItems = useCallback(async (pathPrefix: string): Promise<ListApiResponse | null> => {
    setIsLoadingItems(true);
    setItems([]);

    const MAX_RETRIES = 2;
    let retryCount = 0;
    let backoffTime = 1000;

    console.log(`GalleryPage: Fetching item list for prefix: "${pathPrefix}"`);

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      console.error('GalleryPage: Error fetching client session or no session found:', sessionError?.message);
      if (user) toast.error('Authentication session issue. Please sign in again.');
      setIsLoadingItems(false);
      return null;
    }

    let accessToken = sessionData.session.access_token;
    console.log("GalleryPage: Fetched access token client-side for list request.");

    let listData: ListApiResponse | null = null;

    while (retryCount <= MAX_RETRIES && !listData) {
      try {
        const response = await fetch(`/api/gallery/list?pathPrefix=${encodeURIComponent(pathPrefix)}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          cache: 'no-store'
        });

        console.log(`GalleryPage: Fetch item list response status for prefix "${pathPrefix}": ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            listData = data;
            if (listData && listData.items) {
              console.log(`GalleryPage: Received ${listData.items.length} items from list API.`);
            } else {
              console.warn('GalleryPage: List API success true, but listData or listData.items is null/undefined.');
            }
          } else {
            console.error('GalleryPage: List API indicated failure:', data.error);
            toast.error(data.error || 'Failed to fetch gallery items list.');
            setIsLoadingItems(false);
            return null;
          }
        } else if (response.status === 401) {
          console.warn(`GalleryPage: Unauthorized (401) fetching list (Retry ${retryCount + 1}/${MAX_RETRIES}).`);
          retryCount++;
          if (retryCount <= MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            backoffTime *= 2;
            const { data: refreshed, error: refreshErr } = await supabase.auth.getSession();
            if (refreshErr || !refreshed.session) {
                console.error('GalleryPage: Failed to refresh session:', refreshErr?.message);
                toast.error('Session expired or invalid. Please sign in again.');
          router.push(ROUTES.login);
        }
            accessToken = refreshed.session!.access_token;
          } else {
             console.error(`GalleryPage: Unauthorized (401) fetching items after ${MAX_RETRIES} retries. Redirecting to login.`);
             toast.error('Authentication failed. Please sign in again.');
             router.push(ROUTES.login);
             setIsLoadingItems(false);
             return null;
          }
        } else if (response.status === 429) {
          console.warn(`GalleryPage: Rate limited (429) fetching list (Retry ${retryCount + 1}/${MAX_RETRIES}).`);
          retryCount++;
          if (retryCount <= MAX_RETRIES) {
             await new Promise(resolve => setTimeout(resolve, backoffTime));
             backoffTime *= 2;
          } else {
             console.error(`GalleryPage: Rate limited (429) after ${MAX_RETRIES} retries. Aborting.`);
             toast.error('Too many requests. Please wait a moment and try again.');
             setIsLoadingItems(false);
             return null;
          }
        } else {
           const errorText = await response.text().catch(() => 'Could not read error body');
           throw new Error(`Failed to fetch list: ${response.status} ${errorText}`);
        }
      } catch (error: any) {
        console.error(`GalleryPage: Network or other error fetching list:`, error.message);
        toast.error('A network error occurred while fetching gallery list.');
        setIsLoadingItems(false);
        return null;
      }
    }

    if (!listData) {
        console.error("GalleryPage: Failed to fetch item list after retries.");
      setIsLoadingItems(false);
        return null;
    }

    const processedItems: CombinedItem[] = [];
    let urlFetchErrors = 0;

    for (const item of listData!.items) {
      if (item.name === '.keep') continue;

      if (item.type === 'file') {
        const fileItem = { ...item, imageUrl: undefined } as FileItem;
        processedItems.push(fileItem);
        
        if (!fileItem.path) {
          console.warn("GalleryPage: File item without path:", fileItem);
          continue; 
        }

        try {
          const urlResponse = await fetch(`/api/gallery/fetch?path=${encodeURIComponent(fileItem.path)}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            cache: 'no-store'
          });

          if (urlResponse.ok) {
            const urlData = await urlResponse.json();
            if (urlData.success && urlData.url) { 
              const index = processedItems.findIndex(f => f.type === 'file' && f.path === fileItem.path);
              if (index !== -1) {
                (processedItems[index] as FileItem).imageUrl = urlData.url;
              }
            } else {
              urlFetchErrors++;
              console.warn(`GalleryPage: Failed to get URL for ${fileItem.path}: ${urlData.error || 'Unknown error'}`);
      }
    } else {
            urlFetchErrors++;
            console.warn(`GalleryPage: Fetch URL request failed for ${fileItem.path} with status ${urlResponse.status}`);
            if (urlResponse.status === 401) toast.error("Auth error fetching image URL");
            if (urlResponse.status === 429) toast.warning("Rate limit hit fetching image URLs");
          }
        } catch (fetchError: any) {
          urlFetchErrors++;
          console.error(`GalleryPage: Error fetching URL for ${fileItem.path}:`, fetchError.message);
        }
      } else if (item.type === 'folder') {
        processedItems.push({ ...item, path: item.path ?? `${pathPrefix}${item.name}/` });
      } else {
        console.warn("GalleryPage: Unknown item type:", item);
      }
    }

    if (urlFetchErrors > 0) {
        toast.warning(`Could not load ${urlFetchErrors} image(s). Check console for details.`);
    }

    setItems(processedItems);
    setCurrentPathPrefix(listData.currentPrefix);
    setBreadcrumbs(generateBreadcrumbs(listData.currentPrefix));
    setIsLoadingItems(false);
    return listData;
  }, [user, router]);

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

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
        console.error('GalleryPage: Error fetching client session for create folder:', sessionError?.message);
        toast.error('Authentication session issue. Please sign in again.');
        setIsCreatingFolder(false);
        setCreateFolderError('Failed to get authentication token.');
      return;
    }

    const accessToken = sessionData.session.access_token;
    console.log("GalleryPage: Fetched access token client-side for create folder request.");

    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    };
    console.log('GalleryPage: Sending create-folder request with headers:', requestHeaders);

    try {
        const response = await fetch('/api/gallery/create-folder', {
            method: 'POST',
        headers: requestHeaders,
            body: JSON.stringify({ 
          folderName: newFolderName.trim(),
          parentPathPrefix: currentPathPrefix,
            }),
        });

      console.log(`GalleryPage: Create folder response status: ${response.status}`);

      if (response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error("GalleryPage: Failed to parse JSON response from create folder API", jsonError);
          toast.error('Received an invalid response from the server.');
          setCreateFolderError('Invalid server response.');
          return; // Exit early
        }
        
        if (data && data.success) {
            toast.success(`Folder "${newFolderName.trim()}" created successfully.`);
            setIsCreateFolderModalOpen(false);
            setNewFolderName('');
            await fetchItems(currentPathPrefix);
        } else {
            const errorMessage = data?.error || 'Failed to create folder (unknown API error).';
            console.error('GalleryPage: API failed to create folder:', errorMessage);
            setCreateFolderError(errorMessage);
            toast.error(errorMessage);
        }
        } else {
        const errorText = await response.text().catch(() => 'Could not read error response body');
        let apiError = `Failed to create folder. Status: ${response.status}`; 
        try {
           const errorJson = JSON.parse(errorText);
           apiError = errorJson.error || apiError;
        } catch (_) {
           apiError = response.statusText || apiError; // Fallback to status text
        }
        
        console.error(`GalleryPage: Failed to create folder. Status: ${response.status}, Body: ${errorText}`);
        setCreateFolderError(apiError);
        toast.error(apiError);
      }
    } catch (error: any) {
      console.error('GalleryPage: Network or other error creating folder:', error);
      setCreateFolderError('An unexpected error occurred. Please try again.');
      toast.error('A network error occurred while creating the folder.');
    } finally {
        setIsCreatingFolder(false);
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

  const findFoldersRecursive = (
      allItems: CombinedItem[],
      currentPrefix: string,
      excludePrefix?: string | null
  ): DestinationFolder[] => {
      const folders: DestinationFolder[] = [];
      for (const item of allItems) {
          if (item.type === 'folder' && item.name !== '.keep') {
              const folderPath = item.path ? item.path.replace(/\/?$/, '/') : `${currentPrefix}${item.name}/`;

              let shouldExclude = false;
              if (excludePrefix) {
                 if (folderPath === excludePrefix || folderPath.startsWith(excludePrefix)) {
                     shouldExclude = true;
                 }
              }

              if (!shouldExclude) {
                  folders.push({ name: item.name, path: folderPath });
              }
          }
      }
      return folders;
  };

  const fetchMoveDestinationFolders = async () => {
      if (!itemToMove) return;

      setIsLoadingMoveFolders(true);
      setMoveDestinationFolders([]);

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
          console.error('GalleryPage/FetchMoveDest: Error fetching client session:', sessionError?.message);
          toast.error('Authentication error fetching folders. Please sign in again.');
          router.push(ROUTES.login);
          setIsLoadingMoveFolders(false);
          return;
      }
      const accessToken = sessionData.session.access_token;
      console.log("GalleryPage/FetchMoveDest: Fetched access token.");

      try {
          const response = await fetch(`/api/gallery/list?pathPrefix=`, {
               method: 'GET',
               headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`,
               },
               cache: 'no-store'
          });

          console.log(`GalleryPage/FetchMoveDest: API response status: ${response.status}`);

          const result = await response.json();

          if (response.ok && result.success) {
              const sourceFolderPrefix = itemToMove.type === 'folder'
                  ? (itemToMove.path ?? `${currentPathPrefix}${itemToMove.name}/`)
                  : null;

              const potentialFolders = findFoldersRecursive(result.items, '', sourceFolderPrefix);

              const isSourceInRoot = itemToMove.type === 'folder' && !itemToMove.path?.includes('/');

              const destinations: DestinationFolder[] = [];
              if (!isSourceInRoot) {
                  destinations.push({ name: 'Root (Gallery Home)', path: '' });
              }
              destinations.push(...potentialFolders);

              const itemParentPath = itemToMove.path?.substring(0, itemToMove.path.lastIndexOf('/') + 1) ?? currentPathPrefix;

              const finalDestinations = destinations.filter(dest => {
                  if (itemToMove.type === 'folder') {
                      const sourcePath = itemToMove.path ?? `${currentPathPrefix}${itemToMove.name}/`;
                      if (dest.path === sourcePath) return false;
                  }
                  if (dest.path === itemParentPath) return false;
                  return true;
              });

               setMoveDestinationFolders(finalDestinations);
          } else {
               const errorMessage = result.error || `Failed to fetch folders (${response.status})`;
               console.error('GalleryPage/FetchMoveDest: API reported failure:', errorMessage, result);
               if (response.status === 401) {
                  toast.error('Authentication failed fetching folders. Please sign in again.');
                  router.push(ROUTES.login);
               } else {
                  toast.error(errorMessage);
               }
          }
      } catch (error: any) {
          console.error('GalleryPage/FetchMoveDest: Network or other error:', error.message);
          toast.error('A network error occurred while fetching destination folders.');
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
         return;
     }

    setIsMovingItem(true);

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
        console.error('GalleryPage/MoveItem: Error fetching client session:', sessionError?.message);
        toast.error('Authentication error. Please sign in again.');
        router.push(ROUTES.login);
        setIsMovingItem(false);
        return;
    }
    const accessToken = sessionData.session.access_token;
    console.log("GalleryPage/MoveItem: Fetched access token.");

    const sourcePath = itemToMove.path;
     if (!sourcePath) {
         console.error("GalleryPage/MoveItem: Source path missing for item:", itemToMove);
         toast.error("Cannot move item: source path information missing.");
         setIsMovingItem(false);
         return;
     }

    const itemType = itemToMove.type;

    try {
      const response = await fetch('/api/gallery/move', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ 
                sourcePath: sourcePath,
                destinationPathPrefix: selectedMoveDestination,
                itemType: itemType,
        }),
      });

        console.log(`GalleryPage/MoveItem: API response status: ${response.status}`);
        const result = await response.json();

        if (response.ok && result.success) {
            const destinationName = moveDestinationFolders.find(f => f.path === selectedMoveDestination)?.name || selectedMoveDestination || 'Root';
            toast.success(`"${itemToMove.name}" moved successfully to ${destinationName}!`);
      setIsMoveModalOpen(false);
            setItemToMove(null);
            await fetchItems(currentPathPrefix);
        } else {
            const errorMessage = result.error || `Failed to move item (${response.status})`;
            console.error('GalleryPage/MoveItem: API reported failure:', errorMessage, result);
             if (response.status === 401) {
                 toast.error('Authentication failed. Please sign in again.');
                 router.push(ROUTES.login);
             } else if (response.status === 404) {
                  toast.error(result.error || 'Source item not found. It might have been moved or deleted.');
                  await fetchItems(currentPathPrefix);
             } else if (response.status === 409) {
                  toast.error(result.error || 'An item with the same name already exists in the destination.');
             } else {
                 toast.error(errorMessage);
             }
        }
    } catch (error: any) {
        console.error('GalleryPage/MoveItem: Network or other error:', error.message);
        toast.error('A network error occurred while moving the item.');
    } finally {
        setIsMovingItem(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeletingItem(true);

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
        console.error('GalleryPage/DeleteItem: Error fetching client session:', sessionError?.message);
        toast.error('Authentication error. Please sign in again.');
        router.push(ROUTES.login);
        setIsDeletingItem(false);
      return;
    }
    const accessToken = sessionData.session.access_token;
    console.log("GalleryPage/DeleteItem: Fetched access token.");

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
        const response = await fetch('/api/gallery/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ 
                path: itemPath,
                itemType: itemType,
            }),
        });

        console.log(`GalleryPage/DeleteItem: API response status: ${response.status}`);
        let result;
        try {
            result = await response.json();
        } catch (jsonError) {
            console.error("GalleryPage/DeleteItem: Failed to parse JSON response:", jsonError);
            toast.error("Received an invalid response from the server.");
            setIsDeletingItem(false);
            return;
        }

        if (response.ok && result.success) {
             toast.success(`"${itemToDelete.name}" deleted successfully!`);
             setIsDeleteModalOpen(false);
             setItemToDelete(null);
             await fetchItems(currentPathPrefix);
        } else {
             const errorMessage = result.error || `Failed to delete item (${response.status})`;
             console.error('GalleryPage/DeleteItem: API reported failure:', errorMessage, result);
             if (response.status === 401) {
                 toast.error('Authentication failed. Please sign in again.');
                 router.push(ROUTES.login);
             } else if (response.status === 404) {
                 toast.error(result.error || 'Item not found. It might have already been deleted.');
                  await fetchItems(currentPathPrefix);
             } else {
                 toast.error(`Failed to delete: ${errorMessage}. ${result.details || ''}`);
             }
        }
    } catch (error: any) {
        console.error('GalleryPage/DeleteItem: Network or other error:', error.message);
        toast.error('A network error occurred while deleting the item.');
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
    return true;
  });

  const foldersToRender = filteredItems.filter(item => item.type === 'folder') as FolderItem[];
  const filesToRender = filteredItems.filter(item => item.type === 'file') as FileItem[];

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
      <div className="flex h-full w-full bg-background">
        <aside className="w-64 border-r border-border p-4 flex flex-col space-y-4 bg-card text-card-foreground fixed top-16 bottom-0 left-0 pt-4">
          <div className="text-lg font-semibold px-2">Filters</div>
          {filters.map((filter) => (
            <Button
              key={filter.name}
              variant={selectedFilter === filter.name ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setSelectedFilter(filter.name)}
              aria-pressed={selectedFilter === filter.name}
            >
              {filter.label}
            </Button>
          ))}
          <div className="flex-grow"></div>
        {showTip && (
              <div className={`transition-all duration-500 ease-in-out ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} bg-muted p-3 rounded-md text-sm text-muted-foreground mx-2`}>
                  <Lightbulb className="h-4 w-4 inline-block mr-1 mb-1 text-yellow-400"/>
                  <span className="font-semibold">Tip:</span> Drag & drop images onto the gallery to upload!
          </div>
        )}
           <div className="flex-shrink-0 mt-auto border-4 border-red-500">
             <GalleryUpload pathPrefix={currentPathPrefix} onUploadSuccess={() => fetchItems(currentPathPrefix)} />
           </div>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto min-h-0 rounded-t-2xl bg-white shadow-sm">
           <div className="mb-6">
             <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Gallery Home</h1>
           </div>
           <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <div className="flex items-center space-x-1 text-sm text-muted-foreground flex-wrap">
          {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.path || 'root'}>
                    {index > 0 && <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />}
                <button
                  onClick={() => handleBreadcrumbClick(crumb.path)}
                      className={`hover:text-foreground px-1 py-0.5 rounded ${index === breadcrumbs.length - 1 ? 'font-semibold text-foreground bg-muted' : 'hover:bg-muted'} ${index === 0 ? 'hidden' : ''}`}
                      aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}
                >
                  {crumb.name}
                </button>
                  </React.Fragment>
          ))}
          </div>
              <div className="flex gap-2">
                <Button onClick={handleOpenCreateFolderModal} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <FolderPlus className="mr-2 h-4 w-4" /> Create Folder
              </Button>
                <Button onClick={() => document.getElementById('gallery-upload-input')?.click()} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Upload className="mr-2 h-4 w-4" /> Upload Photos
                </Button>
          </div>
        </div>

          {isLoadingItems ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading gallery items...</span>
            </div>
        ) : (
            <>
              {(selectedFilter === 'all' || selectedFilter === 'folders') && foldersToRender.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3 text-foreground">Folders</h2>
                  <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {foldersToRender.map((folder) => (
                      <div
                        key={folder.name}
                        className="group min-w-0 relative cursor-pointer rounded-lg border border-border p-3 bg-card hover:shadow-md transition-shadow flex flex-col items-center text-center aspect-square justify-center"
                        onClick={() => handleFolderClick(folder.name)}
                        onKeyDown={(e) => e.key === 'Enter' && handleFolderClick(folder.name)}
                        tabIndex={0}
                        aria-label={`Open folder ${folder.name}`}
                      >
                        <FolderIcon size={48} className="mb-2 text-purple-500" />
                        <span className="text-sm font-medium text-card-foreground truncate w-full">{folder.name}</span>
                        <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-sm rounded p-1">
                            <Button 
                                variant="ghost" size="icon"
                                className="h-7 w-7 text-white hover:bg-white/20 hover:text-white"
                                onClick={(e) => { e.stopPropagation(); handleOpenMoveModal(folder); }}
                                aria-label={`Move folder ${folder.name}`}
                            >
                                <Move size={16} />
                            </Button>
                            <Button 
                                variant="ghost" size="icon"
                                className="h-7 w-7 text-red-400 hover:bg-red-400/20 hover:text-red-400"
                                onClick={(e) => { e.stopPropagation(); handleOpenDeleteModal(folder); }}
                                aria-label={`Delete folder ${folder.name}`}
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
            </div>
                    ))}
                  </div>
          </div>
        )}

              {foldersToRender.length > 0 && filesToRender.length > 0 && (selectedFilter === 'all') && (
                  <hr className="my-6 border-border" />
              )}

              {(selectedFilter === 'all' || selectedFilter === 'images') && filesToRender.length > 0 && (
                   <h2 className="text-xl font-semibold mb-3 text-foreground">Files</h2>
              )}

              {(selectedFilter === 'all' || selectedFilter === 'images') && filesToRender.length > 0 ? (
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filesToRender.map((file) => (
                    <Card
                      key={file.id}
                      className="overflow-hidden group relative cursor-pointer transition-all hover:shadow-lg min-w-0"
                      onClick={() => handleImageClick(file)}
                      onKeyDown={(e) => e.key === 'Enter' && handleImageClick(file)}
                      tabIndex={0}
                      aria-label={`View image ${file.name}`}
                    >
                      <CardContent className="p-0">
                        <div className="aspect-square w-full bg-muted flex items-center justify-center overflow-hidden">
                          {file.imageUrl ? (
                      <Image
                               src={file.imageUrl}
                               alt={file.name || 'Gallery image'}
                               width={300}
                               height={300}
                               className="object-cover w-full h-full transition-transform group-hover:scale-105"
                               onError={(e) => handleImageError(e, file.name)}
                               unoptimized={true}
                             />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                            )}
            </div>
                        <div className="p-3 bg-card">
                          <p className="text-sm font-medium truncate text-card-foreground" title={file.name}>{file.name}</p>
                          <p className="text-xs text-muted-foreground">{getTimeAgo(file.updated_at)}</p>
                        </div>
                        <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-sm rounded p-1">
                            <Button 
                                variant="ghost" size="icon"
                                className="h-7 w-7 text-white hover:bg-white/20 hover:text-white"
                                onClick={(e) => { e.stopPropagation(); handleOpenMoveModal(file); }}
                                aria-label={`Move image ${file.name}`}
                            >
                                <Move size={16} />
                            </Button>
                            <Button 
                                variant="ghost" size="icon"
                                className="h-7 w-7 text-red-400 hover:bg-red-400/20 hover:text-red-400"
                                onClick={(e) => { e.stopPropagation(); handleOpenDeleteModal(file); }}
                                aria-label={`Delete image ${file.name}`}
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : null}

              {!isLoadingItems && foldersToRender.length === 0 && filesToRender.length === 0 && (
                   <div className="text-center text-muted-foreground py-16">
                      <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="font-semibold text-lg">This folder is empty.</p>
                      <p className="text-sm">Upload some images or create a new folder to get started.</p>
                      </div>
              )}
                  </>
                )}
        </main>
      </div>
      
      <Dialog open={isCreateFolderModalOpen} onOpenChange={setIsCreateFolderModalOpen}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
              Enter a name for your new folder within the current location:{" "}
              <code className="bg-muted px-1 py-0.5 rounded">
                {currentPathPrefix || 'Root'}
              </code>.
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
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., Summer Vacation"
                  required
                  disabled={isCreatingFolder}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                 <Button type="button" variant="outline" disabled={isCreatingFolder}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isCreatingFolder || !newFolderName.trim()}>
                {isCreatingFolder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderPlus className="mr-2 h-4 w-4" />}
                {isCreatingFolder ? 'Creating...' : 'Create Folder'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isMoveModalOpen} onOpenChange={setIsMoveModalOpen}>
         <DialogContent>
           <DialogHeader>
              <DialogTitle>Move "{itemToMove?.name}"</DialogTitle>
              <DialogDescription>
                     Select the destination folder to move this {itemToMove?.type}.
              </DialogDescription>
           </DialogHeader>
             <div className="py-4">
                 <Label htmlFor="destination-folder">Destination</Label>
             {isLoadingMoveFolders ? (
                      <div className="flex items-center justify-center h-20">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          <span className="ml-2 text-muted-foreground">Loading folders...</span>
               </div>
             ) : moveDestinationFolders.length > 0 ? (
                     <Select
                         onValueChange={(value: string) => setSelectedMoveDestination(value)}
                         value={selectedMoveDestination ?? undefined}
                         disabled={isMovingItem}
                     >
                         <SelectTrigger id="destination-folder">
                             <SelectValue placeholder="Select a folder..." />
                         </SelectTrigger>
                         <SelectContent>
                             {moveDestinationFolders.map((folder) => (
                                 <SelectItem key={folder.path} value={folder.path}>
                                     <FolderIcon size={16} className="inline-block mr-2 mb-0.5" />
                         {folder.name}
                                     {folder.path !== '' && <span className="text-xs text-muted-foreground ml-1">({folder.path})</span>}
                                 </SelectItem>
                             ))}
                         </SelectContent>
                     </Select>
                  ) : (
                     <p className="text-sm text-muted-foreground mt-2">No other folders found to move to.</p>
                  )}

           </div>
           <DialogFooter>
              <DialogClose asChild>
                     <Button type="button" variant="outline" disabled={isMovingItem}>Cancel</Button>
              </DialogClose>
              <Button 
                onClick={handleConfirmMove} 
                    disabled={isMovingItem || selectedMoveDestination === null || isLoadingMoveFolders}
                 >
                     {isMovingItem ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Move className="mr-2 h-4 w-4" />}
                     {isMovingItem ? 'Moving...' : 'Confirm Move'}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                       This action cannot be undone. This will permanently delete the
                       {' '}<span className="font-semibold">{itemToDelete?.type}</span>{' '}
                       <span className="font-semibold">"{itemToDelete?.name}"</span>
                       {itemToDelete?.type === 'folder' ? ' and all its contents.' : '.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingItem}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isDeletingItem}
                       className={buttonVariants({ variant: "destructive" })}
                   >
                       {isDeletingItem ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                       {isDeletingItem ? 'Deleting...' : 'Yes, Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <Dialog open={isPreviewOpen} onOpenChange={handleClosePreview}>
         <DialogContent className="max-w-3xl">
             <DialogHeader>
                 <DialogTitle>{selectedImage?.name}</DialogTitle>
                 <DialogDescription>
                    Uploaded: {getTimeAgo(selectedImage?.created_at)} | Last Modified: {getTimeAgo(selectedImage?.updated_at)}
                 </DialogDescription>
             </DialogHeader>
             {selectedImage?.imageUrl ? (
                 <Image
                   src={selectedImage.imageUrl}
                   alt={selectedImage.name || 'Preview image'}
                   width={800}
                   height={600}
                   className="object-contain w-full h-auto max-h-[70vh] rounded-md"
                   onError={(e) => handleImageError(e, selectedImage.name)}
                   unoptimized={true}
                 />
             ) : (
                 <div className="flex items-center justify-center h-64 bg-muted rounded-md">
                     {selectedImage ? <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" /> : <ImageIcon className="h-24 w-24 text-muted-foreground" />}
                 </div>
             )}
             <DialogFooter className="mt-4">
                 <DialogClose asChild>
                     <Button variant="outline">Close</Button>
                 </DialogClose>
                 <Button
                     variant="destructive"
                     onClick={(e) => {
                         e.stopPropagation();
                         handleClosePreview();
                         setTimeout(() => {
                             if (selectedImage) handleOpenDeleteModal(selectedImage);
                         }, 100);
                     }}
                     disabled={!selectedImage}
                 >
                     <Trash2 className="mr-2 h-4 w-4" /> Delete
                 </Button>
             </DialogFooter>
         </DialogContent>
       </Dialog>
    </MainLayout>
  );
} 