"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  BookOpen,
  Loader2,
  AlertCircle,
  X,
  CheckCircle2,
  Circle,
  Clock,
  PlayCircle,
  Award,
  Menu,
  Star,
  CheckCircle,
  Info,
  MoreVertical,
  Link as LinkIcon,
} from "lucide-react";
import { getRoadmapByName, getTopicDetail, getSubtopicDetail, Topic } from "@/lib/roadmap-api";
import toast from "react-hot-toast";

// Resources Menu Component
function ResourcesMenu({
  resources,
  onClose,
}: {
  resources: string[];
  onClose: () => void;
}) {
  if (resources.length === 0) {
    return (
      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
        <div className="p-4 text-center text-gray-500 text-sm">
          No resources available
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 flex items-center gap-2">
          <LinkIcon className="w-4 h-4" />
          <span className="font-semibold text-sm">Learning Resources</span>
        </div>
        <div className="max-h-64 overflow-y-auto">
          <div className="p-2 space-y-1">
            {resources.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors group"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0 group-hover:text-blue-700" />
                <span className="text-sm text-gray-700 group-hover:text-blue-700 truncate flex-1">
                  {url}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// Tag Badge Component
function TagBadge({ tag }: { tag: string }) {
  const tagLower = tag.toLowerCase();

  // Personal Recommendation - Purple with Star
  if (tagLower.includes('personal recommendation') || tagLower.includes('recommended')) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
        <Star className="w-3 h-3 fill-current" />
        {tag}
      </span>
    );
  }

  // Alternative Option - Green with CheckCircle
  if (tagLower.includes('alternative') || tagLower.includes('option')) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
        <CheckCircle className="w-3 h-3" />
        {tag}
      </span>
    );
  }

  // Order Not Strict - Amber with Info
  if (tagLower.includes('order') || tagLower.includes('not strict') || tagLower.includes('flexible')) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-medium">
        <Info className="w-3 h-3" />
        {tag}
      </span>
    );
  }

  // Default - Blue
  return (
    <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
      {tag}
    </span>
  );
}

