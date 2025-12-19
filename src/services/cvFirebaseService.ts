import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/lib/firebase";

// ===== Type Definitions =====
export type CVType = "CREATED" | "UPLOADED";
export type CVSource = "upload" | "builder" | "draft";
export type CVVisibility = "public" | "private";
export type CVParsedStatus = "processing" | "ready" | "failed";
export type CVStatus = "DRAFT" | "READY";

// ===== CV Interface =====
export interface CV {
  // Core fields (always present)
  id: string;
  name: string;
  type: CVType;
  source?: CVSource; // Optional for compatibility with legacy components
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  size?: number; // bytes (optional)
  fileSize?: string; // formatted size (e.g., "1.2 MB") (optional)
  isDefault: boolean;
  visibility?: CVVisibility; // Optional
  privacy?: CVVisibility; // alias for visibility (optional, for compatibility)
  downloadUrl: string;
  fileUrl?: string; // alias for downloadUrl (optional, for compatibility)
  userId?: string; // Optional
  candidateId?: string; // Optional
  storagePath: string; // path in Firebase Storage
  parsedStatus?: CVParsedStatus; // Optional for UI display
  status: CVStatus; // DRAFT or READY
}

// ===== Constants =====
const CV_ROOT = 'careermate-files/candidates';
const CV_SEPARATOR = '_CM_';

// ===== Helper Functions =====

/**
 * Sanitize file name: remove unsafe characters, replace spaces with underscores
 * 
 * @param fileName - Original file name
 * @returns Sanitized file name
 * 
 * @example
 * sanitizeFileName("My CV (final)!.pdf") // → "My_CV_final.pdf"
 * sanitizeFileName("Résumé 2024.pdf") // → "Resume_2024.pdf"
 */
function sanitizeFileName(fileName: string): string {
  if (!fileName) {
    return 'file';
  }

  // Get extension first
  const lastDotIndex = fileName.lastIndexOf('.');
  let nameWithoutExt: string;
  let extension: string;

  if (lastDotIndex > 0) {
    nameWithoutExt = fileName.substring(0, lastDotIndex);
    extension = fileName.substring(lastDotIndex + 1);
  } else {
    nameWithoutExt = fileName;
    extension = 'pdf';
  }

  // Remove special characters, replace spaces with underscores
  const sanitized = nameWithoutExt
    .normalize('NFD') // Normalize unicode characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special chars except space, hyphen, underscore
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .trim();

  return sanitized ? `${sanitized}.${extension}` : `file.${extension}`;
}

/**
 * Generate storage file name with timestamp
 * Format: [originalName]_CM_[timestamp].[ext]
 * 
 * @param originalFileName - Original file name from user
 * @returns Storage file name with timestamp
 * 
 * @example
 * generateStorageName("CV.pdf") // → "CV_CM_1732702341123.pdf"
 * generateStorageName("My Resume.pdf") // → "My_Resume_CM_1732702341123.pdf"
 */
function generateStorageName(originalFileName: string): string {
  if (!originalFileName) {
    return `file${CV_SEPARATOR}${Date.now()}.pdf`;
  }

  try {
    // Sanitize first
    const sanitized = sanitizeFileName(originalFileName);

    // Extract base name and extension
    const lastDotIndex = sanitized.lastIndexOf('.');
    
    let baseName: string;
    let extension: string;

    if (lastDotIndex > 0) {
      baseName = sanitized.substring(0, lastDotIndex);
      extension = sanitized.substring(lastDotIndex + 1);
    } else {
      baseName = sanitized;
      extension = 'pdf';
    }

    // Generate timestamp
    const timestamp = Date.now();

    // Build storage name: [baseName]_CM_[timestamp].[ext]
    return `${baseName}${CV_SEPARATOR}${timestamp}.${extension}`;
  } catch (error) {
    console.error('Error generating storage name:', error);
    return `file${CV_SEPARATOR}${Date.now()}.pdf`;
  }
}

/**
 * Extract original file name from storage name
 * Removes the _CM_[timestamp] suffix
 * 
 * @param storageName - The storage file name (e.g., "CV_CM_1732702341123.pdf")
 * @returns Original file name (e.g., "CV.pdf")
 * 
 * @example
 * extractOriginalName("CV_CM_1732702341123.pdf") // → "CV.pdf"
 * extractOriginalName("My_Resume_CM_1732702341123.pdf") // → "My_Resume.pdf"
 * extractOriginalName("CV.pdf") // → "CV.pdf" (no separator, return as-is)
 */
