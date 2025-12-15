import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CV } from "@/services/cvService";
import { useCVStore } from "@/stores/cvStore";
import { syncCVWithUpdates } from "@/utils/syncCV";
import { 
  setResumeStatus, 
  updateResumeType,
  updateResume,
  addEducation,
  addWorkExperience,
  addCertificate,
  addHighlightProject,
  addSkill,
  addForeignLanguage,
  addAward,
  createResume,
} from "@/lib/resume-api";
import { ParsedCV } from "@/types/parsedCV";
import { normalizeParsedCVData, NormalizedCVData } from "@/lib/cv-parse-normalizer";
import { resumeService } from "@/services/resumeService";

interface UseCVActionsReturn {
  showPreview: boolean;
  previewUrl: string | null;
  selectedCV: CV | null;
  // Sync dialog states
  showSyncSummaryDialog: boolean;
  showSyncConfirmDialog: boolean;
  parsedCVData: ParsedCV | null;
  syncingCV: CV | null;
  isSyncing: boolean;
  // Switch CV confirmation dialog (for WEB/DRAFT CVs)
  showSwitchCVConfirm: boolean;
  // Draft conversion confirmation dialog (for untyped CVs)
  showDraftConversionConfirm: boolean;
  pendingAction: { type: 'sync' | 'edit'; cv: CV } | null;
  // Delete confirmation dialog
  showDeleteConfirm: boolean;
  cvToDelete: CV | null;
  // Actions
  handleSetDefault: (cv: CV) => Promise<void>;
  handleSyncToProfile: (cv: CV) => Promise<void>;
  handleEditCV: (cv: CV) => void;
  handlePreview: (cv: CV) => void;
  handleClosePreview: () => void;
  handleDelete: (cvId: string) => Promise<void>;
  // Sync dialog handlers
  handleCloseSyncSummaryDialog: () => void;
  handleCloseSyncConfirmDialog: () => void;
  handleConfirmSync: (editedData: ParsedCV) => Promise<void>;
  handleConfirmDraftConversion: () => Promise<void>;
  // Switch CV confirmation handlers
  handleCloseSwitchCVConfirm: () => void;
  handleConfirmSwitchCV: () => void;
  // Draft conversion confirmation handlers
  handleCloseDraftConversionConfirm: () => void;
  handleConfirmConvertToDraft: () => Promise<void>;
  handleSkipConvertToDraft: () => void;
  // Delete confirmation handlers
  handleCloseDeleteConfirm: () => void;
  handleConfirmDelete: () => Promise<void>;
}

