"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  X,
  BookOpen,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import ReactFlow, {
  Node as ReactFlowNode,
  Edge as ReactFlowEdge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  MarkerType,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { getCandidateRoadmap, getTopicDetail, getSubtopicDetail, toggleSubtopicStatus } from "@/lib/roadmap-api";
import { useCVStore } from "@/stores/cvStore";

export default function RoadmapFlowPage() {
  const params = useParams();
  const router = useRouter();
  const roadmapName = decodeURIComponent(params.roadmapName as string);
  const currentEditingResumeId = useCVStore((s) => s.currentEditingResumeId);

  // State
  const [roadmapData, setRoadmapData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Detail panel
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [detailContent, setDetailContent] = useState<{
    name: string;
    description: string;
    resources: string[];
    courses: Array<{ id: number; title: string; url: string }>;
    subtopics: Array<{
      id: number;
      name: string;
      description: string;
      courses: Array<{ id: number; title: string; url: string }>;
      resources: string[];
    }>;
  } | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [expandedSubtopics, setExpandedSubtopics] = useState<Set<number>>(new Set());
  const [currentTopicId, setCurrentTopicId] = useState<number | null>(null);

  // Track completed topics (stored in localStorage)
  const [completedTopics, setCompletedTopics] = useState<Set<number>>(new Set());

  // React Flow states
  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState([]);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState([]);

  // Load completed topics from localStorage
  useEffect(() => {
    const storageKey = `roadmap-completed-${roadmapName}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompletedTopics(new Set(parsed));
      } catch (e) {
        console.error('Failed to parse completed topics:', e);
      }
    }
  }, [roadmapName]);

  // Save completed topics to localStorage
  const markTopicComplete = useCallback((topicId: number) => {
    setCompletedTopics(prev => {
      const newSet = new Set(prev);
      newSet.add(topicId);
      const storageKey = `roadmap-completed-${roadmapName}`;
      localStorage.setItem(storageKey, JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  }, [roadmapName]);

  // Fetch roadmap data
  const fetchRoadmapData = useCallback(async () => {
    if (!currentEditingResumeId) {
      setError("Please select a resume in CM Profile first.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const resumeId = parseInt(currentEditingResumeId);
      const response = await getCandidateRoadmap(resumeId, roadmapName);

      if (response.code === 200 && response.result) {
        setRoadmapData(response.result);
      } else {
        setError("Could not load roadmap");
      }
    } catch (err) {
      console.error("Error fetching roadmap:", err);
      setError("Error loading roadmap");
    } finally {
      setIsLoading(false);
    }
  }, [roadmapName, currentEditingResumeId]);

  // Handle subtopic toggle
  const handleSubtopicToggle = useCallback(async (subtopicId: number) => {
    if (!currentEditingResumeId || !currentTopicId) return;

    try {
      const resumeId = parseInt(currentEditingResumeId);

      // Toggle subtopic status
      await toggleSubtopicStatus(resumeId, subtopicId);

      // Close detail panel first
      setShowDetailPanel(false);
      setDetailContent(null);

      // Small delay then fetch fresh data and reopen
      setTimeout(async () => {
        try {
          // Fetch fresh roadmap data
          const response = await getCandidateRoadmap(resumeId, roadmapName);
          if (response.code === 200 && response.result) {
            setRoadmapData(response.result);

            // Now fetch topic details with fresh roadmap data
            const currentTopic = response.result.topics?.find((t: any) => t.id === currentTopicId);
            const roadmapSubtopics = currentTopic?.subtopics || [];

            setShowDetailPanel(true);
            setIsLoadingDetail(true);
            setExpandedSubtopics(new Set());

            const detail = await getTopicDetail(currentTopicId);
            const topicData: any = detail;
            const topicCourses = topicData.courseResponses || [];
            const subtopicsData = topicData.subtopicResponses || [];

            const subtopics = roadmapSubtopics.map((roadmapSub: any) => {
              const apiSub = subtopicsData.find((s: any) => s.id === roadmapSub.id);
              return {
                id: roadmapSub.id,
                name: roadmapSub.name || apiSub?.name || '',
                description: apiSub?.description || roadmapSub.description || '',
                courses: apiSub?.courseResponses || [],
                resources: apiSub?.resourceResponses?.map((r: any) => r.url) || [],
                status: roadmapSub.status || 'NOT_STARTED',
              };
            });

            setDetailContent({
              name: detail.name,
              description: detail.description,
              resources: topicData.resourceResponses?.map((r: any) => r.url) || [],
              courses: topicCourses,
              subtopics: subtopics,
            });
            setIsLoadingDetail(false);
          }
        } catch (error) {
          console.error('Error refetching data:', error);
          setIsLoadingDetail(false);
        }
      }, 100);
    } catch (error) {
      console.error('Error toggling subtopic:', error);
    }
  }, [currentEditingResumeId, currentTopicId, roadmapName]);

  useEffect(() => {
    if (roadmapName) {
      fetchRoadmapData();
    }
  }, [roadmapName, fetchRoadmapData]);

  // Handle topic click
  const handleTopicClick = useCallback(async (topicId: number, isLocked: boolean) => {
    // Prevent clicking on locked topics
    if (isLocked) {
      return;
    }

    setShowDetailPanel(true);
    setIsLoadingDetail(true);
    setDetailContent(null);
    setExpandedSubtopics(new Set()); // Reset expanded subtopics
    setCurrentTopicId(topicId); // Save current topic ID

    try {
      // Find topic in roadmap data to get subtopics
      const currentTopic = roadmapData?.topics?.find((t: any) => t.id === topicId);
      const roadmapSubtopics = currentTopic?.subtopics || [];

      // Get detailed info from API
      const detail = await getTopicDetail(topicId);
      const topicData: any = detail;

      // Get courses from topic
      const topicCourses = topicData.courseResponses || [];

      // Get subtopics with their courses from API
      const subtopicsData = topicData.subtopicResponses || [];

      // Merge subtopics from roadmap data with API data
      const subtopics = roadmapSubtopics.map((roadmapSub: any) => {
        const apiSub = subtopicsData.find((s: any) => s.id === roadmapSub.id);
        return {
          id: roadmapSub.id,
          name: roadmapSub.name || apiSub?.name || '',
          description: apiSub?.description || roadmapSub.description || '',
          courses: apiSub?.courseResponses || [],
          resources: apiSub?.resourceResponses?.map((r: any) => r.url) || [],
          status: roadmapSub.status || 'NOT_STARTED',
        };
      });

      setDetailContent({
        name: detail.name,
        description: detail.description,
        resources: topicData.resourceResponses?.map((r: any) => r.url) || [],
        courses: topicCourses,
        subtopics: subtopics,
      });

      // Auto mark as complete when opened
      markTopicComplete(topicId);
    } catch (error) {
      console.error("Error fetching topic detail:", error);
      setDetailContent({
        name: "Error",
        description: "Không thể tải thông tin chi tiết",
        resources: [],
        courses: [],
        subtopics: [],
      });
    } finally {
      setIsLoadingDetail(false);
    }
  }, [markTopicComplete, roadmapData]);

  // Toggle subtopic expansion and fetch details
  const toggleSubtopic = useCallback(async (index: number, subtopicId: number) => {
    const isCurrentlyExpanded = expandedSubtopics.has(index);

    setExpandedSubtopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });

    // Fetch subtopic details if expanding
    if (!isCurrentlyExpanded && detailContent) {
      try {
        const subtopicDetail = await getSubtopicDetail(subtopicId);

        // Update the subtopic in detailContent with fetched data
        setDetailContent(prev => {
          if (!prev) return prev;

          const updatedSubtopics = prev.subtopics.map((sub: any, idx: number) => {
            if (idx === index) {
              return {
                ...sub,
                description: subtopicDetail.description || sub.description,
                resources: subtopicDetail.resourceResponses?.map((r: any) => r.url) || sub.resources,
              };
            }
            return sub;
          });

          return {
            ...prev,
            subtopics: updatedSubtopics
          };
        });
      } catch (error) {
        console.error('Error fetching subtopic details:', error);
      }
    }
  }, [expandedSubtopics, detailContent]);

  // Build nodes and edges for Reaflow
  const { nodes, edges } = useMemo(() => {
    if (!roadmapData) return { nodes: [], edges: [] };

    const flowNodes: any[] = [];
    const flowEdges: any[] = [];
    const topics: any[] = roadmapData?.topics || [];

    // START node
    flowNodes.push({
      id: "start",
      text: "START",
      data: { type: "start" },
    });

    if (topics.length === 0) {
      flowNodes.push({
        id: "finish",
        text: "FINISH",
        data: { type: "finish" },
      });

      flowEdges.push({
        id: "e-start-finish",
        from: "start",
        to: "finish",
      });

      return { nodes: flowNodes, edges: flowEdges };
    }

    // Topics (ẩn subtopics)
    topics.forEach((topic: any, index: number) => {
      flowNodes.push({
        id: `topic-${topic.id}`,
        text: topic.name,
        data: {
          type: "topic",
          index: index + 1,
          topicId: topic.id,
        },
      });

      const prevId = index === 0 ? "start" : `topic-${topics[index - 1].id}`;
      flowEdges.push({
        id: `e-${prevId}-topic-${topic.id}`,
        from: prevId,
        to: `topic-${topic.id}`,
      });
    });

    // FINISH
    flowNodes.push({
      id: "finish",
      text: "FINISH",
      data: { type: "finish" },
    });

    const lastTopic = topics[topics.length - 1];
    flowEdges.push({
      id: `e-topic-${lastTopic.id}-finish`,
      from: `topic-${lastTopic.id}`,
      to: "finish",
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [roadmapData]);

  // Build nodes and edges for ReactFlow
  useEffect(() => {
    if (!roadmapData) return;

    const flowNodes: ReactFlowNode[] = [];
    const flowEdges: ReactFlowEdge[] = [];
    const topics: any[] = roadmapData?.topics || [];

    // Helper function to check if topic is locked
    const isTopicLocked = (index: number): boolean => {
      return false; // All topics are unlocked (màu xanh)
    };

    // START node - positioned at top left
    flowNodes.push({
      id: "start",
      type: "input",
      position: { x: 50, y: 50 },
      sourcePosition: Position.Right,
      data: { label: "START" },
      style: {
        background: "#fbbf24",
        color: "#fff",
        border: "4px solid #fff",
        borderRadius: "50%",
        width: 100,
        height: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "16px",
        fontWeight: "bold",
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
      },
    });

    if (topics.length === 0) {
      flowNodes.push({
        id: "finish",
        type: "output",
        position: { x: 300, y: 200 },
        data: { label: "FINISH" },
        style: {
          background: "#fbbf24",
          color: "#fff",
          border: "4px solid #fff",
          borderRadius: "50%",
          width: 100,
          height: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          fontWeight: "bold",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        },
      });

      flowEdges.push({
        id: "e-start-finish",
        source: "start",
        target: "finish",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#20619a", strokeWidth: 5 },
        markerEnd: {
          type: MarkerType.Arrow,
          width: 15,
          height: 15,
          color: "#a78bfa",
        },
      });

      setReactFlowNodes(flowNodes);
      setReactFlowEdges(flowEdges);
      return;
    }

    // Topics in zigzag pattern: 3-4-3-4...
    topics.forEach((topic: any, index: number) => {
      // Determine row: row 0 = 3 topics, row 1 = 4 topics, row 2 = 3 topics, etc.
      let currentRow = 0;
      let positionInRow = 0;
      let topicsPerRow = 3;
      let tempIndex = index;

      while (tempIndex >= topicsPerRow) {
        tempIndex -= topicsPerRow;
        currentRow++;
        topicsPerRow = (currentRow % 2 === 0) ? 3 : 4; // Alternate between 3 and 4
      }
      positionInRow = tempIndex;
      topicsPerRow = (currentRow % 2 === 0) ? 3 : 4;

      // Calculate position
      const isEvenRow = currentRow % 2 === 0;
      const HORIZONTAL_SPACING = 300;
      const VERTICAL_SPACING = 250;
      const ROW_OFFSET = 50; // Offset for staggered rows

      let x: number;
      if (isEvenRow) {
        // Even rows (3 topics): left to right (1->2->3)
        x = 300 + (positionInRow * HORIZONTAL_SPACING);
      } else {
        // Odd rows (4 topics): right to left (7<-6<-5<-4)
        x = 200 + ((topicsPerRow - 1 - positionInRow) * HORIZONTAL_SPACING) + ROW_OFFSET;
      }

      const y = 100 + (currentRow * VERTICAL_SPACING);

      // Determine if this is the last topic in current row
      const isLastInRow = positionInRow === topicsPerRow - 1;
      // Determine if this is the first topic in current row
      const isFirstInRow = positionInRow === 0;

      // Set source and target positions based on row direction and position
      let sourcePos = Position.Right;
      let targetPos = Position.Left;

      if (isEvenRow) {
        // Even row: left to right
        sourcePos = isLastInRow ? Position.Bottom : Position.Right;
        targetPos = isFirstInRow && currentRow > 0 ? Position.Top : Position.Left;
      } else {
        // Odd row: right to left
        sourcePos = isLastInRow ? Position.Bottom : Position.Left;
        targetPos = isFirstInRow && currentRow > 0 ? Position.Top : Position.Right;
      }

      const locked = isTopicLocked(index);

      // Check if topic is completed based on subtopics
      const subtopics = topic.subtopics || [];
      const allSubtopicsCompleted = subtopics.length > 0 &&
        subtopics.every((sub: any) => sub.status === 'COMPLETED');
      const isCompleted = allSubtopicsCompleted || completedTopics.has(topic.id);

      flowNodes.push({
        id: `topic-${topic.id}`,
        type: "default",
        position: { x, y },
        sourcePosition: sourcePos,
        targetPosition: targetPos,
        data: {
          label: (
            <div
              className={`flex flex-col items-center gap-1 relative ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => handleTopicClick(topic.id, locked)}
            >
              {locked && (
                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              )}
              {isCompleted && !locked && (
                <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <div className="text-2xl font-bold">{index + 1}</div>
              <div className="text-xs uppercase text-center max-w-[100px]">{topic.name}</div>
            </div>
          )
        },
        style: {
          background: locked ? "#6b7280" : (isCompleted ? "#10b981" : "#20619a"),
          color: "#fff",
          border: "3px solid #fff",
          borderRadius: "12px",
          padding: "12px",
          width: "150px",
          height: "120px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: locked ? "0 2px 6px rgba(0,0,0,0.2)" : "0 4px 12px rgba(32, 97, 154, 0.3)",
          opacity: locked ? 0.6 : 1,
        },
      });

      // Create edges
      if (index === 0) {
        // START -> Topic 1
        flowEdges.push({
          id: `e-start-topic-${topic.id}`,
          source: "start",
          target: `topic-${topic.id}`,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#20619a", strokeWidth: 5 },
          markerEnd: {
            type: MarkerType.Arrow,
            width: 15,
            height: 15,
            color: "#20619a",
          },
        });
      } else {
        const prevTopic = topics[index - 1];

        // Calculate previous topic's row
        let prevRow = 0;
        let prevTopicsPerRow = 3;
        let prevTempIndex = index - 1;

        while (prevTempIndex >= prevTopicsPerRow) {
          prevTempIndex -= prevTopicsPerRow;
          prevRow++;
          prevTopicsPerRow = (prevRow % 2 === 0) ? 3 : 4;
        }

        // Create edge
        flowEdges.push({
          id: `e-topic-${prevTopic.id}-topic-${topic.id}`,
          source: `topic-${prevTopic.id}`,
          target: `topic-${topic.id}`,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#20619a", strokeWidth: 5 },
          markerEnd: {
            type: MarkerType.Arrow,
            width: 15,
            height: 15,
            color: "#20619a",
          },
        });
      }
    });

    // FINISH node - position it after last topic
    let lastRow = 0;
    let lastTopicsPerRow = 3;
    let lastTempIndex = topics.length - 1;

    while (lastTempIndex >= lastTopicsPerRow) {
      lastTempIndex -= lastTopicsPerRow;
      lastRow++;
      lastTopicsPerRow = (lastRow % 2 === 0) ? 3 : 4;
    }

    const lastRowSize = (lastRow % 2 === 0) ? 3 : 4;
    const lastPositionInRow = lastTempIndex;
    const isLastRowEven = lastRow % 2 === 0;

    let finishX: number;
    if (isLastRowEven) {
      // Even row (left to right), finish is to the right of last topic
      finishX = 300 + (lastRowSize * 300);
    } else {
      // Odd row (right to left), finish is to the left of last topic
      finishX = 200 + ((lastRowSize - 1 - lastPositionInRow) * 300) - 300 + 50;
    }
    const finishY = 100 + ((lastRow + 1) * 250);

    flowNodes.push({
      id: "finish",
      type: "output",
      position: { x: finishX, y: finishY },
      data: { label: "FINISH" },
      style: {
        background: "#fbbf24",
        color: "#fff",
        border: "4px solid #fff",
        borderRadius: "50%",
        width: 100,
        height: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "16px",
        fontWeight: "bold",
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
      },
    });

    const lastTopic = topics[topics.length - 1];
    flowEdges.push({
      id: `e-topic-${lastTopic.id}-finish`,
      source: `topic-${lastTopic.id}`,
      target: "finish",
      type: "smoothstep",
      animated: true,
      style: { stroke: "#20619a", strokeWidth: 5 },
      markerEnd: {
        type: MarkerType.Arrow,
        width: 15,
        height: 15,
        color: "#20619a",
      },
    });

    setReactFlowNodes(flowNodes);
    setReactFlowEdges(flowEdges);
  }, [roadmapData, handleTopicClick, completedTopics]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#20619a] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Roadmap is loading...</p>
        </div>
      </div>
    );
  }

  if (error || !roadmapData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error || "Không tìm thấy roadmap"}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-[#20619a]"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/candidate/road-map")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#7cb3fb] to-[#20619a] bg-clip-text text-transparent capitalize">
              {roadmapData.name}
            </h1>
          </div>

          {/* Toggle Buttons */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => router.push(`/candidate/road-map-courses/${encodeURIComponent(roadmapData.name)}`)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:bg-gray-200"
            >
              <BookOpen className="w-4 h-4" />
              Online Course
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors bg-white text-blue-600 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Road Map Flow
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="h-[calc(100vh-73px)] relative bg-gradient-to-br from-slate-50 to-blue-50">
        <ReactFlow
          nodes={reactFlowNodes}
          edges={reactFlowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          fitView
          className="bg-gradient-to-br from-slate-50 to-blue-50"
        >
          <MiniMap
            className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200"
            nodeColor={(node) => {
              if (node.type === 'default') return '#20619a';
              return '#fbbf24';
            }}
          />
          <Controls className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200" />
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            color="#cbd5e1"
          />
        </ReactFlow>

        {/* Detail Panel */}
        {showDetailPanel && (
          <div className="absolute top-0 right-0 w-96 h-full bg-white shadow-2xl z-20 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Topic Details</h2>
              <button
                onClick={() => setShowDetailPanel(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {isLoadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[#20619a] animate-spin" />
                </div>
              ) : detailContent ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {detailContent.name}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {detailContent.description}
                    </p>
                  </div>

                  {detailContent.resources && detailContent.resources.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Learning Resources
                      </h4>
                      <ul className="space-y-2">
                        {detailContent.resources.map((resource, idx) => (
                          <li key={idx}>
                            <a
                              href={resource}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-2 text-[#20619a] hover:text-[#20619ab8] hover:underline group"
                            >
                              <ExternalLink className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span className="text-sm truncate" title={resource}>{resource}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}


                  {detailContent.subtopics && detailContent.subtopics.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Subtopics</h4>
                      <div className="space-y-2">
                        {detailContent.subtopics.map((subtopic: any, idx: number) => {
                          const subtopicStatus = subtopic.status || 'NOT_STARTED';
                          const isCompleted = subtopicStatus === 'COMPLETED';
                          const isInProgress = subtopicStatus === 'IN_PROGRESS';

                          return (
                            <div key={subtopic.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                              <button
                                onClick={() => toggleSubtopic(idx, subtopic.id)}
                                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer"
                                    style={{
                                      backgroundColor: isCompleted ? '#10b981' : isInProgress ? '#f59e0b' : '#fff',
                                      borderColor: isCompleted ? '#10b981' : isInProgress ? '#f59e0b' : '#d1d5db'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSubtopicToggle(subtopic.id);
                                    }}
                                  >
                                    {isCompleted && (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                  {expandedSubtopics.has(idx) ? (
                                    <ChevronDown className="w-4 h-4 text-gray-600" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-600" />
                                  )}
                                  <span className="font-medium text-gray-800 text-left">{subtopic.name}</span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {/* {subtopic.courses?.length || 0} courses */}
                                </span>
                              </button>

                              {expandedSubtopics.has(idx) && (
                                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 space-y-4">
                                  {subtopic.description && (
                                    <div>
                                      <h6 className="text-xs font-bold text-gray-700 mb-2 uppercase">Description</h6>
                                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                        {subtopic.description}
                                      </p>
                                    </div>
                                  )}

                                  {subtopic.resources && subtopic.resources.length > 0 && (
                                    <div>
                                      <h6 className="text-xs font-bold text-gray-700 mb-2 uppercase">Learning Resources</h6>
                                      <div className="space-y-2">
                                        {subtopic.resources.map((url, resIdx) => (
                                          <a
                                            key={resIdx}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-start gap-2 p-2 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors group"
                                          >
                                            <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5 group-hover:text-blue-700" />
                                            <span className="text-sm text-blue-700 group-hover:text-blue-900 truncate flex-1" title={url}>
                                              {url}
                                            </span>
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}


                                  {!subtopic.description && (!subtopic.resources || subtopic.resources.length === 0) && (!subtopic.courses || subtopic.courses.length === 0) && (
                                    <div className="text-center py-6 text-gray-500">
                                      <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                      <p className="text-xs">No information available</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div >
        )
        }
      </div >
    </div >
  );
}