export function extractOriginalName(storageName: string): string {
  if (!storageName) {
    return 'Unknown.pdf';
  }

  // If no separator found, return as-is
  if (!storageName.includes(CV_SEPARATOR)) {
    return storageName;
  }

  try {
    // Split at _CM_ separator
    const parts = storageName.split(CV_SEPARATOR);
    
    if (parts.length < 2) {
      return storageName;
    }

    // Get base name (before _CM_)
    const baseName = parts[0];
    
    // Get the extension from the storage name (after timestamp)
    const lastPart = parts[parts.length - 1]; // "1732702341123.pdf"
    const extMatch = lastPart.match(/\.([^.]+)$/);
    const extension = extMatch ? extMatch[1] : 'pdf';

    // Reconstruct: baseName + extension
    return `${baseName}.${extension}`;
  } catch (error) {
    console.error('Error extracting original name:', error);
    return storageName;
  }
}

/**
 * Format file size from bytes to human-readable
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Generate CV storage path
 * Path: careermate-files/candidates/{candidateId}/{filename}
 */
function getCvStoragePath(candidateId: string, filename: string): string {
  return `${CV_ROOT}/${candidateId}/cv/${filename}`;
}

// ===== Firebase Storage Functions =====

/**
 * Upload CV file to Firebase Storage with metadata
 * Path: candidates/{candidateId}/{storageName}
 * 
 * @param candidateId - The candidate's ID
 * @param file - The CV file to upload
 * @returns Metadata object with originalName and storageName
 * 
 * @example
 * const result = await uploadCvFile("123", file);
 * // result.originalName → "CV.pdf"
 * // result.storageName → "CV_CM_1732702341123.pdf"
 * // result.downloadUrl → "https://firebasestorage..."
 * // result.fullPath → "candidates/123/CV_CM_1732702341123.pdf"
 */
