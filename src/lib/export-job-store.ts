/**
 * Export Job Store
 * 
 * HYBRID job store for managing PDF export jobs.
 * - Production (Railway): Uses Railway Redis for cross-instance persistence
 * - Development: Falls back to in-memory store with globalThis
 *
 * This solves the serverless "job not found" issue where each API request
 * may run in a different instance without shared memory.
 *
 * Jobs are automatically cleaned up after 10 minutes to prevent memory leaks.
 */

import { ExportJobState } from "@/types/export-job";
import type { Redis } from "ioredis";

// =============================================================================
// Configuration
// =============================================================================

/** How long to keep completed/failed jobs before cleanup (10 minutes) */
const JOB_TTL_MS = 10 * 60 * 1000;

/** Job TTL in seconds for Redis (10 minutes) */
const JOB_TTL_SECONDS = 600;

/** How often to run cleanup (every 2 minutes) - only for in-memory fallback */
const CLEANUP_INTERVAL_MS = 2 * 60 * 1000;

// =============================================================================
// Railway Redis Integration (Production)
// =============================================================================

let redisClient: Redis | null = null;
let redisInitialized = false;

/**
 * Initialize Railway Redis if available (production environment)
 * Returns true if Redis is available, false otherwise
 */
async function initRedis(): Promise<boolean> {
  if (redisInitialized) {
    return redisClient !== null;
  }

  redisInitialized = true;

  try {
    // Check if REDIS_URL is set (Railway provides this)
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_PRIVATE_URL;

    if (redisUrl) {
      const Redis = (await import("ioredis")).default;

      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError: (err) => {
          console.warn("[ExportJobStore] Redis reconnect on error:", err.message);
          return true;
        },
      });

      // Test connection
      await redisClient.ping();

      console.log("[ExportJobStore] ✅ Railway Redis initialized (production mode)");

      // Handle connection errors
      redisClient.on("error", (err) => {
        console.error("[ExportJobStore] Redis connection error:", err);
      });

      redisClient.on("connect", () => {
        console.log("[ExportJobStore] Redis connected");
      });

      return true;
    } else {
      console.log("[ExportJobStore] ⚠️ No REDIS_URL found, using in-memory fallback (development mode)");
      return false;
    }
  } catch (error) {
    console.warn("[ExportJobStore] ⚠️ Failed to initialize Railway Redis, using in-memory fallback:", error);
    return false;
  }
}

/**
 * Check if Redis is available
 */
function hasRedis(): boolean {
  return redisInitialized && redisClient !== null;
}

// =============================================================================
// In-Memory Store (Fallback for Development)
// =============================================================================

// Extend globalThis type to include our store
declare global {
  // eslint-disable-next-line no-var
  var __exportJobStore: Map<string, ExportJobState> | undefined;
  // eslint-disable-next-line no-var
  var __exportJobStoreCleanupStarted: boolean | undefined;
}

/**
 * Get or create the in-memory job store (fallback for development)
 */
function getInMemoryStore(): Map<string, ExportJobState> {
  if (!globalThis.__exportJobStore) {
    globalThis.__exportJobStore = new Map<string, ExportJobState>();
    console.log("[ExportJobStore] Initialized in-memory job store (fallback)");
  }
  return globalThis.__exportJobStore;
}

/**
 * Get Redis key for a job
 */
function getJobKey(jobId: string): string {
  return `export-job:${jobId}`;
}

// =============================================================================
// UUID Generation
// =============================================================================

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// =============================================================================
// Store Operations (Hybrid: KV or In-Memory)
// =============================================================================

/**
 * Create a new export job
 */
export async function createJob(resumeId: number, templateId: string): Promise<ExportJobState> {
  const jobId = generateUUID();
  const now = Date.now();
  
  const job: ExportJobState = {
    jobId,
    status: "processing",
    resumeId,
    templateId,
    createdAt: now,
    updatedAt: now,
  };
  
  // Try Redis first, fallback to in-memory
  await initRedis();

  if (hasRedis() && redisClient) {
    try {
      await redisClient.setex(getJobKey(jobId), JOB_TTL_SECONDS, JSON.stringify(job));
      console.log(`[ExportJobStore] Created job ${jobId} in Redis for resume ${resumeId}`);
      return job;
    } catch (error) {
      console.warn(`[ExportJobStore] Failed to create job in Redis, falling back to in-memory:`, error);
    }
  }

  // Fallback to in-memory
  const store = getInMemoryStore();
  store.set(jobId, job);
  console.log(`[ExportJobStore] Created job ${jobId} in memory for resume ${resumeId} (total jobs: ${store.size})`);

  return job;
}

/**
 * Get a job by ID
 */
export async function getJob(jobId: string): Promise<ExportJobState | undefined> {
  await initRedis();

  // Try Redis first
  if (hasRedis() && redisClient) {
    try {
      const data = await redisClient.get(getJobKey(jobId));
      if (data) {
        const job = JSON.parse(data) as ExportJobState;
        console.log(`[ExportJobStore] Getting job ${jobId} from Redis: ${job.status}`);
        return job;
      }
    } catch (error) {
      console.warn(`[ExportJobStore] Failed to get job from Redis:`, error);
    }
  }

  // Fallback to in-memory
  const store = getInMemoryStore();
  const job = store.get(jobId);
  console.log(`[ExportJobStore] Getting job ${jobId} from memory: ${job ? job.status : 'NOT FOUND'} (store size: ${store.size})`);
  return job;
}

