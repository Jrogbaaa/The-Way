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

export default function GalleryPage() {
  const { user, loading, session } = useAuth();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

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

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
          // Request recursive list of folders from the API
          const response = await fetch(`/api/gallery/list?recursive=true`, {
               method: 'GET',
               headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`,
               },
               cache: 'no-store'
          });

          console.log(`GalleryPage/FetchMoveDest (Recursive): API response status: ${response.status}`);

          const result = await response.json();

          if (response.ok && result.success) {
              // API now returns only folders when recursive=true
              let potentialFolders: DestinationFolder[] = result.items || [];
              console.log(`GalleryPage/FetchMoveDest: Received ${potentialFolders.length} folders recursively.`);

              // Determine the item's parent path for filtering
              let itemParentPath = ''; // Default to root
              if (itemToMove.path) {
                  const lastSlashIndex = itemToMove.path.lastIndexOf('/');
                  // Handle paths like 'file.jpg' (root) vs 'folder/file.jpg'
                  if (lastSlashIndex > 0 && lastSlashIndex < itemToMove.path.length - 1) {
                       // Path like 'folder/sub/file.jpg' -> parent 'folder/sub/'
                       itemParentPath = itemToMove.path.substring(0, lastSlashIndex + 1);
                  } else if (lastSlashIndex === -1 && itemToMove.path.includes('/')) {
                       // Path like 'folder/' -> parent '' (root)
                       itemParentPath = ''; // Already root
                  } else if (lastSlashIndex === -1) {
                     // Path like 'file.jpg' -> parent '' (root)
                     itemParentPath = '';
                  }
                  // Ensure consistent trailing slash for comparison
                  if (itemParentPath && !itemParentPath.endsWith('/')) {
                      itemParentPath += '/';
                  }
              } else {
                  // If item has no path, assume it's in the currently viewed prefix
                  itemParentPath = currentPathPrefix;
              }
              console.log(`GalleryPage/FetchMoveDest: Determined item parent path: "${itemParentPath}"`);

              // Add "Root" as a potential destination if the item isn't already there
              const destinations: DestinationFolder[] = [];
              if (itemParentPath !== '') {
                  destinations.push({ name: 'Root (Gallery Home)', path: '' });
              }
              
              // Add the fetched folders
              destinations.push(...potentialFolders);

              // Filter destinations
              const finalDestinations = destinations.filter(dest => {
                  // 1. Cannot move to its current parent folder
                  if (dest.path === itemParentPath) {
                      console.log(`Filtering out current parent: ${dest.path}`);
                      return false; 
                  }

                  // 2. If moving a FOLDER, cannot move into itself or a subfolder of itself
                  if (itemToMove.type === 'folder') {
                      const sourceFolderPath = itemToMove.path ?? `${currentPathPrefix}${itemToMove.name}/`; // Ensure trailing slash
                      if (dest.path === sourceFolderPath) {
                          console.log(`Filtering out source folder itself: ${dest.path}`);
                          return false; // Cannot move into itself
                      }
                      if (dest.path.startsWith(sourceFolderPath)) {
                          console.log(`Filtering out subfolder of source: ${dest.path}`);
                          return false; // Cannot move into a subfolder of itself
                      }
                  }
                  return true; // Keep the destination
              });

               console.log(`GalleryPage/FetchMoveDest: Final destinations count: ${finalDestinations.length}`);
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
    return false;
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
      <div className="flex h-screen">
        
        <aside className={`
          fixed inset-y-0 left-0 z-30 
          w-64 border-r border-border p-4 pt-20 
          flex flex-col space-y-4 
          bg-card text-card-foreground 
          transition-transform duration-300 ease-in-out 
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:sticky md:pt-4 
        `}>
          <div className="flex justify-between items-center md:hidden">
             <h3 className="text-lg font-semibold px-2">Filters</h3>
             <Button variant="ghost" size="icon" onClick={() => setIsMobileSidebarOpen(false)}>
                <X className="h-5 w-5" />
                <span className="sr-only">Close filters</span>
             </Button>
          </div>
           <h3 className="text-lg font-semibold px-2 hidden md:block">Filters</h3>
          {filters.map((filter) => (
            <Button
              key={filter.name}
              variant={selectedFilter === filter.name ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => {
                setSelectedFilter(filter.name);
                setIsMobileSidebarOpen(false);
              }}
              aria-pressed={selectedFilter === filter.name}
            >
              {filter.label}
            </Button>
          ))}
        </aside>

        <main className="flex-1 overflow-y-auto p-4 pt-20 md:pt-6 md:ml-64 lg:ml-72">
          <div className="md:hidden flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                 My Gallery
              </h1>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileSidebarOpen(true)}>
                 <Menu className="h-6 w-6" />
                 <span className="sr-only">Open filters</span>
              </Button>
           </div>

           <div className="hidden md:block mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 shadow-sm">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">My Gallery</h1>
              <p className="text-gray-600">Browse, manage, and upload your content.</p>
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
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredItems
                       .sort((a, b) => {
                            if (a.type === 'folder' && b.type !== 'folder') return -1;
                            if (a.type !== 'folder' && b.type === 'folder') return 1;
                            return a.name.localeCompare(b.name);
                        })
                       .map((item) => (
                           item.type === 'folder' ? (
                              <Card 
                                key={item.name} 
                                className="group relative cursor-pointer overflow-hidden hover:shadow-md transition-shadow bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                                onClick={() => handleFolderClick(item.name)}
                                onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? handleFolderClick(item.name) : null}
                                tabIndex={0}
                                role="button"
                                aria-label={`Open folder ${item.name}`}
                              >
                                  <CardContent className="p-4 flex flex-col items-center justify-center aspect-square">
                                      <FolderIcon className="h-16 w-16 text-blue-500 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                                      <span className="text-sm font-medium text-center break-words w-full line-clamp-2 text-gray-700 dark:text-gray-200">{item.name}</span>
                                  </CardContent>
                                  <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <Button onClick={(e) => { e.stopPropagation(); handleOpenMoveModal(item); }} variant="ghost" size="icon" className="h-6 w-6 bg-white/80 hover:bg-white dark:bg-gray-700/80 dark:hover:bg-gray-600 rounded-full">
                                            <Move className="h-3 w-3" />
                                            <span className="sr-only">Move folder {item.name}</span>
                                        </Button>
                                        <Button onClick={(e) => { e.stopPropagation(); handleOpenDeleteModal(item); }} variant="ghost" size="icon" className="h-6 w-6 bg-white/80 hover:bg-white dark:bg-gray-700/80 dark:hover:bg-gray-600 rounded-full text-red-500 hover:text-red-600">
                                            <Trash2 className="h-3 w-3" />
                                            <span className="sr-only">Delete folder {item.name}</span>
                                        </Button>
                                  </div>
                              </Card>
                          ) : (
                              <Card 
                                key={item.id} 
                                className="group relative overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
                                onClick={() => handleImageClick(item)}
                                onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? handleImageClick(item) : null}
                                tabIndex={0}
                                role="button"
                                aria-label={`View image ${item.title || item.name}`}
                              >
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
                          )
                      ))
                  }
            </div>
        )}
        </main>
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