export async function uploadCvFile(candidateId: string, file: File) {
  console.log("📤 Uploading CV start:", {
    fileName: file.name,
    fileSize: formatFileSize(file.size),
    fileType: file.type,
    candidateId,
  });

  // Validate Firebase Storage configuration
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucket) {
    console.error("❌ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not defined in environment variables");
    throw new Error("Firebase Storage bucket is not configured. Please check your .env file.");
  }

  // Validate bucket format
  if (!bucket.includes('.firebasestorage.app') && !bucket.includes('.appspot.com')) {
    console.warn("⚠️ Firebase Storage bucket format might be invalid:", bucket);
    console.warn("Expected format: 'project-id.firebasestorage.app' or 'project-id.appspot.com'");
  }

  try {
    // Store original name
    const originalName = file.name;
    
    // Generate storage name: [originalName]_CM_[timestamp].[ext]
    const storageName = generateStorageName(originalName);
    
    console.log("📝 File names:", {
      original: originalName,
      storage: storageName,
    });
    
    // Build storage path
    const fullPath = getCvStoragePath(candidateId, storageName);
    
    console.log("📁 Storage path:", fullPath);
    
    // Upload to Firebase Storage
    const storageRef = ref(storage, fullPath);
    
    console.log("⬆️ Uploading bytes to Firebase Storage...");
    const uploadResult = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        candidateId,
        originalName: originalName,
        storageName: storageName,
        uploadedAt: new Date().toISOString(),
      },
    });
    
    console.log("✅ Upload bytes successful:", {
      path: uploadResult.ref.fullPath,
      size: uploadResult.metadata.size,
    });
    
    // Get download URL with retry logic (Firebase propagation can be slow)
    let downloadUrl: string | undefined;
    let retries = 3;
    let lastError: Error | undefined;

    console.log("🔗 Fetching download URL...");
    
    while (retries > 0 && !downloadUrl) {
      try {
        downloadUrl = await getDownloadURL(storageRef);
        console.log("✅ Download URL obtained:", downloadUrl);
      } catch (error: any) {
        lastError = error;
        retries--;
        
        // Log detailed Firebase error
        console.error(`⚠️ getDownloadURL attempt failed (${3 - retries}/3):`, {
          code: error?.code,
          message: error?.message,
          serverResponse: error?.serverResponse,
          customData: error?.customData,
        });

        // Check for common Firebase Storage errors
        if (error?.code === 'storage/object-not-found') {
          console.error("❌ Firebase Storage Error: Object not found. File might not have propagated yet.");
        } else if (error?.code === 'storage/unauthorized') {
          console.error("❌ Firebase Storage Error: Permission denied. Check Firebase Storage Rules:");
          console.error("   Rules should allow: allow read, write: if request.auth != null;");
        } else if (error?.code === 'storage/bucket-not-found') {
          console.error("❌ Firebase Storage Error: Bucket not found. Check NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:", bucket);
        }

        if (retries > 0) {
          console.log(`⏳ Retrying in 1 second... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // Final validation: Ensure downloadUrl is not undefined
    if (!downloadUrl) {
      console.error("❌ CRITICAL: Download URL is undefined after all retries");
      console.error("Last error:", lastError);
      throw new Error(
        `Failed to get download URL after 3 attempts. ${
          lastError?.message || 'Unknown error'
        }. Check Firebase Storage Rules and bucket configuration.`
      );
    }

    // Construct metadata object
    const metadata = {
      id: storageName,
      name: originalName,
      originalName: originalName,
      storageName: storageName,
      candidateId,
      storagePath: fullPath,
      fullPath: fullPath,
      downloadUrl, // GUARANTEED to be defined here
      type: 'UPLOADED' as const,
      source: 'upload' as const,
      status: 'READY' as const,
      isDefault: false,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      size: file.size,
      fileSize: formatFileSize(file.size),
    };

    console.log("✅ Firebase upload complete:", {
      originalName: metadata.originalName,
      storageName: metadata.storageName,
      downloadUrl: metadata.downloadUrl,
      fullPath: metadata.fullPath,
    });

    return metadata;
  } catch (error: any) {
    console.error("❌ Error uploading CV file:", {
      error,
      code: error?.code,
      message: error?.message,
      fileName: file.name,
      candidateId,
    });

    // Re-throw with more context
    throw new Error(
      `Failed to upload CV file: ${error?.message || 'Unknown error'}. ${
        error?.code ? `Error code: ${error.code}` : ''
      }`
    );
  }
}

/**
 * Upload avatar to Firebase Storage (public)
 * Path: /careermate-files/candidates/{userId}/avatar/{fileName}
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const fileRef = ref(storage, `careermate-files/candidates/${userId}/avatar/${fileName}`);
    
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw new Error("Failed to upload avatar");
  }
}

/**
 * Upload CV PDF from Blob to Firebase Storage (private)
 * Used after generating PDF with Puppeteer
 * Path: /careermate-files/candidates/{candidateId}/cv/{fileName}
 */
export async function uploadCVPDF(
  candidateId: string, 
  pdfBlob: Blob, 
  customFileName?: string
): Promise<string> {
  try {
    // customFileName already includes format: [JobTitle] CV_CM_[timestamp]
    // Just add .pdf extension if not present
    const fileName = customFileName 
      ? (customFileName.endsWith('.pdf') ? customFileName : `${customFileName}.pdf`)
      : `CV_CM_${Date.now()}.pdf`;
    
    const path = getCvStoragePath(candidateId, fileName);
    const fileRef = ref(storage, path);
    
    // Upload blob with metadata
    await uploadBytes(fileRef, pdfBlob, {
      contentType: "application/pdf",
      customMetadata: {
        candidateId,
        uploadedAt: new Date().toISOString(),
        type: "generated-cv",
      },
    });
    
    const downloadURL = await getDownloadURL(fileRef);
    
    console.log("✅ CV PDF uploaded successfully:", downloadURL);
    return downloadURL;
  } catch (error) {
    console.error("❌ Error uploading CV PDF:", error);
    throw new Error("Failed to upload CV PDF to Firebase");
  }
}

/**
 * Delete file from Firebase Storage by storage path
 * @param storagePath - The full storage path (e.g., "careermate-files/candidates/123/cv/file.pdf")
 */
export async function deleteFile(storagePath: string): Promise<void> {
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
    console.log("✅ File deleted successfully:", storagePath);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw new Error("Failed to delete file from Firebase Storage");
  }
}

/**
 * Delete file from Firebase Storage by download URL
 * Extracts the storage path from the URL and deletes the file
 * @param downloadUrl - The Firebase download URL
 */
export async function deleteFileByUrl(downloadUrl: string): Promise<void> {
  try {
    const fileRef = ref(storage, downloadUrl);
    await deleteObject(fileRef);
    console.log("✅ File deleted successfully from URL");
  } catch (error) {
    console.error("Error deleting file by URL:", error);
    throw new Error("Failed to delete file from Firebase Storage");
  }
}

/**
 * Get download URL from Firebase Storage path
 * @param storagePath - The storage path
 * @returns Download URL
 */
export async function getDownloadUrl(storagePath: string): Promise<string> {
  try {
    const storageRef = ref(storage, storagePath);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error("Error getting download URL:", error);
    throw new Error("Failed to get download URL");
  }
}