/**
 * Update a job's status to "done" with the file URL
 */
export async function completeJob(jobId: string, fileUrl: string): Promise<void> {
  await initRedis();

  // Try Redis first
  if (hasRedis() && redisClient) {
    try {
      const data = await redisClient.get(getJobKey(jobId));
      if (data) {
        const job = JSON.parse(data) as ExportJobState;
        job.status = "done";
        job.fileUrl = fileUrl;
        job.updatedAt = Date.now();
        await redisClient.setex(getJobKey(jobId), JOB_TTL_SECONDS, JSON.stringify(job));
        console.log(`[ExportJobStore] Job ${jobId} completed in Redis with URL: ${fileUrl.substring(0, 50)}...`);
        return;
      }
    } catch (error) {
      console.warn(`[ExportJobStore] Failed to complete job in Redis:`, error);
    }
  }

  // Fallback to in-memory
  const store = getInMemoryStore();
  const job = store.get(jobId);
  if (job) {
    job.status = "done";
    job.fileUrl = fileUrl;
    job.updatedAt = Date.now();
    store.set(jobId, job);
    console.log(`[ExportJobStore] Job ${jobId} completed in memory with URL: ${fileUrl.substring(0, 50)}...`);
  } else {
    console.warn(`[ExportJobStore] Attempted to complete non-existent job: ${jobId}`);
  }
}

/**
 * Update a job's status to "error" with an error message
 */
export async function failJob(jobId: string, error: string): Promise<void> {
  await initRedis();

  // Try Redis first
  if (hasRedis() && redisClient) {
    try {
      const data = await redisClient.get(getJobKey(jobId));
      if (data) {
        const job = JSON.parse(data) as ExportJobState;
        job.status = "error";
        job.error = error;
        job.updatedAt = Date.now();
        await redisClient.setex(getJobKey(jobId), JOB_TTL_SECONDS, JSON.stringify(job));
        console.error(`[ExportJobStore] Job ${jobId} failed in Redis: ${error}`);
        return;
      }
    } catch (redisError) {
      console.warn(`[ExportJobStore] Failed to fail job in Redis:`, redisError);
    }
  }

  // Fallback to in-memory
  const store = getInMemoryStore();
  const job = store.get(jobId);
  if (job) {
    job.status = "error";
    job.error = error;
    job.updatedAt = Date.now();
    store.set(jobId, job);
    console.error(`[ExportJobStore] Job ${jobId} failed in memory: ${error}`);
  } else {
    console.warn(`[ExportJobStore] Attempted to fail non-existent job: ${jobId}`);
  }
}

/**
 * Delete a job from the store
 */
export async function deleteJob(jobId: string): Promise<void> {
  await initRedis();

  // Try Redis first
  if (hasRedis() && redisClient) {
    try {
      await redisClient.del(getJobKey(jobId));
      console.log(`[ExportJobStore] Deleted job ${jobId} from Redis`);
      return;
    } catch (error) {
      console.warn(`[ExportJobStore] Failed to delete job from Redis:`, error);
    }
  }

  // Fallback to in-memory
  const store = getInMemoryStore();
  store.delete(jobId);
  console.log(`[ExportJobStore] Deleted job ${jobId} from memory`);
}

/**
 * Get all jobs (for debugging) - only works with in-memory store
 */
export function getAllJobs(): ExportJobState[] {
  const store = getInMemoryStore();
  return Array.from(store.values());
}

/**
 * Get store statistics (for monitoring) - only works with in-memory store
 */
export function getStoreStats(): {
  totalJobs: number;
  processing: number;
  done: number;
  error: number;
  storageType: "redis" | "memory";
} {
  const store = getInMemoryStore();
  const jobs = Array.from(store.values());
  return {
    totalJobs: jobs.length,
    processing: jobs.filter(j => j.status === "processing").length,
    done: jobs.filter(j => j.status === "done").length,
    error: jobs.filter(j => j.status === "error").length,
    storageType: hasRedis() ? "redis" : "memory",
  };
}

// =============================================================================
// Cleanup Logic (Only for In-Memory Store)
// =============================================================================

function cleanupOldJobs(): void {
  // Redis handles TTL automatically, only cleanup in-memory
  if (hasRedis()) {
    return;
  }

  const store = getInMemoryStore();
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [jobId, job] of store.entries()) {
    if (job.status === "processing") continue;
    
    if (now - job.updatedAt > JOB_TTL_MS) {
      store.delete(jobId);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`[ExportJobStore] Cleaned up ${cleanedCount} old jobs from memory`);
  }
}

// Start cleanup interval ONLY ONCE using global flag (only for in-memory)
if (typeof setInterval !== "undefined" && !globalThis.__exportJobStoreCleanupStarted) {
  globalThis.__exportJobStoreCleanupStarted = true;
  setInterval(cleanupOldJobs, CLEANUP_INTERVAL_MS);
  console.log("[ExportJobStore] Started automatic cleanup interval for in-memory store");
}

// =============================================================================
// Export
// =============================================================================

export const exportJobStore = {
  createJob,
  getJob,
  completeJob,
  failJob,
  deleteJob,
  getAllJobs,
  getStoreStats,
};

export default exportJobStore;
