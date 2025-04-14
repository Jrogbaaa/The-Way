/**
 * Scheduler Service
 * Handles recurring jobs for web scraping and trend analysis
 */

import { refreshAllTrendSources, initializeTrendSystem } from './trends';

// Job status tracking
type JobStatus = 'idle' | 'running' | 'completed' | 'failed';

type ScheduledJob = {
  id: string;
  name: string;
  description: string;
  cronSchedule?: string; // Cron format for job schedule
  interval?: number;     // Alternative: milliseconds interval
  lastRun?: Date;
  nextRun?: Date;
  status: JobStatus;
  handler: () => Promise<any>;
};

// Active jobs collection
const scheduledJobs: Record<string, ScheduledJob> = {};
const activeTimers: Record<string, NodeJS.Timeout> = {};

/**
 * Schedule a job to run at specified intervals
 */
export function scheduleJob(job: Omit<ScheduledJob, 'nextRun'>) {
  // Ensure job has an ID
  const jobWithMetadata = {
    ...job,
    status: 'idle' as JobStatus,
    nextRun: calculateNextRun(job)
  };
  
  // Store job in collection
  scheduledJobs[job.id] = jobWithMetadata;
  
  // Schedule the job
  if (job.interval) {
    // Simple interval-based scheduling
    activeTimers[job.id] = setInterval(async () => {
      await runJob(job.id);
    }, job.interval);
    
    console.log(`Scheduled job '${job.name}' to run every ${job.interval / 1000} seconds`);
  } else if (job.cronSchedule) {
    // For cron-based scheduling, we'd need a cron parser library
    // This is a simplified placeholder implementation
    console.log(`Scheduled job '${job.name}' with cron schedule ${job.cronSchedule}`);
    
    // For now, we'll schedule a daily check
    const checkCronInterval = 60 * 60 * 1000; // Check every hour
    activeTimers[job.id] = setInterval(async () => {
      const now = new Date();
      const jobNextRun = scheduledJobs[job.id].nextRun;
      
      if (jobNextRun && now >= jobNextRun) {
        await runJob(job.id);
      }
    }, checkCronInterval);
  }
  
  return job.id;
}

/**
 * Calculate the next run time for a job
 */
function calculateNextRun(job: Omit<ScheduledJob, 'nextRun'>): Date | undefined {
  if (job.interval) {
    return new Date(Date.now() + job.interval);
  }
  
  if (job.cronSchedule) {
    // For proper cron handling, we would need a cron parser library
    // This is a simple placeholder - assuming daily at midnight
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }
  
  return undefined;
}

/**
 * Run a scheduled job immediately
 */
export async function runJob(jobId: string) {
  const job = scheduledJobs[jobId];
  if (!job) {
    console.error(`Job ${jobId} not found`);
    return;
  }
  
  // Update job status
  scheduledJobs[jobId] = {
    ...job,
    status: 'running',
    lastRun: new Date()
  };
  
  try {
    console.log(`Running job: ${job.name}`);
    await job.handler();
    
    // Update job status and next run time
    scheduledJobs[jobId] = {
      ...scheduledJobs[jobId],
      status: 'completed',
      nextRun: calculateNextRun(job)
    };
    
    console.log(`Job ${job.name} completed successfully`);
  } catch (error) {
    console.error(`Error running job ${job.name}:`, error);
    
    // Update job status to failed
    scheduledJobs[jobId] = {
      ...scheduledJobs[jobId],
      status: 'failed',
      nextRun: calculateNextRun(job)
    };
  }
}

/**
 * Stop a scheduled job
 */
export function stopJob(jobId: string) {
  if (activeTimers[jobId]) {
    clearInterval(activeTimers[jobId]);
    delete activeTimers[jobId];
    
    if (scheduledJobs[jobId]) {
      scheduledJobs[jobId].status = 'idle';
    }
    
    console.log(`Stopped job: ${scheduledJobs[jobId]?.name || jobId}`);
    return true;
  }
  
  return false;
}

/**
 * Get the status of all scheduled jobs
 */
export function getJobsStatus() {
  return Object.values(scheduledJobs).map(job => ({
    id: job.id,
    name: job.name,
    description: job.description,
    lastRun: job.lastRun,
    nextRun: job.nextRun,
    status: job.status
  }));
}

/**
 * Initialize the trend scraping job
 */
export function initializeTrendScraping() {
  // Initialize the trends database
  initializeTrendSystem().catch(error => {
    console.error('Failed to initialize trend system:', error);
  });
  
  // Schedule weekly trend refreshes
  scheduleJob({
    id: 'trend-refresh',
    name: 'Social Media Trend Refresh',
    description: 'Scrapes various sources to update social media trend data',
    interval: 7 * 24 * 60 * 60 * 1000, // Weekly
    status: 'idle' as JobStatus,
    handler: async () => {
      console.log('Starting scheduled trend refresh');
      const results = await refreshAllTrendSources();
      console.log(`Scheduled trend refresh completed with ${results.length} items`);
      return results;
    }
  });
  
  console.log('Trend scraping job scheduled');
}

/**
 * Run a manual trend refresh
 */
export async function runManualTrendRefresh() {
  return runJob('trend-refresh');
}

/**
 * Should be called during application startup
 */
export function initializeScheduler() {
  // Initialize trend scraping
  initializeTrendScraping();
  
  console.log('Scheduler service initialized');
}

// Cleanup function to prevent memory leaks
export function shutdownScheduler() {
  Object.keys(activeTimers).forEach(jobId => {
    clearInterval(activeTimers[jobId]);
    delete activeTimers[jobId];
  });
  
  console.log('Scheduler service shut down');
} 