// Course Item Component
function CourseItem({
  course,
  index,
  isCompleted,
  onToggleComplete,
  totalCourses,
  onCourseClick,
  resources,
}: {
  course: {
    id: number;
    name: string;
    duration?: string;
    type: string;
  };
  index: number;
  isCompleted: boolean;
  onToggleComplete: () => void;
  totalCourses: number;
  onCourseClick?: () => void;
  resources?: string[];
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={`flex items-center gap-4 p-4 bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer relative ${isCompleted ? 'bg-green-50' : ''
        }`}
      onClick={(e) => {
        // Don't trigger if clicking on checkbox or menu
        if ((e.target as HTMLElement).closest('button')) return;
        onCourseClick?.();
      }}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete();
        }}
        className="flex-shrink-0"
      >
        {isCompleted ? (
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        ) : (
          <Circle className="w-6 h-6 text-gray-400 hover:text-gray-600" />
        )}
      </button>

      {/* Course Name */}
      <div className="flex-1">
        <h3 className={`font-medium text-sm ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
          {course.name}
        </h3>
      </div>

      {/* Course Type */}
      <div className="flex-shrink-0">
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
          <PlayCircle className="w-3 h-3" />
          {course.type}
        </span>
      </div>

      {/* Duration */}
      {course.duration && (
        <div className="flex-shrink-0 flex items-center gap-1 text-gray-600 text-sm">
          <Clock className="w-4 h-4" />
          <span>{course.duration}</span>
        </div>
      )}

      {/* More Options */}
      <div className="relative flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>

        {showMenu && (
          <ResourcesMenu
            resources={resources || []}
            onClose={() => setShowMenu(false)}
          />
        )}
      </div>
    </div>
  );
}

// Subtopic Item Component (for modal lessons tab)
function SubtopicItem({
  subtopic,
  index,
  description,
}: {
  subtopic: { id: number; name: string; tags: string; resources?: string[] };
  index: number;
  description?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 hover:bg-gray-100 transition-colors cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
          {index + 1}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 text-sm">{subtopic.name}</h4>
        </div>
        {subtopic.tags && (
          <TagBadge tag={subtopic.tags} />
        )}
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-200 bg-white">
          {/* Description */}
          {description && (
            <div className="pt-4">
              <h5 className="text-xs font-bold text-gray-700 mb-2 uppercase">Description</h5>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>
          )}

          {/* Learning Resources */}
          {subtopic.resources && subtopic.resources.length > 0 && (
            <div>
              <h5 className="text-xs font-bold text-gray-700 mb-3 uppercase">Learning Resources</h5>
              <div className="space-y-2">
                {subtopic.resources.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors group"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0 group-hover:text-blue-700" />
                    <span className="text-sm text-blue-700 group-hover:text-blue-900 truncate flex-1">
                      {url}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {!description && (!subtopic.resources || subtopic.resources.length === 0) && (
            <div className="text-center py-6 text-gray-500">
              <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs">No information available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Course Group Component
function CourseGroup({
  title,
  courses,
  completedCourses,
  onToggleComplete,
  isExpanded,
  onToggleExpand,
  onCourseClick,
  coursesResources,
}: {
  title: string;
  courses: Array<{ id: number; name: string; duration?: string; type: string }>;
  completedCourses: Set<number>;
  onToggleComplete: (courseId: number) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCourseClick?: (courseId: number) => void;
  coursesResources?: Map<number, { description: string; resources: string[] }>;
}) {
  const completedCount = courses.filter(c => completedCourses.has(c.id)).length;
  const totalCount = courses.length;
  const allCompleted = completedCount === totalCount;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4">
      {/* Group Header */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${allCompleted ? 'bg-green-500' : 'bg-gray-300'
          }`}>
          {allCompleted ? (
            <CheckCircle2 className="w-7 h-7 text-white" />
          ) : (
            <Circle className="w-7 h-7 text-white" />
          )}
        </div>

        <div className="flex-1 text-left">
          <h2 className="font-bold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-600 mt-1">
            List courses included in this group.
          </p>
        </div>

        <div className="text-sm text-gray-600 font-medium">
          {completedCount} of {totalCount} Course(s)
        </div>

        <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Course List */}
      {isExpanded && (
        <div className="divide-y divide-gray-200">
          {courses.map((course, index) => (
            <CourseItem
              key={course.id}
              course={course}
              index={index}
              isCompleted={completedCourses.has(course.id)}
              onToggleComplete={() => onToggleComplete(course.id)}
              totalCourses={totalCount}
              onCourseClick={() => onCourseClick?.(course.id)}
              resources={coursesResources?.get(course.id)?.resources || []}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Course Detail Modal
function CourseDetailModal({
  course,
  subtopics,
  subtopicDetails,
  onClose,
}: {
  course: {
    name: string;
    description: string;
    resources: string[];
    duration?: string;
    tags?: string[];
  } | null;
  subtopics: Array<{ id: number; name: string; tags: string; resources?: string[] }>;
  subtopicDetails: Map<number, { description: string; resources: string[] }>;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'lessons'>('overview');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!course) return null;

  const needsReadMore = course.description && course.description.length > 300;
  const displayText = (course.description && (isDescriptionExpanded || !needsReadMore))
    ? course.description
    : course.description?.substring(0, 300) + '...';

  return (
    <>
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2e2e2e00] bg-opacity-50 animate-fadeIn" onClick={onClose}>
        <div className="bg-gradient-to-br from-gray-700 via-blue-900 to-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden animate-slideUp" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="p-6 pb-4 text-white">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="text-sm text-gray-300 mb-2">Online Course</div>
                <h2 className="text-2xl font-bold mb-3">{course.name}</h2>
                <div className="text-sm text-gray-300">{course.duration || '45m - 1h'}</div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors">
                <PlayCircle className="w-4 h-4" />
                View
              </button>
              <button className="p-2.5 border border-white/30 hover:bg-white/10 rounded-lg transition-colors">
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'overview'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('lessons')}
                className={`flex-1 px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'lessons'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                Lessons
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white overflow-hidden" style={{ height: 'calc(85vh - 250px)' }}>
            <div className="h-full overflow-y-auto p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Description */}
                  {course.description && (
                    <div>
                      <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
                        {displayText}
                      </p>
                      {needsReadMore && (
                        <button
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="text-teal-500 hover:text-teal-600 text-sm font-medium mt-2"
                        >
                          {isDescriptionExpanded ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {course.tags && course.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {course.tags.map((tag, idx) => (
                          <TagBadge key={idx} tag={tag} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Learning Resources */}
                  {course.resources.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 mb-3">Learning Resources asd</h3>
                      <div className="space-y-2">
                        {course.resources.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group border border-blue-200"
                          >
                            <ExternalLink className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-blue-700 group-hover:text-blue-800 break-all flex-1">{url}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {!course.description && course.resources.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm">No overview information available</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'lessons' && (
                <div className="space-y-3">
                  {subtopics.length > 0 ? (
                    subtopics.map((subtopic, index) => (
                      <SubtopicItem
                        key={subtopic.id}
                        subtopic={subtopic}
                        index={index}
                        description={subtopicDetails.get(subtopic.id)?.description}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm">No lessons available</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function RoadmapCoursesPage() {
  const params = useParams();
  const router = useRouter();

  const roadmapName = decodeURIComponent(params.roadmapName as string);

  const [roadmapData, setRoadmapData] = useState<{ name: string; topics: Topic[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Track completed courses
  const [completedCourses, setCompletedCourses] = useState<Set<number>>(new Set());

  // Track expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['mandatory']));

  // Selected course for detail modal
  const [selectedCourse, setSelectedCourse] = useState<{
    name: string;
    description: string;
    resources: string[];
    duration?: string;
    tags?: string[];
    subtopics: Array<{ id: number; name: string; tags: string; resources?: string[] }>;
  } | null>(null);

  // Topic details cache
  const [topicDetails, setTopicDetails] = useState<Map<number, { description: string; resources: string[] }>>(new Map());

  // Subtopic details cache
  const [subtopicDetails, setSubtopicDetails] = useState<Map<number, { description: string; resources: string[] }>>(new Map());

  useEffect(() => {
    if (roadmapName) {
      fetchRoadmapData();
    }
  }, [roadmapName]);

  useEffect(() => {
    // Load completed courses from localStorage
    const saved = localStorage.getItem(`roadmap-courses-${roadmapName}`);
    if (saved) {
      try {
        const ids = JSON.parse(saved);
        setCompletedCourses(new Set(ids));
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    }
  }, [roadmapName]);

  const fetchRoadmapData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await getRoadmapByName(roadmapName);

      if (response.code === 200 && response.result) {
        setRoadmapData(response.result);
        fetchAllTopicDetails(response.result.topics);
      } else {
        setError("Không thể tải roadmap");
        toast.error("Lỗi khi tải roadmap");
      }
    } catch (error: any) {
      console.error("Error fetching roadmap:", error);
      setError("Không thể tải roadmap. Vui lòng thử lại.");
      toast.error("Lỗi khi tải roadmap");
    } finally {
      setIsLoading(false);
    }
  }, [roadmapName]);

  const fetchAllTopicDetails = async (topics: Topic[]) => {
    console.log('🔵 fetchAllTopicDetails - topics:', topics);
    const detailsMap = new Map();
    const subtopicDetailsMap = new Map();

    for (const topic of topics) {
      console.log(`🔵 Processing topic ${topic.id}: ${topic.name}, subtopics:`, topic.subtopics);
      try {
        const detail = await getTopicDetail(topic.id);
        detailsMap.set(topic.id, {
          description: detail.description,
          resources: detail.resourceResponses.map(r => r.url).filter(url => url),
        });

        // Fetch subtopic details
        if (topic.subtopics && topic.subtopics.length > 0) {
          for (const subtopic of topic.subtopics) {
            console.log(`🔵 Fetching subtopic ${subtopic.id}: ${subtopic.name}`);
            try {
              const subDetail = await getSubtopicDetail(subtopic.id);
              console.log(`✅ Subtopic ${subtopic.id} detail:`, subDetail);
              subtopicDetailsMap.set(subtopic.id, {
                description: subDetail.description,
                resources: subDetail.resourceResponses.map(r => r.url).filter(url => url),
              });
            } catch (error) {
              console.error(`Error fetching detail for subtopic ${subtopic.id}:`, error);
            }
          }
        } else {
          console.log(`⚠️ Topic ${topic.id} has no subtopics`);
        }
      } catch (error) {
        console.error(`Error fetching detail for topic ${topic.id}:`, error);
      }
    }

    console.log('🔵 Final detailsMap size:', detailsMap.size);
    console.log('🔵 Final subtopicDetailsMap size:', subtopicDetailsMap.size);

    setTopicDetails(detailsMap);
    setSubtopicDetails(subtopicDetailsMap);
  };

  const handleToggleComplete = useCallback((courseId: number) => {
    setCompletedCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }

      localStorage.setItem(`roadmap-courses-${roadmapName}`, JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  }, [roadmapName]);

  const handleToggleGroup = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  const handleCourseClick = useCallback((topic: Topic, duration?: string) => {
    console.log('🔵 handleCourseClick - Topic:', topic);
    console.log('🔵 handleCourseClick - Topic subtopics:', topic.subtopics);
    console.log('🔵 handleCourseClick - subtopicDetails map size:', subtopicDetails.size);

    const details = topicDetails.get(topic.id);
    const tags = topic.tags ? [topic.tags] : [];

    // Add resources to subtopics
    const subtopicsWithResources = (topic.subtopics || []).map(subtopic => {
      const subDetails = subtopicDetails.get(subtopic.id);
      console.log(`🔵 Subtopic ${subtopic.id} (${subtopic.name}):`, subDetails);
      return {
        ...subtopic,
        resources: subDetails?.resources || [],
      };
    });

    console.log('🔵 subtopicsWithResources:', subtopicsWithResources);

    setSelectedCourse({
      name: topic.name,
      description: details?.description || "No description available",
      resources: details?.resources || [],
      duration: duration,
      tags: tags,
      subtopics: subtopicsWithResources,
    });
  }, [topicDetails, subtopicDetails]);

  const calculateProgress = () => {
    if (!roadmapData) return 0;
    return Math.round((completedCourses.size / roadmapData.topics.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error || !roadmapData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200 max-w-md shadow-xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/candidate/road-map")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();
  const courses = roadmapData.topics.map((topic, index) => ({
    id: topic.id,
    name: topic.name,
    type: "Online Course",
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-teal-500 via-blue-600 to-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push("/candidate/road-map")}
              className="flex items-center gap-2 text-white hover:text-gray-200 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {/* Toggle Buttons */}
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg p-1">
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors bg-white text-blue-600 shadow-sm"
              >
                <BookOpen className="w-4 h-4" />
                Online Course
              </button>
              <button
                onClick={() => router.push(`/candidate/road-map-flow/${encodeURIComponent(roadmapData.name)}`)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors text-white hover:bg-white/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Road Map Flow
              </button>
            </div>
          </div>

          <div className="mb-2">
            <span className="text-sm opacity-90">Curriculum</span>
          </div>

          <h1 className="text-4xl font-bold mb-6 capitalize">{roadmapData.name}</h1>

          {/* Star Rating */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((star) => (
              <svg
                key={star}
                className="w-5 h-5 text-yellow-400 fill-current"
                viewBox="0 0 20 20"
              >
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            ))}
            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20">
              <path
                fill="currentColor"
                d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
              />
            </svg>
            <span className="ml-2 text-sm">Rate This Course</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Course Progress</span>
            <span className="text-sm font-medium text-gray-700">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-teal-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Course Content Tab */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex gap-6">
              <button className="pb-2 border-b-2 border-blue-600 font-semibold text-blue-600">
                Course Content
              </button>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Course List */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Course Content</h2>
        </div>

        {/* Mandatory Group */}
        <CourseGroup
          title="Mandatory"
          courses={courses}
          completedCourses={completedCourses}
          onToggleComplete={handleToggleComplete}
          isExpanded={expandedGroups.has('mandatory')}
          onToggleExpand={() => handleToggleGroup('mandatory')}
          onCourseClick={(courseId) => {
            const topic = roadmapData.topics.find(t => t.id === courseId);
            if (topic) {
              handleCourseClick(topic);
            }
          }}
          coursesResources={topicDetails}
        />

        {/* Completion Stats */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
              <Award className="w-8 h-8 text-teal-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">Your Progress</h3>
              <p className="text-sm text-gray-600">
                You have completed {completedCourses.size} out of {roadmapData.topics.length} courses
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-teal-600">{progress}%</div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <CourseDetailModal
          course={selectedCourse}
          subtopics={selectedCourse.subtopics}
          subtopicDetails={subtopicDetails}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </div>
  );
}
