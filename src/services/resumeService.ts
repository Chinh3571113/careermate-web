import api from "@/lib/api";

// ===== Type Definitions =====

export type ResumeType = "WEB" | "UPLOAD" | "DRAFT";

export interface Certificate {
  certificateId: number;
  name: string;
  organization: string;
  getDate: string; // YYYY-MM-DD
  certificateUrl: string;
  description: string;
}

export interface Education {
  educationId: number;
  school: string;
  major: string;
  degree: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface HighlightProject {
  highlightProjectId: number;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  description: string;
  projectUrl: string;
}

export interface WorkExperience {
  workExperienceId: number;
  jobTitle: string;
  company: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  description: string;
  project: string;
}

export interface Skill {
  skillId: number;
  skillType: string;
  skillName: string;
  yearOfExperience: number;
}

export interface ForeignLanguage {
  foreignLanguageId: number;
  language: string;
  level: string;
}

export interface Award {
  awardId: number;
  name: string;
  organization: string;
  getDate: string; // YYYY-MM-DD
  description: string;
}

export interface Resume {
  resumeId: number;
  aboutMe: string;
  resumeUrl: string;
  type: ResumeType;
  isActive: boolean;
  createdAt: string; // ISO 8601
  candidateId: number;
  parsedStatus?: "processing" | "ready" | "failed"; // Optional from API
  certificates: Certificate[];
  educations: Education[];
  highlightProjects: HighlightProject[];
  workExperiences: WorkExperience[];
  skills: Skill[];
  foreignLanguages: ForeignLanguage[];
  awards: Award[];
}

export interface ResumeResponse {
  code: number;
  message: string;
  result: Resume[];
}

// ===== Resume Service =====

class ResumeService {
  /**
   * Fetch all resumes for the current user
   */
  async fetchResumes(): Promise<Resume[]> {
    try {
      const response = await api.get<ResumeResponse>("/api/resume");
      
      // Check if response is successful and has result
      if (response.data && response.data.result) {
        return response.data.result;
      }
      
      throw new Error(response.data?.message || "Failed to fetch resumes");
    } catch (error) {
      console.error("Error fetching resumes:", error);
      throw error;
    }
  }

  /**
   * Fetch resumes grouped by type
   */
  async fetchResumesByType(): Promise<{
    web: Resume[];
    uploaded: Resume[];
    draft: Resume[];
    active: Resume | null;
  }> {
    try {
      const resumes = await this.fetchResumes();
      
      return {
        web: resumes.filter((r) => r.type === "WEB"),
        uploaded: resumes.filter((r) => r.type === "UPLOAD"),
        draft: resumes.filter((r) => r.type === "DRAFT"),
        active: resumes.find((r) => r.isActive) || null,
      };
    } catch (error) {
      console.error("Error fetching resumes by type:", error);
      throw error;
    }
  }

  /**
   * Get active resume
   */
  async getActiveResume(): Promise<Resume | null> {
    try {
      const resumes = await this.fetchResumes();
      return resumes.find((r) => r.isActive) || null;
    } catch (error) {
      console.error("Error getting active resume:", error);
      return null;
    }
  }

  /**
   * Set a resume as active
   * TODO: Implement API endpoint
   */
  async setActiveResume(resumeId: number): Promise<void> {
    try {
      // TODO: Replace with actual API call when endpoint is available
      console.log("Setting active resume:", resumeId);
      // await api.put(`/api/resume/${resumeId}/active`);
    } catch (error) {
      console.error("Error setting active resume:", error);
      throw error;
    }
  }

  /**
   * Delete a resume
   * DELETE /api/resume/{resumeId}
   */
  async deleteResume(resumeId: number): Promise<void> {
    try {
      console.log("🗑️ Deleting resume:", resumeId);
      const response = await api.delete(`/api/resume/${resumeId}`);
      
      if (response.data?.code !== 200 && response.data?.code !== 204) {
        throw new Error(response.data?.message || "Failed to delete resume");
      }
      
      console.log("✅ Resume deleted successfully:", resumeId);
    } catch (error: any) {
      console.error("❌ Error deleting resume:", error);
      
      // Enhance error message with backend response if available
      if (error?.response?.data?.message) {
        throw new Error(`Failed to delete resume: ${error.response.data.message}`);
      }
      
      throw error;
    }
  }

  /**
   * Create a new resume entry in backend
   */
  async createResume(payload: {
    aboutMe: string;
    resumeUrl?: string; // Optional for WEB type
    type?: string | null; // Optional - backend may have default
    isActive: boolean;
  }): Promise<Resume> {
    // 🛡️ Validate payload before sending to backend
    // For WEB type (CV Builder), resumeUrl is not required
    // For UPLOAD type, resumeUrl must be provided
    if (payload.type === "UPLOAD" && !payload.resumeUrl) {
      console.error("❌ CRITICAL: createResume called with empty resumeUrl for UPLOAD type!");
      console.error("Invalid payload:", payload);
      throw new Error("Cannot create resume: resumeUrl is required for UPLOAD type.");
    }

    // Validate URL format only if resumeUrl is provided
    if (payload.resumeUrl && !payload.resumeUrl.startsWith('http://') && !payload.resumeUrl.startsWith('https://')) {
      console.error("❌ Invalid resumeUrl format:", payload.resumeUrl);
      throw new Error(`Invalid resumeUrl format. Expected http/https URL, got: ${payload.resumeUrl}`);
    }

    console.log("📤 Creating resume in backend...");
    console.log("Payload:", {
      ...payload,
      resumeUrl: payload.resumeUrl ? payload.resumeUrl.substring(0, 100) + '...' : 'N/A (WEB type)', // Truncate for readability
    });

    try {
      const response = await api.post<{ code: number; message: string; result: Resume }>(
        "/api/resume",
        payload
      );

      console.log("✅ Backend response:", {
        code: response.data?.code,
        message: response.data?.message,
        hasResult: !!response.data?.result,
      });

      if (response.data && response.data.result) {
        console.log("✅ Resume created successfully:", {
          resumeId: response.data.result.resumeId,
          type: response.data.result.type,
          isActive: response.data.result.isActive,
        });
        return response.data.result;
      }

      const errorMsg = response.data?.message || "Failed to create resume";
      console.error("❌ Backend returned error:", errorMsg);
      throw new Error(errorMsg);
    } catch (error: any) {
      console.error("❌ Error creating resume:", {
        error,
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });

      // Enhance error message with backend response if available
      if (error?.response?.data?.message) {
        throw new Error(`Backend resume creation failed: ${error.response.data.message}`);
      }

      throw error;
    }
  }

  /**
   * Get resume size from URL
   */
  async getResumeSize(url: string): Promise<number> {
    try {
      const response = await fetch(url, { method: "HEAD" });
      const contentLength = response.headers.get("content-length");
      return contentLength ? parseInt(contentLength, 10) : 0;
    } catch (error) {
      console.error("Error getting resume size:", error);
      return 0;
    }
  }

  /**
   * Format file size from bytes
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }
}

export const resumeService = new ResumeService();

// Export createResume as a standalone function for convenience
export const createResume = (payload: {
  aboutMe: string;
  resumeUrl?: string; // Optional for WEB type
  type?: string | null; // Optional - backend may have default
  isActive: boolean;
}) => resumeService.createResume(payload);
