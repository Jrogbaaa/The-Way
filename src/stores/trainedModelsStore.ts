// This is a compatibility layer that provides an empty implementation
// since the original feature has been removed

import { create } from 'zustand';

// Define the store types
interface TrainedModel {
  id: string;
  name: string;
  description?: string;
  status: 'training' | 'ready' | 'failed' | 'external';
  replicate_id?: string;
  category: string;
  metadata?: {
    triggerWord?: string;
    modelType?: string;
    sampleImageUrl?: string;
    virtualModel?: boolean;
  };
}

interface TrainedModelsStore {
  trainedModels: TrainedModel[];
  addTrainedModel: (model: Omit<TrainedModel, 'id'>) => void;
  updateModelStatus: (id: string, status: TrainedModel['status'], metadata?: any) => void;
  getModelById: (id: string) => TrainedModel | undefined;
}

// Create an empty stub store
export const useTrainedModelsStore = create<TrainedModelsStore>((set, get) => ({
  trainedModels: [],
  addTrainedModel: () => {
    console.warn('TrainedModelsStore: Feature has been removed');
  },
  updateModelStatus: () => {
    console.warn('TrainedModelsStore: Feature has been removed');
  },
  getModelById: () => {
    console.warn('TrainedModelsStore: Feature has been removed');
    return undefined;
  }
})); 