export const useCVActions = (
  uploadedCVs: CV[],
  setUploadedCVs: React.Dispatch<React.SetStateAction<CV[]>>,
  builtCVs: CV[],
  setBuiltCVs: React.Dispatch<React.SetStateAction<CV[]>>,
  draftCVs: CV[],
  setDraftCVs: React.Dispatch<React.SetStateAction<CV[]>>,
  defaultCV: CV | null,
  setDefaultCV: React.Dispatch<React.SetStateAction<CV | null>>,
  refresh?: () => Promise<void> // Optional refresh callback to reload data from API
): UseCVActionsReturn => {
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedCV, setSelectedCV] = useState<CV | null>(null);
  
  // Sync dialog states
  const [showSyncSummaryDialog, setShowSyncSummaryDialog] = useState(false);
  const [showSyncConfirmDialog, setShowSyncConfirmDialog] = useState(false);
  const [parsedCVData, setParsedCVData] = useState<ParsedCV | null>(null);
  const [syncingCV, setSyncingCV] = useState<CV | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Draft conversion dialog states
  const [showDraftConversionConfirm, setShowDraftConversionConfirm] = useState(false);
  const [showSwitchCVConfirm, setShowSwitchCVConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'sync' | 'edit'; cv: CV } | null>(null);

  // Delete confirmation dialog states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cvToDelete, setCvToDelete] = useState<CV | null>(null);

  // Extract Zustand store actions
  const setDefaultCvInStore = useCVStore((state) => state.setDefaultCv);
  const untypedResumeId = useCVStore((state) => state.untypedResumeId);
  const currentEditingResumeId = useCVStore((state) => state.currentEditingResumeId);
  const setUntypedResumeId = useCVStore((state) => state.setUntypedResumeId);
  const clearUntypedResumeId = useCVStore((state) => state.clearUntypedResumeId);
  
  /**
   * TEMPORARY: Set the current editing resume ID in Zustand store.
   * This allows cm-profile to know which resume the user was working on
   * when they navigate from cv-management.
   * 
   * NOTE: This is a temporary client-side solution. Will be replaced by
   * backend-driven currentResumeId in the future.
   */
  const setCurrentEditingResume = useCVStore((state) => state.setCurrentEditingResume);

  /**
   * Check if user is currently editing a CV and wants to switch to another
   * Returns true if action should be blocked (dialog shown), false if can proceed
   * 
   * Case 1: CV đang edit có type="" (untyped) → Show DRAFT conversion dialog
   * Case 2: CV đang edit có type="WEB"/"DRAFT" → Show simple switch confirmation
   */
  const checkBeforeSwitchCV = useCallback((actionType: 'sync' | 'edit', targetCV: CV): boolean => {
    // If switching to the same CV, no need to confirm
    if (currentEditingResumeId === targetCV.id) {
      console.log("📋 Same CV, no confirmation needed");
      return false;
    }

    // Case 1: Check for untyped resume (type="")
    if (untypedResumeId && untypedResumeId !== targetCV.id) {
      console.log("⚠️ Found untyped resume (type=''), showing DRAFT conversion dialog");
      setPendingAction({ type: actionType, cv: targetCV });
      setShowDraftConversionConfirm(true);
      return true; // Action blocked
    }

    // Case 2: Check for currently editing WEB/DRAFT resume
    if (currentEditingResumeId && currentEditingResumeId !== targetCV.id) {
      console.log("⚠️ Currently editing another CV, showing switch confirmation");
      setPendingAction({ type: actionType, cv: targetCV });
      setShowSwitchCVConfirm(true);
      return true; // Action blocked
    }

    return false; // No blocking, proceed with action
  }, [untypedResumeId, currentEditingResumeId]);

  const handleSetDefault = useCallback(async (cv: CV) => {
    console.log('⭐ handleSetDefault called for CV:', cv.id, cv.name);
    
    // Get resumeId from CV (id should be the resumeId)
    const resumeId = parseInt(cv.id, 10);
    
    if (isNaN(resumeId)) {
      console.error('❌ Invalid resume ID:', cv.id);
      toast.error('Invalid CV ID');
      return;
    }

    try {
      toast.loading('Setting as default CV...', { id: 'set-default' });

      // Call API to set resume as active
      const response = await setResumeStatus(resumeId, true);
      console.log('✅ API response:', response);

      // Update all local state CVs
      setUploadedCVs(prev => prev.map(c => ({ ...c, isDefault: c.id === cv.id })));
      setBuiltCVs(prev => prev.map(c => ({ ...c, isDefault: c.id === cv.id })));
      setDraftCVs(prev => prev.map(c => ({ ...c, isDefault: c.id === cv.id })));
      setDefaultCV(cv);

      // Sync to Zustand store
      setDefaultCvInStore(cv.id);
      console.log('⭐ Set default synced to Zustand:', cv.id);

      toast.success(`"${cv.name}" set as default CV`, { id: 'set-default' });
    } catch (error: any) {
      console.error('❌ Failed to set default CV:', error);
      toast.error(
        error.response?.data?.message || 'Failed to set default CV',
        { id: 'set-default' }
      );
    }
  }, [setUploadedCVs, setBuiltCVs, setDraftCVs, setDefaultCV, setDefaultCvInStore]);

  const handleSyncToProfile = useCallback(async (cv: CV) => {
    console.log("🔄 handleSyncToProfile called for CV:", cv.name);
    console.log("📋 CV source:", cv.source);
    console.log("📋 CV type:", cv.type);
    console.log("📋 CV download URL:", cv.downloadUrl);

    // Check if we need to show confirmation dialog before switching
    if (checkBeforeSwitchCV('sync', cv)) {
      return; // Action blocked, dialog will be shown
    }

    // Store the CV being synced
    setSyncingCV(cv);
    
    /**
     * TEMPORARY: Set this resume as the current editing resume.
     * This allows cm-profile to display this resume when user navigates there.
     */
    setCurrentEditingResume(cv.id);
    console.log("📝 Set currentEditingResumeId:", cv.id);

    // For Created CVs (source = "builder") - Show confirmation dialog to convert to draft
    if (cv.source === "builder") {
      console.log("📋 Builder CV detected - showing confirmation dialog");
      setShowSyncConfirmDialog(true);
      return;
    }

    // For Draft CVs (source = "draft") - no action needed, already a draft
    if (cv.source === "draft") {
      toast("This CV is already a draft", { icon: "ℹ️" });
      setSyncingCV(null);
      return;
    }

    // For Uploaded CVs (source = "upload") - parse and show summary dialog
    if (!cv.downloadUrl) {
      console.error("❌ Missing CV download URL");
      toast.error("Cannot sync: No download URL available");
      setSyncingCV(null);
      return;
    }

    try {
      setIsSyncing(true);
      toast.loading("Parsing CV with AI...", { id: "sync-cv" });
      console.log("📤 Starting Python API sync...");

      // Call the syncCV utility which handles:
      // 1. POST to /api/v1/cv/analyze_cv/ (upload CV)
      // 2. GET polling to /api/v1/cv/task-status/{task_id}/ (get results)
      const parsedData = await syncCVWithUpdates(
        cv.downloadUrl,
        cv.name,
        (update) => {
          console.log("📥 Python sync update:", update);
          
          if (update.taskId) {
            toast.loading(`Processing (Task: ${update.taskId.slice(0, 8)}...)`, { id: "sync-cv" });
          }
          
          if (update.status === "processing") {
            toast.loading("AI is parsing your CV...", { id: "sync-cv" });
          }
        }
      );

      console.log("✅ Python parsing completed:", parsedData);
      toast.dismiss("sync-cv");
      
      // Store parsed data and show summary dialog for review/edit
      setParsedCVData(parsedData);
      setShowSyncSummaryDialog(true);
      setIsSyncing(false);

    } catch (err: any) {
      console.error("❌ Python sync error:", err);
      setIsSyncing(false);
      toast.error(err.message || "Failed to parse CV", { id: "sync-cv" });
    }
  }, [checkBeforeSwitchCV, setCurrentEditingResume]);

  // Close sync summary dialog
  const handleCloseSyncSummaryDialog = useCallback(() => {
    setShowSyncSummaryDialog(false);
    setParsedCVData(null);
    setSyncingCV(null);
  }, []);

  // Close sync confirm dialog
  const handleCloseSyncConfirmDialog = useCallback(() => {
    setShowSyncConfirmDialog(false);
    setSyncingCV(null);
  }, []);

  // Confirm sync after reviewing/editing parsed data
  // Creates a NEW resume with the parsed data instead of updating existing
  const handleConfirmSync = useCallback(async (editedData: ParsedCV) => {
    console.log("✅ User confirmed sync with edited data:", editedData);
    
    if (!syncingCV) {
      toast.error("No CV selected for sync");
      return;
    }

    try {
      setIsSyncing(true);
      toast.loading("Creating new resume from CV...", { id: "save-profile" });

      // Normalize ParsedCV data to Java backend format
      const normalizedData: NormalizedCVData = normalizeParsedCVData(editedData);
      console.log("📤 Normalized data for backend:", normalizedData);

      // ========================================
      // STEP 1: Create new resume with aboutMe (no type - will be converted to DRAFT later)
      // ========================================
      let newResumeId: number;
      
      try {
        console.log("📝 Creating new resume with About Me:", normalizedData.summary);
        
        // Create resume WITHOUT type - user will be prompted to convert to DRAFT later
        const createResponse = await createResume({
          aboutMe: normalizedData.summary || "",
          isActive: false, // Don't set as active by default
        });
        
        newResumeId = createResponse.resumeId;
        console.log("✅ New resume created with ID:", newResumeId);
        
        if (!newResumeId) {
          throw new Error("Failed to get resumeId from create response");
        }
        
        // Store the untyped resume ID - will prompt user to convert to DRAFT when switching CVs
        setUntypedResumeId(String(newResumeId));
        console.log("📝 Stored untyped resume ID:", newResumeId);
        
      } catch (err) {
        console.error("❌ Failed to create new resume:", err);
        toast.error("Failed to create new resume", { id: "save-profile" });
        setIsSyncing(false);
        return;
      }

      // Track success/failure counts
      const results = {
        resume: { success: 1, failed: 0 }, // Resume already created
        education: { success: 0, failed: 0 },
        experience: { success: 0, failed: 0 },
        projects: { success: 0, failed: 0 },
        skills: { success: 0, failed: 0 },
        certificates: { success: 0, failed: 0 },
        languages: { success: 0, failed: 0 },
        awards: { success: 0, failed: 0 },
      };

      // Use the new resumeId for all subsequent operations
      const resumeId = newResumeId;

      // ========================================
      // STEP 2: Add Education items to new resume
      // ========================================
      for (const edu of normalizedData.educations) {
        try {
          await addEducation({
            resumeId,
            school: edu.school,
            major: edu.major,
            degree: edu.degree,
            startDate: edu.startDate,
            endDate: edu.endDate,
          });
          results.education.success++;
        } catch (err) {
          console.error("Failed to save education:", edu, err);
          results.education.failed++;
        }
      }

      // ========================================
      // STEP 3: Add Work Experience items to new resume
      // ========================================
      for (const exp of normalizedData.workExperiences) {
        try {
          await addWorkExperience({
            resumeId,
            jobTitle: exp.jobTitle,
            company: exp.company,
            startDate: exp.startDate,
            endDate: exp.endDate,
            description: exp.description,
            project: exp.project,
          });
          results.experience.success++;
        } catch (err) {
          console.error("Failed to save work experience:", exp, err);
          results.experience.failed++;
        }
      }

      // Save Highlight Projects
      for (const proj of normalizedData.highlightProjects) {
        try {
          // Ensure all required fields have values, optional fields use empty string
          await addHighlightProject({
            resumeId,
            name: proj.name || "Untitled Project",
            startDate: proj.startDate,
            endDate: proj.endDate || proj.startDate, // Backend requires endDate
            description: proj.description || "", // Optional - send empty string if not provided
            projectUrl: proj.projectUrl || "", // Optional - send empty string if not provided
          });
          results.projects.success++;
        } catch (err) {
          console.error("Failed to save project:", proj, err);
          results.projects.failed++;
        }
      }

      // Save Skills - fetch existing skills first to avoid duplicates
      let existingSkills: Array<{ skillName: string; skillType: string }> = [];
      try {
        const allResumes = await resumeService.fetchResumes();
        const currentResume = allResumes.find(r => r.resumeId === resumeId);
        if (currentResume?.skills) {
          existingSkills = currentResume.skills.map(s => ({
            skillName: s.skillName.toLowerCase().trim(),
            skillType: s.skillType.toLowerCase(),
          }));
          console.log("📋 Existing skills:", existingSkills);
        }
      } catch (err) {
        console.warn("Could not fetch existing skills, will add all:", err);
      }

      for (const skill of normalizedData.skills) {
        try {
          // Validate required fields before sending
          if (!skill.skillName || !skill.skillType) {
            console.warn("Skipping skill with missing required fields:", skill);
            results.skills.failed++;
            continue;
          }
          
          // Check if skill already exists (same name AND same type)
          const isDuplicate = existingSkills.some(
            existing => 
              existing.skillName === skill.skillName.toLowerCase().trim() &&
              existing.skillType === skill.skillType.toLowerCase()
          );
          
          if (isDuplicate) {
            console.log(`⏭️ Skipping duplicate skill: ${skill.skillName} (${skill.skillType})`);
            continue; // Skip duplicate, don't count as failed
          }
          
          await addSkill({
            resumeId,
            skillType: skill.skillType, // "core" or "soft" - required
            skillName: skill.skillName, // required
            yearOfExperience: skill.skillType === "core" ? (skill.yearOfExperience || 1) : undefined,
          });
          results.skills.success++;
        } catch (err) {
          console.error("Failed to save skill:", skill, err);
          results.skills.failed++;
        }
      }

      // Save Certificates
      for (const cert of normalizedData.certificates) {
        try {
          await addCertificate({
            resumeId,
            name: cert.name || "Untitled Certificate",
            organization: cert.organization || "Unknown Organization",
            getDate: cert.getDate,
            certificateUrl: cert.certificateUrl || "",
            description: cert.description || "",
          });
          results.certificates.success++;
        } catch (err) {
          console.error("Failed to save certificate:", cert, err);
          results.certificates.failed++;
        }
      }

      // Save Foreign Languages
      for (const lang of normalizedData.foreignLanguages) {
        try {
          // Validate required fields before sending
          if (!lang.language || !lang.level) {
            console.warn("Skipping language with missing required fields:", lang);
            results.languages.failed++;
            continue;
          }
          
          await addForeignLanguage({
            resumeId,
            language: lang.language,
            level: lang.level,
          });
          results.languages.success++;
        } catch (err) {
          console.error("Failed to save language:", lang, err);
          results.languages.failed++;
        }
      }

      // Save Awards
      for (const award of normalizedData.awards) {
        try {
          await addAward({
            resumeId,
            name: award.name || "Untitled Award",
            organization: award.organization || "Unknown Organization",
            getDate: award.getDate,
            description: award.description || "",
          });
          results.awards.success++;
        } catch (err) {
          console.error("Failed to save award:", award, err);
          results.awards.failed++;
        }
      }

      // Log results
      console.log("📊 Sync results (new resume ID:", resumeId, "):", results);

      // Calculate total success and failures
      const totalSuccess = Object.values(results).reduce((sum, r) => sum + r.success, 0);
      const totalFailed = Object.values(results).reduce((sum, r) => sum + r.failed, 0);

      if (totalFailed === 0) {
        toast.success(`New resume created successfully! (${totalSuccess} items synced)`, { id: "save-profile" });
      } else if (totalSuccess > 0) {
        toast.success(`New resume created: ${totalSuccess} items synced, ${totalFailed} failed`, { id: "save-profile" });
      } else {
        toast.error("Failed to sync any data to new resume", { id: "save-profile" });
      }

      // 🚀 Refresh data from API to get latest state
      if (refresh) {
        console.log("🔄 Refreshing data from API after sync...");
        await refresh();
        console.log("✅ Data refreshed from API successfully");
      }

      // Set the newly created resume as the current editing resume
      // This ensures cm-profile will display this resume (highest priority)
      setCurrentEditingResume(String(resumeId));
      console.log("📝 Set currentEditingResumeId to newly created resume:", resumeId);

      setShowSyncSummaryDialog(false);
      setParsedCVData(null);
      setSyncingCV(null);
      setIsSyncing(false);

      // Navigate to cm-profile with the new resumeId
      console.log("🚀 Navigating to cm-profile with resumeId:", resumeId);
      router.push(`/candidate/cm-profile?resumeId=${resumeId}`);

    } catch (err: any) {
      console.error("❌ Save profile error:", err);
      setIsSyncing(false);
      toast.error(err.message || "Failed to save profile", { id: "save-profile" });
    }
  }, [syncingCV, refresh, setCurrentEditingResume, setUntypedResumeId, router]);

  // Confirm draft conversion (WEB → DRAFT)
  const handleConfirmDraftConversion = useCallback(async () => {
    console.log("✅ User confirmed draft conversion");
    
    if (!syncingCV) {
      toast.error("No CV selected");
      return;
    }

    const resumeId = parseInt(syncingCV.id, 10);
    if (isNaN(resumeId)) {
      toast.error("Invalid CV ID");
      return;
    }

    try {
      setIsSyncing(true);
      toast.loading("Converting to draft...", { id: "convert-draft" });

      // Call API to change type from WEB to DRAFT
      await updateResumeType(resumeId, "DRAFT");

      // 🚀 Refresh data from API to get latest state
      if (refresh) {
        console.log("🔄 Refreshing data from API after draft conversion...");
        await refresh();
        console.log("✅ Data refreshed from API successfully");
      } else {
        // Fallback: Update local state if no refresh callback
        const updatedCV = { ...syncingCV, type: "DRAFT" };
        
        // Move from builtCVs to draftCVs
        setBuiltCVs(prev => prev.filter(cv => cv.id !== syncingCV.id));
        setDraftCVs(prev => [...prev, updatedCV as CV]);
      }

      toast.success("CV converted to draft successfully!", { id: "convert-draft" });
      setShowSyncConfirmDialog(false);
      setSyncingCV(null);
      setIsSyncing(false);

    } catch (err: any) {
      console.error("❌ Convert draft error:", err);
      setIsSyncing(false);
      toast.error(err.message || "Failed to convert to draft", { id: "convert-draft" });
    }
  }, [syncingCV, refresh, setBuiltCVs, setDraftCVs]);

  // ========================================
  // Draft Conversion Confirmation Handlers
  // (For untyped resumes created from SyncDialog)
  // ========================================

  // Perform the actual sync to profile (for uploaded CVs)
  // This is extracted to be called directly without going through checkBeforeSwitchCV
  const performSyncToProfile = useCallback(async (cv: CV) => {
    if (!cv.downloadUrl) {
      console.error("❌ Missing CV download URL");
      toast.error("Cannot sync: No download URL available");
      setSyncingCV(null);
      return;
    }

    try {
      setIsSyncing(true);
      toast.loading("Parsing CV with AI...", { id: "sync-cv" });
      console.log("📤 Starting Python API sync...");

      const parsedData = await syncCVWithUpdates(
        cv.downloadUrl,
        cv.name,
        (update) => {
          console.log("📥 Python sync update:", update);
          if (update.taskId) {
            toast.loading(`Processing (Task: ${update.taskId.slice(0, 8)}...)`, { id: "sync-cv" });
          }
          if (update.status === "processing") {
            toast.loading("AI is parsing your CV...", { id: "sync-cv" });
          }
        }
      );

      console.log("✅ Python parsing completed:", parsedData);
      toast.dismiss("sync-cv");
      
      setParsedCVData(parsedData);
      setShowSyncSummaryDialog(true);
      setIsSyncing(false);

    } catch (err: any) {
      console.error("❌ Python sync error:", err);
      setIsSyncing(false);
      setSyncingCV(null);
      toast.error(err.message || "Failed to parse CV", { id: "sync-cv" });
    }
  }, []);

  // Close draft conversion confirmation dialog
  const handleCloseDraftConversionConfirm = useCallback(() => {
    setShowDraftConversionConfirm(false);
    setPendingAction(null);
  }, []);

  // Confirm convert untyped resume to DRAFT
  const handleConfirmConvertToDraft = useCallback(async () => {
    if (!untypedResumeId) {
      console.log("No untyped resume to convert");
      handleCloseDraftConversionConfirm();
      return;
    }

    // Capture pending action BEFORE clearing state
    const actionToPerform = pendingAction ? { ...pendingAction } : null;

    try {
      toast.loading("Converting resume to Draft...", { id: "convert-to-draft" });
      
      const resumeId = parseInt(untypedResumeId, 10);
      console.log("📝 Converting untyped resume to DRAFT:", resumeId);
      
      // Call API: PATCH /api/resume/{resumeId}/type/DRAFT
      await updateResumeType(resumeId, "DRAFT");
      
      console.log("✅ Resume converted to DRAFT successfully");
      toast.success("Resume saved as Draft!", { id: "convert-to-draft" });
      
      // Clear the untyped resume ID
      clearUntypedResumeId();
      
      // Close dialog FIRST
      handleCloseDraftConversionConfirm();
      
      // Refresh data
      if (refresh) {
        await refresh();
      }
      
      // Continue with pending action - call sync logic DIRECTLY (bypass checkBeforeSwitchCV)
      if (actionToPerform) {
        const { type, cv } = actionToPerform;
        
        if (type === 'sync') {
          console.log("🔄 Continuing sync after DRAFT conversion (direct call)");
          // Set current editing resume
          setSyncingCV(cv);
          setCurrentEditingResume(cv.id);
          
          // Call sync logic directly based on CV source
          if (cv.source === "builder") {
            // Builder CV - show sync confirm dialog
            setShowSyncConfirmDialog(true);
          } else if (cv.source === "draft") {
            toast("This CV is already a draft", { icon: "ℹ️" });
            setSyncingCV(null);
          } else if (cv.source === "upload" && cv.downloadUrl) {
            // Uploaded CV - perform sync directly
            performSyncToProfile(cv);
          } else {
            toast.error("Cannot sync: Invalid CV source or missing URL");
            setSyncingCV(null);
          }
        } else if (type === 'edit') {
          // Navigate to edit
          setCurrentEditingResume(cv.id);
          router.push(`/candidate/cm-profile?resumeId=${cv.id}`);
        }
      }
      
    } catch (err: any) {
      console.error("❌ Failed to convert resume to DRAFT:", err);
      toast.error("Failed to save as Draft", { id: "convert-to-draft" });
    }
  }, [untypedResumeId, pendingAction, clearUntypedResumeId, refresh, performSyncToProfile, setCurrentEditingResume, router]);

  // Skip converting to DRAFT (just proceed with pending action)
  const handleSkipConvertToDraft = useCallback(() => {
    console.log("⏭️ Skipping DRAFT conversion");
    
    // Capture pending action BEFORE clearing state
    const actionToPerform = pendingAction ? { ...pendingAction } : null;
    
    // Clear the untyped resume ID without converting
    clearUntypedResumeId();
    
    // Close dialog FIRST
    handleCloseDraftConversionConfirm();
    
    // Continue with pending action - call sync logic DIRECTLY (bypass checkBeforeSwitchCV)
    if (actionToPerform) {
      const { type, cv } = actionToPerform;
      
      if (type === 'sync') {
        console.log("🔄 Continuing sync after skip (direct call)");
        // Set current editing resume
        setSyncingCV(cv);
        setCurrentEditingResume(cv.id);
        
        // Call sync logic directly based on CV source
        if (cv.source === "builder") {
          setShowSyncConfirmDialog(true);
        } else if (cv.source === "draft") {
          toast("This CV is already a draft", { icon: "ℹ️" });
          setSyncingCV(null);
        } else if (cv.source === "upload" && cv.downloadUrl) {
          performSyncToProfile(cv);
        } else {
          toast.error("Cannot sync: Invalid CV source or missing URL");
          setSyncingCV(null);
        }
      } else if (type === 'edit') {
        // Navigate to edit
        setCurrentEditingResume(cv.id);
        router.push(`/candidate/cm-profile?resumeId=${cv.id}`);
      }
    }
  }, [pendingAction, clearUntypedResumeId, performSyncToProfile, setCurrentEditingResume, router]);

  // ========================================
  // Switch CV Confirmation Handlers (for WEB/DRAFT CVs)
  // ========================================
  
  // Close switch CV confirmation dialog
  const handleCloseSwitchCVConfirm = useCallback(() => {
    setShowSwitchCVConfirm(false);
    setPendingAction(null);
  }, []);

  // Confirm switch to another CV (for WEB/DRAFT)
  const handleConfirmSwitchCV = useCallback(() => {
    console.log("✅ User confirmed switch to another CV");
    
    if (pendingAction) {
      const { type, cv } = pendingAction;
      handleCloseSwitchCVConfirm();
      
      if (type === 'sync') {
        // Continue to sync - call the actual sync logic
        setSyncingCV(cv);
        setCurrentEditingResume(cv.id);
        // Continue with sync flow for uploaded CVs
        if (cv.source === "upload" && cv.downloadUrl) {
          // Trigger the sync flow
          performSyncToProfile(cv);
        }
      } else if (type === 'edit') {
        // Navigate to edit
        setCurrentEditingResume(cv.id);
        router.push(`/candidate/cm-profile?resumeId=${cv.id}`);
      }
    } else {
      handleCloseSwitchCVConfirm();
    }
  }, [pendingAction, setCurrentEditingResume, router]);

  // Handle Edit CV action with confirmation check
  const handleEditCV = useCallback((cv: CV) => {
    console.log("✏️ handleEditCV called for CV:", cv.id, cv.name);
    
    // Check if we need to show confirmation dialog
    if (checkBeforeSwitchCV('edit', cv)) {
      return; // Action blocked, dialog will be shown
    }
    
    // No blocking, proceed with edit
    setCurrentEditingResume(cv.id);
    router.push(`/candidate/cm-profile?resumeId=${cv.id}`);
  }, [checkBeforeSwitchCV, setCurrentEditingResume, router]);

  const handlePreview = useCallback((cv: CV) => {
    console.log('🔍 Preview CV:', {
      id: cv.id,
      name: cv.name,
      downloadUrl: cv.downloadUrl,
      fileUrl: cv.fileUrl,
      storagePath: cv.storagePath,
    });

    setSelectedCV(cv);
    // Use downloadUrl as primary, fallback to fileUrl for backward compatibility
    const url = cv.downloadUrl || cv.fileUrl || null;

    if (!url) {
      console.error('❌ No URL available for preview:', cv);
      toast.error('Cannot preview: No file URL available');
      return;
    }

    console.log('✅ Setting preview URL:', url);
    setPreviewUrl(url);
    setShowPreview(true);
  }, []);

  const handleClosePreview = useCallback(() => {
    setShowPreview(false);
    setSelectedCV(null);
    setPreviewUrl(null);
  }, []);

  const handleDelete = useCallback(async (cvId: string) => {
    // Find the CV to delete
    const cvToDeleteItem = [...uploadedCVs, ...builtCVs, ...draftCVs].find(cv => cv.id === cvId);
    
    if (!cvToDeleteItem) {
      toast.error('CV not found');
      return;
    }

    // Show confirmation dialog instead of window.confirm
    setCvToDelete(cvToDeleteItem);
    setShowDeleteConfirm(true);
  }, [uploadedCVs, builtCVs, draftCVs]);

  // Handle close delete confirmation dialog
  const handleCloseDeleteConfirm = useCallback(() => {
    setShowDeleteConfirm(false);
    setCvToDelete(null);
  }, []);

  // Handle confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!cvToDelete) return;

    const cvId = cvToDelete.id;
    const resumeId = parseInt(cvId, 10);
    
    if (isNaN(resumeId)) {
      console.error('❌ Invalid resume ID:', cvId);
      toast.error('Invalid CV ID');
      handleCloseDeleteConfirm();
      return;
    }

    try {
      toast.loading('Deleting CV...', { id: 'delete-cv' });
      
      // Call API to delete resume
      await resumeService.deleteResume(resumeId);
      
      // Update local state
      setUploadedCVs(prev => prev.filter(cv => cv.id !== cvId));
      setBuiltCVs(prev => prev.filter(cv => cv.id !== cvId));
      setDraftCVs(prev => prev.filter(cv => cv.id !== cvId));

      // Update default if deleted CV was default
      if (defaultCV?.id === cvId) {
        const remaining = [...uploadedCVs, ...builtCVs, ...draftCVs].filter(cv => cv.id !== cvId);
        setDefaultCV(remaining[0] || null);
      }

      // Refresh data from API
      if (refresh) {
        await refresh();
      }

      toast.success("CV deleted successfully", { id: 'delete-cv' });
      handleCloseDeleteConfirm();
    } catch (error: any) {
      console.error('❌ Failed to delete CV:', error);
      toast.error(
        error.message || 'Failed to delete CV',
        { id: 'delete-cv' }
      );
      handleCloseDeleteConfirm();
    }
  }, [cvToDelete, defaultCV, uploadedCVs, builtCVs, draftCVs, setUploadedCVs, setBuiltCVs, setDraftCVs, setDefaultCV, refresh, handleCloseDeleteConfirm]);

  return {
    showPreview,
    previewUrl,
    selectedCV,
    // Sync dialog states
    showSyncSummaryDialog,
    showSyncConfirmDialog,
    parsedCVData,
    syncingCV,
    isSyncing,
    // Switch CV confirmation dialog (for WEB/DRAFT CVs)
    showSwitchCVConfirm,
    // Draft conversion confirmation dialog (for untyped CVs)
    showDraftConversionConfirm,
    pendingAction,
    // Delete confirmation dialog
    showDeleteConfirm,
    cvToDelete,
    // Actions
    handleSetDefault,
    handleSyncToProfile,
    handleEditCV,
    handlePreview,
    handleClosePreview,
    handleDelete,
    // Sync dialog handlers
    handleCloseSyncSummaryDialog,
    handleCloseSyncConfirmDialog,
    handleConfirmSync,
    handleConfirmDraftConversion,
    // Switch CV confirmation handlers
    handleCloseSwitchCVConfirm,
    handleConfirmSwitchCV,
    // Draft conversion confirmation handlers
    handleCloseDraftConversionConfirm,
    handleConfirmConvertToDraft,
    handleSkipConvertToDraft,
    // Delete confirmation handlers
    handleCloseDeleteConfirm,
    handleConfirmDelete,
  };
};
