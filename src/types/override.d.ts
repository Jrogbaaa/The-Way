// Type overrides for conflicting function signatures

declare module '@/lib/services/scheduler' {
  export function getJobsStatus(): any[];
  export function runManualTrendRefresh(): Promise<void>;
  export function initializeScheduler(): void;
  export function shutdownScheduler(): void;
}

declare module '@/lib/services/trends' {
  export function searchTrends(keyword?: string | null, limit?: number): Promise<any[]>;
  export function getCurrentTrends(category?: string, limit?: number): Promise<any[]>;
  export function getPlatformTrends(platform: string, limit?: number): Promise<any[]>;
  export function getContentTypeTrends(contentType: string, limit?: number): Promise<any[]>;
  export function refreshAllTrendSources(): Promise<any[]>;
  export function initializeTrendSystem(): Promise<void>;
} 