/**
 * Firebase Storage File Utility
 * 
 * This module provides a centralized way to access Firebase Storage files.
 * 
 * IMPORTANT: We store ONLY the file path in the database, NOT the full download URL.
 * Example path: "careermate-files/candidates/5/avatar/xxx.jpg"
 * 
 * Every time the FE needs to display a file, it must call getDownloadURL().
 * This ensures:
 * - URLs are always valid (tokens refresh automatically)
 * - No "Invalid HTTP method/URL pair" errors
 * - No broken URLs when Firebase rotates tokens
 * - Clean, consistent codebase
 */

import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { useState, useEffect } from "react";

/**
 * Get the download URL for a file stored in Firebase Storage
 * 
 * @param path - The storage path (e.g., "careermate-files/candidates/5/avatar/xxx.jpg")
 * @returns Promise<string> - The download URL
 * 
 * @example
 * const url = await getFileUrl("careermate-files/candidates/5/avatar/photo.jpg");
 */
export async function getFileUrl(path: string): Promise<string> {
  if (!path) {
    throw new Error("File path is required");
  }
  
  const fileRef = ref(storage, path);
  return await getDownloadURL(fileRef);
}

/**
 * Check if a string is a Firebase Storage path (not a full URL)
 * 
 * @param value - The string to check
 * @returns boolean - True if it's a storage path, false if it's a URL
 */
export function isStoragePath(value: string): boolean {
  if (!value) return false;
  
  // If it starts with http:// or https://, it's a URL
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return false;
  }
  
  // If it contains our storage root, it's a path
  if (value.includes("careermate-files/")) {
    return true;
  }
  
  // Default: treat as path if no URL scheme
  return !value.includes("://");
}

/**
 * Check if a Firebase URL has incorrectly unencoded path
 * Firebase URLs should have %2F instead of / in the path after /o/
 * 
 * Example bad URL:
 * https://firebasestorage.googleapis.com/v0/b/bucket/o/careermate-files/candidates/5/avatar/photo.jpg
 * 
 * Should be:
 * https://firebasestorage.googleapis.com/v0/b/bucket/o/careermate-files%2Fcandidates%2F5%2Favatar%2Fphoto.jpg
 */
export function isInvalidFirebaseUrl(url: string): boolean {
  if (!url) return false;
  
  // Check if it's a Firebase Storage URL
  if (!url.includes("firebasestorage.googleapis.com")) {
    return false;
  }
  
  // Check if path after /o/ contains unencoded slashes
  const match = url.match(/\/o\/([^?]+)/);
  if (!match) return false;
  
  const pathPart = match[1];
  // If path contains "/" instead of "%2F", it's invalid
  // BUT: if it also contains %2F, it means some parts are encoded, so treat as valid
  if (pathPart.includes("%2F")) {
    return false; // URL has properly encoded slashes, it's valid
  }
  
  return pathPart.includes("/"); // Only invalid if has unencoded slashes
}

/**
 * Extract storage path from an invalid Firebase URL
 * Converts: https://firebasestorage.googleapis.com/v0/b/bucket/o/path/to/file?...
 * To: path/to/file
 */
export function extractPathFromInvalidUrl(url: string): string | null {
  if (!url) return null;
  
  const match = url.match(/\/o\/([^?]+)/);
  if (!match) return null;
  
  // The path may be partially encoded, decode it first
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/**
 * Convert a value to a displayable URL
 * - If it's already a valid URL, return as-is
 * - If it's an invalid Firebase URL (unencoded path), re-resolve it
 * - If it's a storage path, call getDownloadURL
 * 
 * @param pathOrUrl - Either a storage path or a full URL
 * @returns Promise<string> - The download URL
 */
export async function resolveFileUrl(pathOrUrl: string): Promise<string> {
  if (!pathOrUrl) {
    return "";
  }
  
  // Check if it's an invalid Firebase URL that needs to be re-resolved
  if (isInvalidFirebaseUrl(pathOrUrl)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn("⚠️ Invalid Firebase URL detected, re-resolving:", pathOrUrl.substring(0, 100) + "...");
    }
    const storagePath = extractPathFromInvalidUrl(pathOrUrl);
    if (storagePath) {
      return await getFileUrl(storagePath);
    }
  }
  
  // If it's already a URL, return as-is
  if (!isStoragePath(pathOrUrl)) {
    return pathOrUrl;
  }
  
  // Otherwise, get the download URL
  return await getFileUrl(pathOrUrl);
}

/**
 * React hook to get a file URL from a storage path
 * Automatically resolves the URL when the component mounts or path changes
 * 
 * @param pathOrUrl - The storage path or existing URL
 * @returns The resolved download URL, or null while loading
 * 
 * @example
 * function AvatarImage({ path }) {
 *   const url = useFileUrl(path);
 *   if (!url) return <Skeleton />;
 *   return <img src={url} />;
 * }
 */
export function useFileUrl(pathOrUrl: string | undefined | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!pathOrUrl) {
      setUrl(null);
      return;
    }

    // Check if it needs resolution: either a storage path OR an invalid Firebase URL
    const needsResolution = isStoragePath(pathOrUrl) || isInvalidFirebaseUrl(pathOrUrl);
    
    if (!needsResolution) {
      // It's already a valid URL, use it directly
      setUrl(pathOrUrl);
      return;
    }

    // Otherwise, resolve the storage path/invalid URL
    let mounted = true;
    setError(null);
    
    resolveFileUrl(pathOrUrl)
      .then((resolvedUrl) => {
        if (mounted) {
          setUrl(resolvedUrl);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error("Failed to resolve file URL:", pathOrUrl, err);
          setError(err);
          setUrl(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, [pathOrUrl]);

  return url;
}

/**
 * React hook to get multiple file URLs at once
 * 
 * @param paths - Array of storage paths or URLs
 * @returns Array of resolved URLs (same order as input)
 */
export function useFileUrls(paths: (string | undefined | null)[]): (string | null)[] {
  const [urls, setUrls] = useState<(string | null)[]>([]);

  useEffect(() => {
    if (!paths || paths.length === 0) {
      setUrls([]);
      return;
    }

    let mounted = true;

    Promise.all(
      paths.map(async (path) => {
        if (!path) return null;
        try {
          return await resolveFileUrl(path);
        } catch {
          return null;
        }
      })
    ).then((resolvedUrls) => {
      if (mounted) {
        setUrls(resolvedUrls);
      }
    });

    return () => {
      mounted = false;
    };
  }, [JSON.stringify(paths)]); // Use JSON.stringify to detect array changes

  return urls;
}

/**
 * Extract the storage path from a Firebase download URL
 * Useful for migrating from URL storage to path storage
 * 
 * @param downloadUrl - The full Firebase download URL
 * @returns The storage path, or null if not a valid Firebase URL
 */
export function extractStoragePath(downloadUrl: string): string | null {
  if (!downloadUrl) return null;
  
  try {
    // Firebase URLs have format:
    // https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encoded-path}?alt=media&token=xxx
    const url = new URL(downloadUrl);
    
    if (!url.hostname.includes("firebasestorage.googleapis.com")) {
      return null;
    }
    
    // Extract path from /o/{encoded-path}
    const pathMatch = url.pathname.match(/\/o\/(.+)/);
    if (!pathMatch) return null;
    
    // Decode the path
    return decodeURIComponent(pathMatch[1]);
  } catch {
    return null;
  }
}
