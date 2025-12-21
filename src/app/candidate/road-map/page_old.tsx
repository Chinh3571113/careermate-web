"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import CVSidebar from "@/components/layout/CVSidebar";
import { useLayout } from "@/contexts/LayoutContext";
import { useRouter } from "next/navigation";
import {
  Target,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  BookOpen,
  TrendingUp,
  Lock,
  X,
  Sparkles,
  Calendar,
} from "lucide-react";
import { fetchCurrentCandidateProfile } from "@/lib/candidate-profile-api";
import { getResumeRoadmaps, ResumeRoadmap } from "@/lib/roadmap-api";
import { checkRoadmapRecommendationAccess } from "@/lib/entitlement-api";
import { useCVStore } from "@/stores/cvStore";
import toast from "react-hot-toast";

// Skeleton Loading Component
function SkeletonCard() {
  return (
    <div className="border border-gray-200 rounded-lg p-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
          <div className="h-2 bg-gray-200 rounded w-full"></div>
        </div>
        <div className="w-24 h-10 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
}

export default function RoadMapPage() {
  const router = useRouter();
  const { headerHeight } = useLayout();
  const [headerH, setHeaderH] = useState(headerHeight || 0);
  const currentEditingResumeId = useCVStore((s) => s.currentEditingResumeId);
  const [roadmaps, setRoadmaps] = useState<ResumeRoadmap[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingRoadmaps, setIsLoadingRoadmaps] = useState(false);
  const [error, setError] = useState<string>("");
  const [hasAccess, setHasAccess] = useState<boolean>(true);
  const [accessCode, setAccessCode] = useState<number | null>(null);
  const [accessResult, setAccessResult] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [totalElements, setTotalElements] = useState(0);

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

  // Fetch candidate profile on mount to get professional title
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoadingProfile(true);
      setError("");

      console.log('🔵 [ROADMAP PAGE] Fetching candidate profile...');

      // Check access first
      const accessRes = await checkRoadmapRecommendationAccess();
      setHasAccess(!!accessRes.hasAccess);
      setAccessCode(accessRes.code ?? null);
      setAccessResult(accessRes.result ?? null);
      console.log('🔵 [ROADMAP PAGE] Roadmap recommendation access:', accessRes);

      const profile = await fetchCurrentCandidateProfile();

      console.log('✅ [ROADMAP PAGE] Profile fetched:', profile);
      console.log('✅ [ROADMAP PAGE] Professional title:', profile.title);

      if (profile.title) {
        setProfessionalTitle(profile.title);
        console.log('✅ [ROADMAP PAGE] Will fetch recommendations for:', profile.title);
        // Automatically fetch recommendations when we have a title
        fetchRecommendations(profile.title);
      } else {
        console.warn('⚠️ [ROADMAP PAGE] No professional title found in profile');
        setError("Bạn chưa cập nhật Professional Title. Vui lòng cập nhật trong CM Profile.");
        setIsLoadingProfile(false);
      }
    } catch (error: any) {
      console.error("❌ [ROADMAP PAGE] Error fetching profile:", error);
      if (error.message === "PROFILE_NOT_FOUND") {
        setError("Bạn chưa có profile. Vui lòng tạo profile trong CM Profile.");
      } else {
        setError("Không thể tải thông tin profile. Vui lòng thử lại.");
      }
      setIsLoadingProfile(false);
    }
  }, []);

  const fetchRecommendations = useCallback(async (role: string) => {
    try {
      setIsLoadingRecommendations(true);
      setError("");

      console.log('🔵 [ROADMAP PAGE] Fetching recommendations for role:', role);

      const response = await getRoadmapRecommendations(role);

      console.log('✅ [ROADMAP PAGE] API Response:', response);
      console.log('✅ [ROADMAP PAGE] Response result:', response.result);
      console.log('✅ [ROADMAP PAGE] Result length:', response.result?.length);

      if (response.code === 200 && response.result) {
        console.log('✅ [ROADMAP PAGE] Setting recommendations:', response.result);
        setRecommendations(response.result);

      } else {
        console.warn('⚠️ [ROADMAP PAGE] Unexpected response format:', response);
        setRecommendations([]);
        toast("Could not find roadmap list.");
      }
    } catch (error: any) {
      console.error("❌ [ROADMAP PAGE] Error fetching recommendations:", error);
      setError("Could not load roadmap list. Please try again.");
      toast.error("Error roadmap recommendations");
      setRecommendations([]);
    } finally {
      setIsLoadingProfile(false);
      setIsLoadingRecommendations(false);
    }
  }, []);

  const handleRefreshRoadmaps = useCallback(() => {
    if (currentEditingResumeId) {
      fetchRoadmaps(parseInt(currentEditingResumeId));
    }
  }, [currentEditingResumeId, fetchRoadmaps]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };



  // Loading state with skeleton
  if (isLoadingProfile) {
    return (
      <div className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-6 items-start">
            <aside className="hidden lg:block sticky top-24 self-start">
              <CVSidebar activePage="road-map" />
            </aside>
            <section className="min-w-0 space-y-6">
              {/* Header Skeleton */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>

              {/* Cards Skeleton */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !currentEditingResumeId) {
    return (
      <div className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-6 items-start">
            <aside className="hidden lg:block sticky top-24 self-start">
              <CVSidebar activePage="road-map" />
            </aside>
            <section className="min-w-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Thiếu thông tin</h3>
                  <p className="text-gray-600 mb-6">{error}</p>
                  <div className="flex gap-3 justify-center">
                    <a
                      href="/candidate/cm-profile"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      Cập nhật Profile
                    </a>
                    <button
                      onClick={fetchProfile}
                      className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                    >
                      Thử lại
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div
          className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-6 items-start transition-all duration-300"
          style={{
            ["--sticky-offset" as any]: `${headerH}px`,
            ["--content-pad" as any]: "24px",
          }}
        >
          {/* Sidebar */}
          <aside className="hidden lg:block sticky [top:calc(var(--sticky-offset)+var(--content-pad))] self-start transition-all duration-300">
            <CVSidebar activePage="road-map" />
          </aside>

          {/* Main Content */}
          <section className="space-y-6 min-w-0 transition-all duration-300">
            {/* Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">Career Road Map</h1>
                  <p className="text-gray-600 text-sm">Roadmap recommendations based on your professional title</p>
                </div>
                {professionalTitle && (
                  <button
                    onClick={handleRefreshRecommendations}
                    disabled={isLoadingRecommendations}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingRecommendations ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                )}
              </div>

              {/* Professional Title */}
              {professionalTitle && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Your Professional Title</span>
                  </div>
                  <p className="text-lg font-bold text-blue-900">{professionalTitle}</p>
                  <p className="text-sm text-blue-700 mt-1">
                    {recommendations.length} roadmap{recommendations.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              )}
            </div>

            {/* Loading Roadmaps with Skeleton */}
            {isLoadingRoadmaps && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
                <div className="space-y-3">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              </div>
            )}

            {/* Recommendations List */}
            {!isLoadingRecommendations && recommendations.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Recommended Roadmaps</h2>
                <div className="space-y-3">
                  {recommendations.map((roadmap, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          {/* Rank */}
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                            index === 1 ? 'bg-gray-100 text-gray-600' :
                              index === 2 ? 'bg-orange-100 text-orange-600' :
                                'bg-gray-50 text-gray-500'
                            }`}>
                            #{index + 1}
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1 capitalize">{roadmap.title}</h3>

                            {/* Progress Bar */}
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${roadmap.similarityScore * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-gray-700 min-w-[50px]">
                                {Math.round(roadmap.similarityScore * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => {
                            if (!hasAccess) {
                              setShowUpgradeModal(true);
                              return;
                            }
                            router.push(`/candidate/road-map-flow/${encodeURIComponent(roadmap.title)}`);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium ml-4"
                        >
                          <BookOpen className="w-4 h-4" />
                          View
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoadingRecommendations && recommendations.length === 0 && professionalTitle && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy roadmap</h3>
                <p className="text-gray-600 mb-6">
                  Chưa có roadmap phù hợp với "{professionalTitle}". Vui lòng thử lại sau.
                </p>
                <button
                  onClick={handleRefreshRecommendations}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2 text-sm font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Thử lại
                </button>
              </div>
            )}

            {/* Tips Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Tips for Using Road Maps
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Choose a roadmap that best matches your current career goals and skills</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Follow the recommended learning path step by step for optimal results</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Update your Professional Title in CM Profile to get more accurate recommendations</span>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>

      {/* Upgrade Modal */}
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
                  <h3 className="text-xl font-bold text-gray-900">Premium Feature</h3>
                  <p className="text-sm text-gray-500">Unlock full access</p>
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
                      Please upgrade to the Premium plan to access this feature.
                    </p>
                    <p className="text-sm text-gray-600">
                      Roadmap Recommendation is a feature exclusive to Premium members. Upgrade now to access personalized career roadmaps!
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Premium Benefits:</p>
                  <ul className="space-y-1.5 text-sm text-blue-800">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                      <span>Unlimited Roadmap Recommendations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                      <span>Personalized Career Paths</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                      <span>Priority Support</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                      <span>Access to All Premium Features</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Later
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
    </div>
  );
}
