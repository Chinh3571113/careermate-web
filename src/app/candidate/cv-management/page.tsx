"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import CVSidebar from "@/components/layout/CVSidebar";
import { useLayout } from "@/contexts/LayoutContext";
import { CV } from "@/services/cvService";
import { useCVUpload } from "@/hooks/useCVUpload";
import { useCVActions } from "@/hooks/useCVActions";
import { useResumeData } from "@/hooks/useResumeData";
import { resumesToCVsSync } from "@/utils/resumeConverter";
import { useAuthStore } from "@/store/use-auth-store";
import { useCVStore } from "@/stores/cvStore"; // Import CV Store for Redux DevTools
import { getMyInvoice, type Invoice } from "@/lib/invoice-api";
import { Lock, X, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import {
  CVCardHorizontal,
  CVTabs,
  CVGrid,
  EmptyState,
  PreviewModal,
  CVPageSkeleton,
  SyncCVSummaryDialog,
  SyncConfirmDialog,
  DraftConversionDialog,
  SwitchCVConfirmDialog,
  DeleteConfirmDialog
} from "@/components/cv-management";

type TabType = "built" | "uploaded" | "draft";

const CVManagementPage = () => {
  const router = useRouter();
  const { headerHeight } = useLayout();
  const [headerH, setHeaderH] = useState(headerHeight || 0);
  const [activeTab, setActiveTab] = useState<TabType>("built");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [currentPackage, setCurrentPackage] = useState<string>("FREE");

  // Initialize CV Store (for Redux DevTools visibility)
  const cvStore = useCVStore();
  const { setCVs, setDefaultCv: setDefaultCvInStore } = cvStore;

  // Get user info and profile fetcher
  const { candidateId, user, fetchCandidateProfile } = useAuthStore();
  const userId = candidateId || user?.id;

  // Ensure candidateId is loaded on mount
  useEffect(() => {
    if (!candidateId && user) {
      fetchCandidateProfile();
    }
  }, [candidateId, user, fetchCandidateProfile]);

  // Fetch invoice to check package
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const invoiceData = await getMyInvoice();
        setInvoice(invoiceData);
        // invoiceData can be null if no invoice found (404)
        setCurrentPackage(invoiceData?.packageName || "FREE");
      } catch (error: any) {
        if (error.message === 'NO_INVOICE_FOUND') {
          setCurrentPackage("FREE");
        }
      }
    };
    fetchInvoice();
  }, []);

  // Fetch resumes from API
  const {
    webResumes,
    uploadedResumes,
    draftResumes,
    activeResume,
    loading,
    error,
    refresh
  } = useResumeData();

  // CV States - converted from API
  const [uploadedCVs, setUploadedCVs] = useState<CV[]>([]);
  const [builtCVs, setBuiltCVs] = useState<CV[]>([]);
  const [draftCVs, setDraftCVs] = useState<CV[]>([]);
  const [defaultCV, setDefaultCV] = useState<CV | null>(null);

  // Convert API data to CV format AND sync to Zustand store
  useEffect(() => {
    if (!loading && !error) {
      const uploadedCVsConverted = resumesToCVsSync(uploadedResumes, userId);
      const builtCVsConverted = resumesToCVsSync(webResumes, userId);
      const draftCVsConverted = resumesToCVsSync(draftResumes, userId);

      setUploadedCVs(uploadedCVsConverted);
      setBuiltCVs(builtCVsConverted);
      setDraftCVs(draftCVsConverted);

      // ✅ Sync ALL CVs to Zustand store
      const allCVs = [
        ...uploadedCVsConverted,
        ...builtCVsConverted,
        ...draftCVsConverted,
      ];

      console.log('🔄 Syncing CVs to Zustand store:', allCVs);
      setCVs(allCVs);

      // Set default CV if there's an active resume
      if (activeResume) {
        const activeCV = allCVs.find((cv) => cv.id === activeResume.resumeId.toString());
        if (activeCV) {
          setDefaultCV(activeCV);
          // ✅ Also sync to Zustand store
          setDefaultCvInStore(activeCV.id);
          console.log('⭐ Active CV set as default:', activeCV.id);
        }
      } else {
        setDefaultCV(null);
      }
    }
  }, [webResumes, uploadedResumes, draftResumes, activeResume, loading, error, userId, setCVs, setDefaultCvInStore]);

  // Custom Hooks
  const uploadHook = useCVUpload(uploadedCVs, setUploadedCVs, defaultCV, setDefaultCV, refresh);
  const actionsHook = useCVActions(
    uploadedCVs,
    setUploadedCVs,
    builtCVs,
    setBuiltCVs,
    draftCVs,
    setDraftCVs,
    defaultCV,
    setDefaultCV,
    refresh
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHeight = localStorage.getItem("headerHeight");
      if (savedHeight && !headerHeight) {
        setHeaderH(parseInt(savedHeight));
      } else if (headerHeight) {
        setHeaderH(headerHeight);
      }
    }
  }, [headerHeight]);

  // Listen for CV updates from CVPreview and refresh the list
  useEffect(() => {
    const handleCVUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("🔔 Received cvUpdated event:", customEvent.detail);
      
      toast.success("CV list updated!", { id: "cv-updated" });
      
      // Refresh the CV data from API
      if (refresh) {
        console.log("🔄 Refreshing CV list...");
        refresh();
      }
    };

    window.addEventListener('cvUpdated', handleCVUpdated);

    return () => {
      window.removeEventListener('cvUpdated', handleCVUpdated);
    };
  }, [refresh]);

  // ✅ Memoize current CVs based on active tab to avoid recalculation on every render
  const currentCVs = useMemo(() => {
    switch (activeTab) {
      case "uploaded":
        return uploadedCVs;
      case "built":
        return builtCVs;
      case "draft":
        return draftCVs;
      default:
        return [];
    }
  }, [activeTab, uploadedCVs, builtCVs, draftCVs]);

  // ✅ Memoize boolean checks for empty state logic
  const hasAnyResumes = useMemo(() =>
    uploadedCVs.length > 0 || builtCVs.length > 0 || draftCVs.length > 0,
    [uploadedCVs.length, builtCVs.length, draftCVs.length]
  );

  /**
   * ========================================
   * CHECK FOR REAL CVs (WEB or UPLOAD type only)
   * ========================================
   * Business Rule: Empty state should only consider WEB/UPLOAD CVs.
   * Draft CVs (type="DRAFT") don't count as "real" CVs yet.
   */
  const hasRealCVs = useMemo(() => {
    const webAndUploadCVs = [...uploadedCVs, ...builtCVs];
    return webAndUploadCVs.length > 0;
  }, [uploadedCVs.length, builtCVs.length]);

  const hasDefaultCV = useMemo(() => defaultCV !== null, [defaultCV]);

  /**
   * ========================================
   * UNIFIED EMPTY STATE LOGIC
   * ========================================
   * Three possible states:
   * 1. No WEB/UPLOAD CVs → Show "no-cvs" mode (Upload/Build CTAs)
   * 2. Has WEB/UPLOAD CVs but no default → Show "no-default" mode (Instructions)
   * 3. Has default CV → Don't show empty state (show default CV card)
   */
  const shouldShowUnifiedEmptyState = useMemo(() => {
    return !hasDefaultCV;
  }, [hasDefaultCV]);

  const emptyStateMode = useMemo(() => {
    if (!hasRealCVs) return "no-cvs";
    if (hasRealCVs && !hasDefaultCV) return "no-default";
    return "tab-empty"; // Fallback (shouldn't reach here)
  }, [hasRealCVs, hasDefaultCV]);

  // Handler for Create CV button
  const handleCreateCV = useCallback(async () => {
    // Get current editing resume from Zustand store
    const currentEditingResumeId = useCVStore.getState().currentEditingResumeId;
    const untypedResumeId = useCVStore.getState().untypedResumeId;

    // Check if there's a currently editing CV
    if (currentEditingResumeId || untypedResumeId) {
      // Find the current editing CV
      const allCVs = [...uploadedCVs, ...builtCVs, ...draftCVs];
      const currentCV = allCVs.find(cv => 
        cv.id === currentEditingResumeId || cv.id === untypedResumeId
      );

      if (currentCV) {
        console.log('📋 Found current editing CV:', currentCV.id, 'type:', currentCV.type);

        // Case 1: CV has empty/null type -> Show DRAFT conversion dialog
        // Check if type is empty, null, or undefined (untyped resume)
        const cvType = currentCV.type as string | undefined | null;
        if (!cvType || cvType === '') {
          console.log('⚠️ Current CV has empty type, showing DRAFT conversion dialog');
          // Use the actions hook to handle this
          actionsHook.setPendingAction({ 
            type: 'edit', 
            cv: { ...currentCV, id: 'new-cv-creation' } as CV 
          });
          actionsHook.setShowDraftConversionConfirm(true);
          return;
        }

        // Case 2: CV has type "DRAFT" or "WEB" -> Show switch CV confirmation
        if (cvType === 'DRAFT' || cvType === 'WEB') {
          console.log('⚠️ Currently editing CV with type:', cvType, '- showing switch confirmation');
          actionsHook.setPendingAction({ 
            type: 'edit', 
            cv: { ...currentCV, id: 'new-cv-creation' } as CV 
          });
          actionsHook.setShowSwitchCVConfirm(true);
          return;
        }
      }
    }

    // No blocking conditions, proceed with CV creation
    await proceedWithCVCreation();
  }, [uploadedCVs, builtCVs, draftCVs, actionsHook]);

  // Separate function to handle actual CV creation
  const proceedWithCVCreation = useCallback(async () => {
    // Check package limits
    const builtCVCount = builtCVs.length;

    // Determine limits based on package
    let canCreate = false;
    let limitMessage = '';

    if (currentPackage === 'PREMIUM') {
      // PREMIUM: Unlimited
      canCreate = true;
    } else if (currentPackage === 'PLUS') {
      // PLUS: Max 5 CV builders
      if (builtCVCount < 5) {
        canCreate = true;
      } else {
        limitMessage = `You have reached the limit of 5 CVs for the PLUS package. Upgrade to PREMIUM for unlimited CV creation!`;
      }
    } else {
      // FREE: Max 1 CV builder
      if (builtCVCount < 1) {
        canCreate = true;
      } else {
        limitMessage = `You have reached the limit of 1 CV for the FREE package. Upgrade to PLUS or PREMIUM to create more CVs!`;
      }
    }

    if (!canCreate) {
      setShowUpgradeModal(true);
      toast.error(limitMessage, {
        duration: 4500,
        icon: '🔒',
      });
      return;
    }

    // Create new resume via API
    try {
      toast.loading('Creating new CV...', { id: 'create-cv' });
      
      const { createResume } = await import('@/services/resumeService');
      
      // Auto-set as default ONLY if this is the FIRST WEB/UPLOAD CV
      // (Don't count DRAFT CVs)
      const webAndUploadCount = uploadedCVs.length + builtCVs.length;
      const isActive = webAndUploadCount === 0 && !defaultCV;
      
      console.log("📊 Auto-default check (Create CV):", {
        uploadedCVsCount: uploadedCVs.length,
        builtCVsCount: builtCVs.length,
        webAndUploadCount,
        hasDefaultCV: !!defaultCV,
        willSetAsDefault: isActive
      });
      
      // Call API to create resume - backend will set type as "WEB" by default
      const newResume = await createResume({
        aboutMe: "",
        isActive: isActive
      });

      if (isActive) {
        toast.success('CV created and set as default!', { id: 'create-cv' });
      } else {
        toast.success('CV created successfully!', { id: 'create-cv' });
      }
      
      // Navigate to cm-profile with resumeId
      router.push(`/candidate/cm-profile?resumeId=${newResume.resumeId}`);
    } catch (error: any) {
      console.error('Failed to create CV:', error);
      toast.error(error?.message || 'Failed to create CV. Please try again.', { id: 'create-cv' });
    }
  }, [builtCVs.length, uploadedCVs.length, defaultCV, currentPackage, router]);

  // Listen for the custom event from useCVActions to proceed with CV creation
  useEffect(() => {
    const handleProceedWithCVCreation = () => {
      console.log("📢 Received proceedWithCVCreation event");
      proceedWithCVCreation();
    };

    window.addEventListener('proceedWithCVCreation', handleProceedWithCVCreation);

    return () => {
      window.removeEventListener('proceedWithCVCreation', handleProceedWithCVCreation);
    };
  }, [proceedWithCVCreation]);

  // Loading state - use skeleton
  if (loading) {
    return <CVPageSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-900 font-semibold mb-2">Failed to load CVs</p>
            <p className="text-gray-600 text-sm mb-4">{error.message}</p>
            <button
              onClick={refresh}
              className="px-4 py-2 bg-[#3a4660] text-white rounded-lg hover:bg-[#2d3750] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div
          className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-6 items-start transition-all duration-300 isolate"
          style={{
            ["--sticky-offset" as any]: `${headerH}px`,
            ["--content-pad" as any]: "24px"
          }}
        >
          {/* Sidebar */}
          <aside className="hidden lg:block sticky [top:calc(var(--sticky-offset)+var(--content-pad))] self-start transition-all duration-300 pointer-events-auto z-[1]">
            <CVSidebar activePage="cv-management" />
          </aside>

          {/* Main Content */}
          <section className="space-y-6 min-w-0 transition-all duration-300 relative z-[2] pointer-events-auto">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">CV Management</h1>
              <p className="text-gray-600">Upload or create CVs to use during job applications</p>
            </div>

            {/* 
              ========================================
              UNIFIED EMPTY STATE / DEFAULT CV DISPLAY
              ========================================
              Business Rules:
              1. If user has NO CVs → Show empty state with "no-cvs" mode
              2. If user has CVs but NO default → Show empty state with "no-default" mode
              3. If user has default CV → Show default CV card (no empty state)
              
              Auto Default Logic (Backend enforced):
              - Backend MUST auto-set default CV when:
                * cvCount === 1
                * AND no default CV exists yet
                * AND the trigger is FIRST create/upload
              - Backend MUST NOT auto-set on:
                * sync, edit, re-fetch, page reload
              - Database MUST guarantee only ONE default CV per user
              - Frontend only reflects state (hasCV, hasDefaultCV)
            */}
            {shouldShowUnifiedEmptyState ? (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <EmptyState
                  mode={emptyStateMode}
                  onUploadClick={() => {
                    setActiveTab("uploaded");
                    document.getElementById("cv-upload-input")?.click();
                  }}
                  onBuildClick={handleCreateCV}
                />
              </div>
            ) : (
              <div className="bg-gradient-to-r from-[#3a4660] to-gray-400 rounded-xl p-6 shadow-md">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                      Default CV
                      <span className="text-xs bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    </h2>
                    <p className="text-sm text-white/90">
                      This CV will be used automatically when applying for jobs
                    </p>
                  </div>
                </div>

                <CVCardHorizontal
                  cv={defaultCV!}
                  isDefault
                  onSetDefault={() => { }}
                  onPreview={() => actionsHook.handlePreview(defaultCV!)}
                  onSync={() => actionsHook.handleSyncToProfile(defaultCV!)}
                  onEdit={() => actionsHook.handleEditCV(defaultCV!)}
                  onDelete={() => actionsHook.handleDelete(defaultCV!.id)}
                />
              </div>
            )}

            {/* Tabs */}
            <CVTabs
              activeTab={activeTab}
              builtCount={builtCVs.length}
              uploadedCount={uploadedCVs.length}
              draftCount={draftCVs.length}
              isUploading={uploadHook.isUploading}
              onTabChange={setActiveTab}
              onUploadClick={uploadHook.handleFileInput}
              onCreateCVClick={handleCreateCV}
            />

            {/* CV Grid or Empty State */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 relative z-[3] isolate pointer-events-auto">
              {currentCVs.length > 0 ? (
                <CVGrid
                  cvs={currentCVs}
                  onSetDefault={actionsHook.handleSetDefault}
                  onSync={actionsHook.handleSyncToProfile}
                  onEdit={actionsHook.handleEditCV}
                  onPreview={actionsHook.handlePreview}
                  onDelete={actionsHook.handleDelete}
                  isSyncing={actionsHook.isSyncing}
                  syncingCVId={actionsHook.syncingCV?.id}
                />
              ) : (
                <EmptyState activeTab={activeTab} onFileInput={uploadHook.handleFileInput} />
              )}
            </div>
          </section>
        </div>

        {/* Hidden file input for upload */}
        <input
          id="cv-upload-input"
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={uploadHook.handleFileInput}
        />
      </main>

      {/* Preview Modal */}
      {actionsHook.showPreview && actionsHook.selectedCV && (
        <PreviewModal
          cv={actionsHook.selectedCV}
          previewUrl={actionsHook.previewUrl}
          onClose={actionsHook.handleClosePreview}
        />
      )}

      {/* Upgrade Modal for CV Builder Limit */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-6 border-b border-gray-200">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl flex items-center justify-center">
                  <Lock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">CV Builder Limit Reached</h3>
                  <p className="text-sm text-gray-500">Upgrade to create more CVs</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <Sparkles className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-900 font-medium mb-2">
                      You have reached your CV Builder limit
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                      Upgrade your plan to create more CVs and unlock additional features!
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-3">Package Limits:</p>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                        <span>FREE Package</span>
                      </span>
                      <span className="font-semibold">1 CV Builder</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                        <span>PLUS Package</span>
                      </span>
                      <span className="font-semibold">5 CV Builders</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
                        <span>PREMIUM Package</span>
                      </span>
                      <span className="font-semibold">Unlimited</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Not now
                </button>
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    router.push('/candidate/pricing');
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all font-semibold text-sm shadow-lg hover:shadow-xl"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync CV Summary Dialog - For reviewing parsed CV data before saving */}
      <SyncCVSummaryDialog
        open={actionsHook.showSyncSummaryDialog}
        onOpenChange={actionsHook.handleCloseSyncSummaryDialog}
        parsedData={actionsHook.parsedCVData}
        onConfirm={actionsHook.handleConfirmSync}
        isLoading={actionsHook.isSyncing}
        cvUrl={actionsHook.syncingCV?.downloadUrl}
      />

      {/* Sync Confirm Dialog - For converting WEB CV to DRAFT */}
      <SyncConfirmDialog
        open={actionsHook.showSyncConfirmDialog}
        onOpenChange={actionsHook.handleCloseSyncConfirmDialog}
        onConfirm={actionsHook.handleConfirmDraftConversion}
        isLoading={actionsHook.isSyncing}
      />

      {/* Draft Conversion Dialog - For untyped CVs (type="") */}
      <DraftConversionDialog
        open={actionsHook.showDraftConversionConfirm}
        onOpenChange={actionsHook.handleCloseDraftConversionConfirm}
        onConfirmSaveAsDraft={actionsHook.handleConfirmConvertToDraft}
        onSkipAndContinue={actionsHook.handleSkipConvertToDraft}
        isLoading={actionsHook.isSyncing}
      />

      {/* Switch CV Confirm Dialog - For WEB/DRAFT CVs */}
      <SwitchCVConfirmDialog
        open={actionsHook.showSwitchCVConfirm}
        onOpenChange={actionsHook.handleCloseSwitchCVConfirm}
        onConfirm={actionsHook.handleConfirmSwitchCV}
        isLoading={actionsHook.isSyncing}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={actionsHook.showDeleteConfirm}
        onOpenChange={actionsHook.handleCloseDeleteConfirm}
        cv={actionsHook.cvToDelete}
        onConfirm={actionsHook.handleConfirmDelete}
        isDeleting={actionsHook.isSyncing}
      />
    </>
  );
};

export default CVManagementPage;
