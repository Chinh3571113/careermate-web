import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase";

// Constants for storage paths
const CV_ROOT = 'careermate-files/candidates';

/**
 * Result type for upload functions that return both path and URL
 */
export interface UploadResult {
  /** The storage path (recommended to store in database) */
  storagePath: string;
  /** The download URL (for immediate display, may expire) */
  downloadUrl: string;
}

/**
 * Generate avatar storage path
 */
function getAvatarStoragePath(candidateId: string, filename: string): string {
  return `${CV_ROOT}/${candidateId}/avatar/${filename}`;
}

/**
 * Generate CV storage path
 */
function getCvStoragePath(candidateId: string, filename: string): string {
  return `${CV_ROOT}/${candidateId}/cv/${filename}`;
}

/**
 * Upload avatar to Firebase Storage (public)
 * Path: /careermate-files/candidates/{candidateId}/avatar/{fileName}
 * 
 * @param candidateId - The candidate's numeric ID (NOT email)
 * @param file - The image file to upload
 * @returns UploadResult with both storagePath and downloadUrl
 */
export async function uploadAvatar(candidateId: string, file: File): Promise<UploadResult> {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const storagePath = getAvatarStoragePath(candidateId, fileName);
    const fileRef = ref(storage, storagePath);
    
    await uploadBytes(fileRef, file);
    const downloadUrl = await getDownloadURL(fileRef);
    
    console.log("✅ Avatar uploaded:", { storagePath, downloadUrl });
    
    return {
      storagePath,
      downloadUrl,
    };
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw new Error("Failed to upload avatar");
  }
}

/**
 * Upload avatar and return only URL (for backward compatibility)
 * @deprecated Use uploadAvatar() which returns both path and URL
 */
export async function uploadAvatarUrl(candidateId: string, file: File): Promise<string> {
  const result = await uploadAvatar(candidateId, file);
  return result.downloadUrl;
}

/**
 * Upload CV to Firebase Storage (private)
 * Path: /careermate-files/candidates/{userId}/cv/{fileName}
 */
export async function uploadCV(userId: string, file: File): Promise<string> {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const fileRef = ref(storage, `careermate-files/candidates/${userId}/cv/${fileName}`);
    
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading CV:", error);
    throw new Error("Failed to upload CV");
  }
}

/**
 * Upload CV PDF from Blob to Firebase Storage (private)
 * Used after generating PDF with Puppeteer
 * Path: /careermate-files/candidates/{userId}/cv/{fileName}
 */
export async function uploadCVPDF(
  userId: string, 
  pdfBlob: Blob, 
  customFileName?: string
): Promise<string> {
  try {
    // customFileName already includes format: [JobTitle] CV_CM_[timestamp]
    // Just add .pdf extension if not present
    const fileName = customFileName 
      ? (customFileName.endsWith('.pdf') ? customFileName : `${customFileName}.pdf`)
      : `CV_CM_${Date.now()}.pdf`;
    
    const fileRef = ref(storage, `careermate-files/candidates/${userId}/cv/${fileName}`);
    
    // Upload blob với metadata
    await uploadBytes(fileRef, pdfBlob, {
      contentType: "application/pdf",
      customMetadata: {
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
 * Delete file from Firebase Storage
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw new Error("Failed to delete file");
  }
}

/**
 * Upload CV file to Firebase Storage with metadata
 * Path: careermate-files/candidates/{candidateId}/cv/{generatedFilename}
 * @param candidateId - The candidate's ID
 * @param file - The CV file to upload
 * @returns Metadata object (does NOT include File/Blob)
 */
export async function uploadCvFile(candidateId: string, file: File) {
  try {
    // Extract file extension
    const ext = file.name.split('.').pop() || 'pdf';
    
    // Generate unique filename using crypto.randomUUID()
    const filename = crypto.randomUUID() + '.' + ext;
    
    // Build storage path using helper function
    const path = getCvStoragePath(candidateId, filename);
    
    // Upload to Firebase Storage
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);
    
    // Return ONLY metadata (no File/Blob)
    return {
      id: filename,
      candidateId,
      storagePath: path,
      downloadUrl,
      type: 'UPLOADED' as const,
      status: 'READY' as const,
      isDefault: false,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error uploading CV file:", error);
    throw new Error("Failed to upload CV file");
  }
}

/**
 * Upload CV for job application to Firebase Storage
 * Path: careermate-files/job-applications/{jobId}/{originalName}_CM_{timestamp}.{ext}
 * 
 * @param jobId - The job posting ID
 * @param file - The CV file to upload
 * @returns UploadResult with storagePath and downloadUrl
 */
export async function uploadJobApplicationCV(jobId: string | number, file: File): Promise<UploadResult> {
  try {
    // Extract file info
    const originalName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
    const ext = file.name.split('.').pop() || 'pdf';
    const timestamp = Date.now();
    
    // Generate filename: {originalName}_CM_{timestamp}.{ext}
    const filename = `${originalName}_CM_${timestamp}.${ext}`;
    
    // Build storage path
    const storagePath = `careermate-files/job-applications/${jobId}/${filename}`;
    
    // Upload to Firebase Storage
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file, {
      contentType: file.type || 'application/pdf',
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
        jobId: String(jobId),
        type: 'job-application-cv',
      },
    });
    
    const downloadUrl = await getDownloadURL(storageRef);
    
    console.log("✅ Job Application CV uploaded:", { storagePath, downloadUrl });
    
    return {
      storagePath,
      downloadUrl,
    };
  } catch (error) {
    console.error("❌ Error uploading job application CV:", error);
    throw new Error("Failed to upload CV for job application");
  }
}
