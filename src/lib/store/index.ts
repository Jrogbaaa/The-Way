import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, AuthState, User } from '../types';

// Initial auth state
const initialAuthState: AuthState = {
  user: null,
  isLoading: true,
  error: null,
};

// Create the main app store
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      auth: initialAuthState,
      ui: {
        sidebarOpen: true,
        theme: 'system',
      },
    }),
    {
      name: 'ai-content-platform-storage',
      partialize: (state) => ({
        ui: state.ui,
      }),
    }
  )
);

// Auth actions
export const useAuthStore = create<
  AuthState & {
    setUser: (user: User | null) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    signOut: () => void;
  }
>((set) => ({
  ...initialAuthState,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  signOut: () => set({ user: null, error: null, isLoading: false }),
}));

// UI actions
export const useUIStore = create<{
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}>((set) => ({
  sidebarOpen: true,
  theme: 'system',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTheme: (theme) => set({ theme }),
}));

// Feature flags store
export const useFeatureFlagsStore = create<{
  enableExperimentalModels: boolean;
  enableVideoGeneration: boolean;
  enableModelTraining: boolean;
  enableSocialSharing: boolean;
  enablePlugins: boolean;
  toggleFeature: (feature: string) => void;
  setFeature: (feature: string, enabled: boolean) => void;
}>()(
  persist(
    (set) => ({
      enableExperimentalModels: false,
      enableVideoGeneration: false,
      enableModelTraining: false,
      enableSocialSharing: true,
      enablePlugins: true,
      toggleFeature: (feature) =>
        set((state) => ({
          [feature]: !state[feature as keyof typeof state],
        })),
      setFeature: (feature, enabled) =>
        set(() => ({
          [feature]: enabled,
        })),
    }),
    {
      name: 'ai-content-platform-features',
    }
  )
);

// Models store
export const useModelsStore = create<{
  models: Record<string, any>;
  loadingModels: boolean;
  setModels: (models: Record<string, any>) => void;
  addModel: (modelId: string, model: any) => void;
  removeModel: (modelId: string) => void;
  setLoadingModels: (loading: boolean) => void;
}>((set) => ({
  models: {},
  loadingModels: false,
  setModels: (models) => set({ models }),
  addModel: (modelId, model) =>
    set((state) => ({
      models: { ...state.models, [modelId]: model },
    })),
  removeModel: (modelId) =>
    set((state) => {
      const newModels = { ...state.models };
      delete newModels[modelId];
      return { models: newModels };
    }),
  setLoadingModels: (loading) => set({ loadingModels: loading }),
}));

export default useAppStore; 