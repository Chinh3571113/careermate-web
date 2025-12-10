"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Send,
  Sparkles,
  MessageCircle,
  Trophy,
  Target,
  Brain,
  Clock,
  Loader2,
  ChevronRight,
  FileText,
  History,
  PlusCircle,
  ArrowLeft,
  Star,
  Building2,
  Briefcase,
  Calendar,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import CVSidebar from "@/components/layout/CVSidebar";
import { useLayout } from "@/contexts/LayoutContext";
import { useAuthStore } from "@/store/use-auth-store";
import {
  startAIInterview,
  answerQuestion,
  completeAIInterview,
  getAllAIInterviewSessions,
  getAIInterviewSession,
  getNextQuestion,
  getScoreColor,
  getScoreLabel,
  formatSessionDuration,
  type InterviewSessionResponse,
  type NextQuestionResponse
} from "@/lib/ai-interview-api";
import {
  getCandidateUpcomingInterviews,
  getCandidatePastInterviews,
  type InterviewScheduleResponse
} from "@/lib/interview-api";
import { fetchMyJobApplications } from "@/lib/my-jobs-api";
import { fetchLikedJobs, fetchSavedJobs } from "@/lib/job-api";
import api from "@/lib/api";
import React from "react";

// Types for chat messages
type MessageType = 'bot' | 'user' | 'system' | 'score';

interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  questionNumber?: number;
  score?: number;
  feedback?: string;
  isTyping?: boolean;
}

// Interview stages
type InterviewStage = 'start' | 'job-description' | 'interview' | 'completed' | 'history';

type JobSource = 'applied' | 'saved' | 'liked';

interface JobSourceOption {
  jobId: number;
  title: string;
  company?: string;
  description: string;
  source: JobSource;
}

export default function AIInterviewPracticePage() {
  const { headerHeight } = useLayout();
  const router = useRouter();
  const { candidateId, fetchCandidateProfile } = useAuthStore();
  
  // Stage management
  const [stage, setStage] = useState<InterviewStage>('start');
  
  // Job description input
  const [jobDescription, setJobDescription] = useState('');
  const [jobOptions, setJobOptions] = useState<JobSourceOption[]>([]);
  const [loadingJobOptions, setLoadingJobOptions] = useState(false);
  const [redirectingToJobs, setRedirectingToJobs] = useState(false);
  
  // Interview session state
  const [session, setSession] = useState<InterviewSessionResponse | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<NextQuestionResponse | null>(null);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Chat messages for interview
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Reference to chat container for scroll control
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Past sessions
  const [pastSessions, setPastSessions] = useState<InterviewSessionResponse[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedSession, setSelectedSession] = useState<InterviewSessionResponse | null>(null);
  
  // Ongoing sessions (for quick resume)
  const [ongoingSessions, setOngoingSessions] = useState<InterviewSessionResponse[]>([]);
  
  // Candidate interviews for job selection
  const [showInterviewSelector, setShowInterviewSelector] = useState(false);
  const [candidateInterviews, setCandidateInterviews] = useState<InterviewScheduleResponse[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>('');
  
  // Auto-scroll chat container (not the whole page) when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Ensure candidate profile is loaded so we can fetch personalized job sources
  useEffect(() => {
    const ensureCandidate = async () => {
      if (!candidateId) {
        try {
          await fetchCandidateProfile();
        } catch (error) {
          console.error('Failed to load candidate profile:', error);
        }
      }
    };

    ensureCandidate();
  }, [candidateId, fetchCandidateProfile]);
  
  // Focus input after bot message
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].type === 'bot' && !messages[messages.length - 1].isTyping) {
      inputRef.current?.focus();
    }
  }, [messages]);
  
  // Load ongoing sessions on mount to show "Continue" option
  useEffect(() => {
    const loadOngoingSessions = async () => {
      try {
        const sessions = await getAllAIInterviewSessions();
        const ongoing = sessions.filter(s => s.status === 'ONGOING');
        setOngoingSessions(ongoing);
      } catch (error) {
        console.error('Failed to load ongoing sessions:', error);
      }
    };
    loadOngoingSessions();
  }, []);

  // Load candidate's interviews
  const loadCandidateInterviews = useCallback(async () => {
    try {
      setLoadingInterviews(true);
      const [upcoming, past] = await Promise.all([
        getCandidateUpcomingInterviews(),
        getCandidatePastInterviews()
      ]);
      // Combine and deduplicate by job
      const allInterviews = [...upcoming, ...past];
      setCandidateInterviews(allInterviews);
    } catch (error: unknown) {
      console.error('Failed to load interviews:', error);
      toast.error('Failed to load your interviews');
    } finally {
      setLoadingInterviews(false);
    }
  }, []);

  const fetchJobDescriptionByJobId = useCallback(async (jobId: number) => {
    try {
      const response = await api.get(`/api/job-postings/${jobId}`);
      const job = response.data?.result;
      if (!job) return null;

      const rawDescription = job.description || job.jobDescription;
      const description = Array.isArray(rawDescription)
        ? rawDescription.join('\n')
        : rawDescription || '';

      if (!description) return null;

      return {
        title: job.title || job.jobTitle || 'Job Posting',
        company: job.recruiterInfo?.companyName || job.companyName || job.employerName,
        description,
      };
    } catch (error) {
      console.error(`Failed to fetch job description for job ${jobId}:`, error);
      return null;
    }
  }, []);

  const loadJobOptions = useCallback(async () => {
    if (!candidateId) return;

    setLoadingJobOptions(true);
    try {
      const options: JobSourceOption[] = [];
      const seen = new Set<number>();

      // Recent applications
      const applications = await fetchMyJobApplications(candidateId);
      applications.forEach((app) => {
        if (!app.jobPostingId || !app.jobDescription || seen.has(app.jobPostingId)) return;
        options.push({
          jobId: app.jobPostingId,
          title: app.jobTitle || 'Applied Job',
          company: app.companyName,
          description: app.jobDescription,
          source: 'applied',
        });
        seen.add(app.jobPostingId);
      });

      // Saved and liked jobs
      const [savedJobs, likedJobs] = await Promise.all([
        fetchSavedJobs(candidateId),
        fetchLikedJobs(candidateId),
      ]);

      const savedMap = new Map(savedJobs.map((job) => [job.jobId, job]));
      const likedMap = new Map(likedJobs.map((job) => [job.jobId, job]));
      const savedLikedIds = Array.from(new Set<number>([
        ...savedMap.keys(),
        ...likedMap.keys(),
      ]));

      for (const jobId of savedLikedIds) {
        if (seen.has(jobId)) continue;
        const detail = await fetchJobDescriptionByJobId(jobId);
        if (!detail) continue;

        options.push({
          jobId,
          title: detail.title || savedMap.get(jobId)?.jobTitle || likedMap.get(jobId)?.jobTitle || 'Job Posting',
          company: detail.company,
          description: detail.description,
          source: savedMap.has(jobId) ? 'saved' : 'liked',
        });
        seen.add(jobId);
      }

      setJobOptions(options);

      if (options.length === 0) {
        setRedirectingToJobs(true);
        setTimeout(() => router.push('/jobs-list'), 800);
      } else {
        setRedirectingToJobs(false);
      }
    } catch (error) {
      console.error('Failed to load job descriptions for AI practice:', error);
      toast.error('Unable to load job descriptions right now');
    } finally {
      setLoadingJobOptions(false);
    }
  }, [candidateId, fetchJobDescriptionByJobId, router]);

  useEffect(() => {
    if (candidateId) {
      loadJobOptions();
    }
  }, [candidateId, loadJobOptions]);
  
  // Fetch job description from job post
  const fetchJobDescription = async (interview: InterviewScheduleResponse) => {
    try {
      setIsLoading(true);
      // Get job apply details to get the job description (singular: job-apply)
      const jobApplyResponse = await api.get(`/api/job-apply/${interview.jobApplyId}`);
      const jobApply = jobApplyResponse.data.result;
      
      console.log('Job Apply Response:', jobApply);
      
      // JobApplyResponse has jobDescription directly, not nested in jobPost
      if (jobApply?.jobDescription) {
        setJobDescription(jobApply.jobDescription);
        setSelectedJobTitle(jobApply.jobTitle || interview.jobTitle || interview.positionTitle || 'Selected Position');
        setShowInterviewSelector(false);
        toast.success(`Loaded job description for "${jobApply.jobTitle || interview.jobTitle || 'Selected Position'}"`);
      } else {
        toast.error('Could not find job description for this interview');
      }
    } catch (error: unknown) {
      console.error('Failed to fetch job description:', error);
      toast.error('Failed to load job description');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add a bot message with typing effect
  const addBotMessage = useCallback((content: string, extras?: Partial<ChatMessage>) => {
    const id = `bot-${Date.now()}`;
    
    // First add typing indicator
    setMessages(prev => [...prev, {
      id,
      type: 'bot',
      content: '',
      timestamp: new Date(),
      isTyping: true,
      ...extras
    }]);
    
    // Then reveal the message after a short delay
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === id ? { ...msg, content, isTyping: false } : msg
      ));
    }, 600 + Math.random() * 400);
  }, []);
  
  // Add user message
  const addUserMessage = useCallback((content: string) => {
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date()
    }]);
  }, []);
  
  // Add score message
  const addScoreMessage = useCallback((score: number, feedback: string, questionNumber: number) => {
    setMessages(prev => [...prev, {
      id: `score-${Date.now()}`,
      type: 'score',
      content: feedback,
      timestamp: new Date(),
      score,
      questionNumber,
      feedback
    }]);
  }, []);
  
  // Load past sessions
  const loadPastSessions = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const sessions = await getAllAIInterviewSessions();
      setPastSessions(sessions);
    } catch (error: unknown) {
      console.error('Failed to load past sessions:', error);
      toast.error('Failed to load interview history');
    } finally {
      setLoadingHistory(false);
    }
  }, []);
  
  // Start a new interview
  const handleStartInterview = async () => {
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }
    
    try {
      setIsLoading(true);
      setMessages([]);
      setCurrentQuestion(null);
      setSession(null);
      
      console.log('🚀 [START INTERVIEW] Starting AI interview...');
      const sessionData = await startAIInterview({ jobDescription: jobDescription.trim() });
      console.log('✅ [START INTERVIEW] Session data:', sessionData);
      
      // Set the session
      setSession(sessionData);
      
      // Switch to interview stage first
      setStage('interview');
      
      // Try to get first question from response, or fallback to getNextQuestion API
      let firstQuestionData: NextQuestionResponse | null = null;
      
      if (sessionData.questions && sessionData.questions.length > 0) {
        // Questions included in response (ideal case)
        const firstQ = sessionData.questions[0];
        console.log('📝 [START INTERVIEW] First question from response:', firstQ);
        
        firstQuestionData = {
          questionId: firstQ.questionId,
          questionNumber: firstQ.questionNumber,
          question: firstQ.question,
          isLastQuestion: sessionData.questions.length === 1
        };
      } else {
        // Fallback: Call getNextQuestion API
        console.log('⚠️ [START INTERVIEW] No questions in response, calling getNextQuestion API...');
        try {
          const { getNextQuestion } = await import('@/lib/ai-interview-api');
          firstQuestionData = await getNextQuestion(sessionData.sessionId);
          console.log('📝 [START INTERVIEW] First question from API:', firstQuestionData);
        } catch (err) {
          console.error('❌ [START INTERVIEW] Failed to get first question:', err);
          toast.error('Failed to load questions. Please try again.');
          setStage('job-description');
          return;
        }
      }
      
      if (!firstQuestionData || firstQuestionData.questionId === -1) {
        console.error('❌ [START INTERVIEW] No valid question found');
        toast.error('Failed to generate questions. Please try again.');
        setStage('job-description');
        return;
      }
      
      setCurrentQuestion(firstQuestionData);
      
      // Add welcome message immediately
      const welcomeId = `bot-welcome-${Date.now()}`;
      const welcomeMsg: ChatMessage = {
        id: welcomeId,
        type: 'bot',
        content: "Hello! 👋 Welcome to your AI interview practice session. I'll be your interviewer today.\n\nI'll ask you 10 questions based on the job description. Take your time with each answer - quality matters more than speed.\n\nReady? Let's begin!",
        timestamp: new Date(),
        isTyping: false
      };
      
      // Add first question after a delay
      const questionId = `bot-q1-${Date.now()}`;
      const questionMsg: ChatMessage = {
        id: questionId,
        type: 'bot',
        content: `Question ${firstQuestionData.questionNumber} of 10:\n\n${firstQuestionData.question}`,
        timestamp: new Date(),
        questionNumber: firstQuestionData.questionNumber,
        isTyping: false
      };
      
      // Set messages with delay for better UX
      setTimeout(() => {
        setMessages([welcomeMsg]);
      }, 300);
      
      setTimeout(() => {
        setMessages(prev => [...prev, questionMsg]);
        // Focus the input after question is shown
        inputRef.current?.focus();
      }, 1500);
      
      toast.success('Interview session started!');
    } catch (error: unknown) {
      console.error('❌ [START INTERVIEW] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start interview session';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Submit an answer
  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !session || !currentQuestion) return;
    
    try {
      setIsSubmitting(true);
      
      // Add user's answer to chat
      addUserMessage(answer.trim());
      
      const answerText = answer.trim();
      setAnswer('');
      
      // Submit answer and get score
      const result = await answerQuestion(session.sessionId, currentQuestion.questionId, {
        answer: answerText
      });
      
      // Refresh session to get updated scores
      const updatedSession = await getAIInterviewSession(session.sessionId);
      setSession(updatedSession);
      
      // Find the answered question's score
      const answeredQ = updatedSession.questions.find(
        q => q.questionId === currentQuestion.questionId
      );
      
      if (answeredQ && answeredQ.score !== undefined) {
        // Add score feedback
        setTimeout(() => {
          addScoreMessage(answeredQ.score!, answeredQ.feedback || '', currentQuestion.questionNumber);
        }, 500);
      }
      
      // Check if this was the last question
      if (result.isLastQuestion || currentQuestion.questionNumber >= 10) {
        // Show completion message
        setTimeout(() => {
          addBotMessage("🎉 Excellent work! You've completed all 10 questions.\n\nI'm now preparing your comprehensive performance report...");
        }, 2000);
        
        // Complete the interview
        setTimeout(async () => {
          try {
            const completedSession = await completeAIInterview(session.sessionId);
            setSession(completedSession);
            setStage('completed');
          } catch {
            toast.error('Failed to generate report');
          }
        }, 3500);
      } else {
        // Move to next question
        setCurrentQuestion({
          questionId: result.questionId,
          questionNumber: result.questionNumber,
          question: result.question,
          isLastQuestion: result.isLastQuestion
        });
        
        // Add next question to chat
        setTimeout(() => {
          addBotMessage(`Question ${result.questionNumber} of 10:\n\n${result.question}`);
        }, 2000);
      }
      
    } catch (error: unknown) {
      console.error('Failed to submit answer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit answer';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // View a past session
  const handleViewSession = async (sessionId: number) => {
    try {
      setLoadingHistory(true);
      const sessionData = await getAIInterviewSession(sessionId);
      setSelectedSession(sessionData);
    } catch {
      toast.error('Failed to load session details');
    } finally {
      setLoadingHistory(false);
    }
  };
  
  // Continue an ongoing session
  const handleContinueSession = async (sessionId: number) => {
    try {
      setIsLoading(true);
      setMessages([]);
      
      // Fetch session with all questions
      const sessionData = await getAIInterviewSession(sessionId);
      setSession(sessionData);
      setJobDescription(sessionData.jobDescription);
      
      // Rebuild chat history from answered questions
      const answeredQuestions = sessionData.questions?.filter(q => q.candidateAnswer) || [];
      for (const q of answeredQuestions) {
        // Add the question message
        addBotMessage(`Question ${q.questionNumber} of 10:\n\n${q.question}`);
        // Add user's answer
        addUserMessage(q.candidateAnswer!);
        // Add score feedback if available
        if (q.score !== undefined && q.feedback) {
          addScoreMessage(q.score, q.feedback, q.questionNumber);
        }
      }
      
      // Get the next unanswered question
      try {
        const nextQ = await getNextQuestion(sessionId);
        setCurrentQuestion(nextQ);
        
        // Add small delay then show the next question
        setTimeout(() => {
          addBotMessage(`Question ${nextQ.questionNumber} of 10:\n\n${nextQ.question}`);
        }, 500);
      } catch (error: unknown) {
        console.error('Error getting next question:', error);
        // If no more questions, complete the session
        toast.info('All questions answered. Completing session...');
        const completedSession = await completeAIInterview(sessionId);
        setSession(completedSession);
        setStage('completed');
        return;
      }
      
      // Switch to interview stage
      setStage('interview');
      setSelectedSession(null);
      toast.success('Resuming your interview session');
      
    } catch (error: unknown) {
      console.error('Failed to continue session:', error);
      toast.error('Failed to continue session');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset to start screen
  const handleReset = () => {
    setStage('start');
    setJobDescription('');
    setSession(null);
    setCurrentQuestion(null);
    setMessages([]);
    setAnswer('');
    setSelectedSession(null);
    setSelectedJobTitle('');
  };

  const handleOpenJobSelection = () => {
    if (candidateId && !jobOptions.length && !loadingJobOptions) {
      loadJobOptions();
    }

    setStage('job-description');

    if (jobOptions.length === 0 && !loadingJobOptions) {
      setRedirectingToJobs(true);
      setTimeout(() => router.push('/jobs-list'), 600);
    }
  };

  const renderReportContent = (report: string) => {
    const lines = report.split('\n').map((line) => line.trim()).filter(Boolean);
    const blocks: React.ReactNode[] = [];
    let listBuffer: string[] = [];

    const flushList = () => {
      if (listBuffer.length === 0) return;
      blocks.push(
        <ul className="space-y-2" key={`list-${blocks.length}`}>
          {listBuffer.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
              <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
              <span className="flex-1">{item}</span>
            </li>
          ))}
        </ul>
      );
      listBuffer = [];
    };

    lines.forEach((line) => {
      const clean = line.replace(/^\*\*|\*\*$/g, '');
      const isHeading = line.startsWith('**') && line.endsWith('**') && line.length > 4;
      const isBullet = line.startsWith('- ') || line.startsWith('• ');

      if (isHeading) {
        flushList();
        blocks.push(
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900" key={`h-${blocks.length}`}>
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[11px]">◆</span>
            {clean}
          </div>
        );
        return;
      }

      if (isBullet) {
        listBuffer.push(clean.replace(/^(-|•)\s*/, ''));
        return;
      }

      flushList();
      blocks.push(
        <p className="text-sm text-slate-700 leading-relaxed bg-white/70 border border-slate-100 rounded-lg px-3 py-2" key={`p-${blocks.length}`}>
          {clean}
        </p>
      );
    });

    flushList();
    return <div className="space-y-3">{blocks}</div>;
  };
  
  // Render start screen
  const renderStartScreen = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Hero Section */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-lg"
        >
          <Bot className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI Interview Practice
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Practice your interview skills with our AI-powered mock interviewer. 
          Get personalized questions and instant feedback on your answers.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Brain, title: "Smart Questions", desc: "AI generates relevant interview questions based on the job" },
          { icon: Target, title: "Instant Scoring", desc: "Get scored 0-10 on each answer with detailed feedback" },
          { icon: Trophy, title: "Final Report", desc: "Comprehensive report with strengths & areas to improve" }
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
          >
            <Card className="border-2 border-transparent hover:border-blue-200 transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Ongoing Sessions Alert */}
      {ongoingSessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="border-2 border-yellow-300 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-yellow-700" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-1">
                    Continue Where You Left Off
                  </h3>
                  <p className="text-sm text-yellow-700 mb-3">
                    You have {ongoingSessions.length} unfinished interview session{ongoingSessions.length > 1 ? 's' : ''}.
                  </p>
                  <div className="space-y-2">
                    {ongoingSessions.slice(0, 3).map((s) => (
                      <div 
                        key={s.sessionId}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200"
                      >
                        <div className="flex items-center gap-3">
                          <MessageCircle className="w-5 h-5 text-yellow-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Session #{s.sessionId}
                            </p>
                            <p className="text-xs text-gray-500">
                              {s.questions?.filter(q => q.candidateAnswer).length || 0}/10 questions answered
                              {' • '}
                              {new Date(s.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleContinueSession(s.sessionId)}
                          disabled={isLoading}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              Continue
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          size="lg"
          onClick={handleOpenJobSelection}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Start New Practice
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            setStage('history');
            loadPastSessions();
          }}
        >
          <History className="w-5 h-5 mr-2" />
          View Past Sessions
        </Button>
      </div>
    </motion.div>
  );

  // Render job description input screen
  const renderJobDescriptionScreen = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-3xl mx-auto"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setStage('start')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back
      </Button>
      
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Job Description
          </CardTitle>
          <CardDescription>
            Enter the job description you want to practice for, or select from your scheduled interviews.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Select from Interviews */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Have an upcoming interview?</h4>
                  <p className="text-sm text-gray-600">Practice with the actual job description</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  if (!jobOptions.length && !loadingJobOptions) {
                    loadJobOptions();
                  }
                  setShowInterviewSelector(true);
                }}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Select Interview
              </Button>
            </div>
            {selectedJobTitle && (
              <div className="mt-3 p-2 bg-white rounded-lg border border-blue-200 flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                  Selected
                </Badge>
                <span className="text-sm font-medium text-gray-900">{selectedJobTitle}</span>
              </div>
            )}
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Select from your jobs</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Pick a job description</h4>
                <p className="text-sm text-gray-600">Use your applied, liked, or saved jobs to practice.</p>
              </div>
              {loadingJobOptions && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
            </div>

            {redirectingToJobs ? (
              <div className="py-10 text-center text-gray-500">
                Redirecting to All Jobs...
              </div>
            ) : loadingJobOptions ? (
              <div className="py-10 text-center text-gray-500">Loading job descriptions...</div>
            ) : jobOptions.length === 0 ? (
              <div className="py-10 text-center text-gray-500">
                No job descriptions found from your activity.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {jobOptions.slice(0, 4).map((option) => (
                  <button
                    key={`${option.source}-${option.jobId}`}
                    type="button"
                    onClick={() => {
                      setJobDescription(option.description);
                      setSelectedJobTitle(`${option.title}${option.company ? ` • ${option.company}` : ''}`);
                    }}
                    className="w-full p-4 text-left border rounded-xl hover:border-blue-400 hover:shadow-sm transition bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900 line-clamp-1">{option.title}</p>
                        {option.company && (
                          <p className="text-sm text-gray-600 line-clamp-1">{option.company}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                          {option.description.substring(0, 180)}{option.description.length > 180 ? '...' : ''}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs uppercase">
                        {option.source}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-800">Selected Job Description</p>
              {selectedJobTitle && <Badge variant="outline">{selectedJobTitle}</Badge>}
            </div>
            <Textarea
              placeholder="Select a job to load its description"
              value={jobDescription}
              readOnly
              disabled
              className="min-h-[200px] resize-none bg-gray-50 cursor-not-allowed"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {jobDescription.length} characters
            </p>
            <Button
              onClick={handleStartInterview}
              disabled={!jobDescription.trim() || isLoading || redirectingToJobs}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Interview
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Job Selector Dialog */}
      <Dialog open={showInterviewSelector} onOpenChange={setShowInterviewSelector}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Select a Job
            </DialogTitle>
            <DialogDescription>
              Choose from your applied, liked, or saved jobs to practice with the actual description.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-2">
            {loadingJobOptions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : jobOptions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No job activity found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Browse jobs to start practicing.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {jobOptions.map((option) => (
                  <button
                    key={`${option.source}-modal-${option.jobId}`}
                    onClick={() => {
                      setJobDescription(option.description);
                      setSelectedJobTitle(`${option.title}${option.company ? ` • ${option.company}` : ''}`);
                      setShowInterviewSelector(false);
                    }}
                    disabled={isLoading}
                    className="w-full p-4 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all text-left group disabled:opacity-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate group-hover:text-blue-700">
                          {option.title}
                        </h4>
                        {option.company && (
                          <p className="text-sm text-gray-600 truncate">
                            {option.company}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {option.description.substring(0, 200)}{option.description.length > 200 ? '...' : ''}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs uppercase">
                            {option.source}
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );

  // Render chat interface during interview - MESSENGER STYLE BUBBLE UI
  const renderInterviewScreen = () => {
    // Debug log to check state
    console.log('🎯 [RENDER INTERVIEW]', { 
      hasSession: !!session, 
      sessionId: session?.sessionId,
      hasCurrentQuestion: !!currentQuestion,
      currentQuestionId: currentQuestion?.questionId,
      messagesCount: messages.length,
      isSubmitting,
      answer: answer.substring(0, 50)
    });
    
    return (
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-220px)]">
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-2xl text-white">
          <div className="relative">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">AI Interviewer</h3>
            <p className="text-xs text-white/80">Powered by Gemini • Online</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">
              {currentQuestion?.questionNumber || 1}/10
            </div>
            <Progress 
              value={(currentQuestion?.questionNumber || 1) * 10} 
              className="w-20 h-1.5 mt-1 bg-white/20"
            />
          </div>
        </div>

        {/* Chat Messages - Messenger Style */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto bg-gray-100 p-4 space-y-3"
        >
          {/* Loading state when no messages yet */}
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Preparing your interview questions...</p>
              </div>
            </div>
          )}
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'system' ? (
                  <div className="w-full text-center my-2">
                    <span className="inline-block px-4 py-1.5 bg-gray-200 text-gray-600 rounded-full text-xs">
                      {message.content}
                    </span>
                  </div>
                ) : message.type === 'score' ? (
                  // Score Feedback Bubble
                  <div className="flex items-end gap-2 max-w-[80%]">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getScoreColor(message.score!)}`}>
                          {message.score}/10
                        </span>
                        <span className="text-xs text-blue-600 font-medium">
                          {getScoreLabel(message.score!)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{message.feedback}</p>
                    </div>
                  </div>
                ) : message.type === 'bot' ? (
                  // Bot Message Bubble
                  <div className="flex items-end gap-2 max-w-[80%]">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      {message.isTyping ? (
                        <div className="flex items-center gap-1 py-1 px-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      ) : (
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  // User Message Bubble
                  <div className="flex items-end gap-2 max-w-[80%]">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
                      <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input Area - Messenger Style */}
        <div className="bg-white border-t px-4 py-3 rounded-b-2xl shadow-lg">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <Textarea
                ref={inputRef}
                placeholder={currentQuestion ? "Type your answer..." : "Waiting for question..."}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && answer.trim() && currentQuestion && !isSubmitting) {
                    e.preventDefault();
                    handleSubmitAnswer();
                  }
                }}
                className="min-h-[48px] max-h-[120px] resize-none pr-4 rounded-2xl border-gray-200 focus:border-blue-400 focus:ring-blue-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || !currentQuestion}
                rows={1}
                autoFocus
              />
            </div>
            <Button
              onClick={handleSubmitAnswer}
              disabled={!answer.trim() || isSubmitting || !currentQuestion}
              size="icon"
              className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 text-center">
            {currentQuestion 
              ? "Press Enter to send • Shift + Enter for new line" 
              : "Please wait for the question to load..."}
          </p>
        </div>
      </div>
    );
  };

  // Render completed screen with results
  const renderCompletedScreen = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto"
    >
      {/* Success Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-4 shadow-lg"
        >
          <Trophy className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Interview Complete! 🎉
        </h1>
        <p className="text-gray-600">
          Great job completing your practice session. Here&apos;s your performance summary.
        </p>
      </div>

      {/* Score Card */}
      <Card className="mb-6 border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600">
                {session?.averageScore?.toFixed(1) || '0.0'}
              </div>
              <div className="text-sm text-gray-600 mt-1">Average Score</div>
            </div>
            <div className="h-16 w-px bg-gray-200 hidden sm:block" />
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600">
                {session?.questions?.length || 10}
              </div>
              <div className="text-sm text-gray-600 mt-1">Questions Answered</div>
            </div>
            <div className="h-16 w-px bg-gray-200 hidden sm:block" />
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {session ? formatSessionDuration(session.createdAt, session.completedAt) : '-'}
              </div>
              <div className="text-sm text-gray-600 mt-1">Duration</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Report and Questions */}
      <Tabs defaultValue="report" className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="report">
            <FileText className="w-4 h-4 mr-2" />
            Final Report
          </TabsTrigger>
          <TabsTrigger value="questions">
            <MessageCircle className="w-4 h-4 mr-2" />
            All Questions & Scores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="report">
          <Card className="bg-gradient-to-br from-slate-50 to-white border-slate-200 shadow-sm">
            <CardContent className="pt-6 space-y-4">
              {session?.finalReport ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase text-slate-500 tracking-[0.08em]">AI Summary</p>
                      <h3 className="text-lg font-semibold text-slate-900">Performance Overview</h3>
                      <p className="text-xs text-slate-500 mt-1">Auto-generated from your answers</p>
                    </div>
                    <Badge variant="outline" className="text-xs bg-white text-slate-700 border-slate-200">Auto-generated</Badge>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                    {renderReportContent(session.finalReport)}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Report not available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions">
          <Card>
            <CardContent className="pt-6 space-y-6">
              {session?.questions?.map((q) => (
                <div key={q.questionId} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      Question {q.questionNumber}
                    </h4>
                    {q.score !== undefined && (
                      <Badge className={getScoreColor(q.score)}>
                        {q.score}/10
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-700 mb-3">{q.question}</p>
                  
                  {q.candidateAnswer && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-500 mb-1">Your Answer:</p>
                      <p className="text-sm text-gray-700">{q.candidateAnswer}</p>
                    </div>
                  )}
                  
                  {q.feedback && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-600 mb-1">AI Feedback:</p>
                      <p className="text-sm text-gray-700">{q.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button
          size="lg"
          onClick={handleReset}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Start New Practice
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            setStage('history');
            loadPastSessions();
          }}
        >
          <History className="w-5 h-5 mr-2" />
          View All Sessions
        </Button>
      </div>
    </motion.div>
  );

  // Render history screen
  const renderHistoryScreen = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setStage('start');
          setSelectedSession(null);
        }}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Start
      </Button>

      {selectedSession ? (
        // Show selected session details
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedSession(null)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to List
          </Button>
          
          {/* Session Details */}
          <Card className="mb-6 bg-gradient-to-br from-slate-50 to-white border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Session #{selectedSession.sessionId}</CardTitle>
                  <CardDescription>
                    {new Date(selectedSession.createdAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </CardDescription>
                </div>
                <Badge className={selectedSession.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                  {selectedSession.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Continue Button for ONGOING sessions */}
              {selectedSession.status === 'ONGOING' && (
                <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-yellow-800">Session In Progress</h4>
                      <p className="text-sm text-yellow-700">
                        You have answered {selectedSession.questions?.filter(q => q.candidateAnswer).length || 0} of 10 questions.
                        Continue where you left off!
                      </p>
                    </div>
                    <Button
                      onClick={() => handleContinueSession(selectedSession.sessionId)}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <ChevronRight className="w-4 h-4 mr-1" />
                      )}
                      Continue Interview
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 mb-6">
                {[{
                  label: 'Avg Score',
                  value: selectedSession.averageScore?.toFixed(1) || '-',
                  color: 'text-green-600'
                }, {
                  label: 'Questions',
                  value: selectedSession.questions?.length || 0,
                  color: 'text-blue-600'
                }, {
                  label: 'Duration',
                  value: formatSessionDuration(selectedSession.createdAt, selectedSession.completedAt),
                  color: 'text-blue-600'
                }].map((item, idx) => (
                  <div key={idx} className="text-center p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <div className={`text-2xl font-bold ${item.color}`}>
                      {item.value}
                    </div>
                    <div className="text-sm text-slate-600">{item.label}</div>
                  </div>
                ))}
              </div>
              
              {/* Job Description Preview */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">Job Description</h4>
                <div className="bg-white rounded-xl border border-slate-200 p-4 max-h-32 overflow-y-auto text-sm text-slate-700 whitespace-pre-wrap">
                  {selectedSession.jobDescription}
                </div>
              </div>
              
              {/* Final Report */}
              {selectedSession.finalReport && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">Final Report</h4>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                    {renderReportContent(selectedSession.finalReport)}
                  </div>
                </div>
              )}
              
              {/* Questions */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Questions & Answers</h4>
                <div className="space-y-4">
                  {selectedSession.questions?.map((q) => (
                    <div key={q.questionId} className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-semibold text-slate-900">Q{q.questionNumber}</span>
                        {q.score !== undefined && (
                          <Badge className={getScoreColor(q.score)}>
                            {q.score}/10
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-800 mb-3 leading-relaxed">{q.question}</p>
                      {q.candidateAnswer && (
                        <div className="bg-slate-50 rounded-lg p-3 mb-2 border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">Your answer</p>
                          <p className="text-sm text-slate-800 leading-relaxed">{q.candidateAnswer}</p>
                        </div>
                      )}
                      {q.feedback && (
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <p className="text-xs text-blue-700 mb-1">AI Feedback</p>
                          <p className="text-sm text-slate-800 leading-relaxed">{q.feedback}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Show session list
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              Interview Practice History
            </CardTitle>
            <CardDescription>
              View your past interview practice sessions and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : pastSessions.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Practice Sessions Yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Start your first AI interview practice to see it here
                </p>
                <Button onClick={() => setStage('start')}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Start Practice
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {pastSessions.map((s) => (
                  <div
                    key={s.sessionId}
                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div 
                      className="flex items-center gap-4 flex-1 cursor-pointer"
                      onClick={() => handleViewSession(s.sessionId)}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        s.status === 'ONGOING' ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                        <MessageCircle className={`w-5 h-5 ${
                          s.status === 'ONGOING' ? 'text-yellow-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Session #{s.sessionId}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {new Date(s.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                          {s.status === 'ONGOING' && (
                            <span className="ml-2 text-yellow-600 font-medium">
                              • {s.questions?.filter(q => q.candidateAnswer).length || 0}/10 answered
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {s.averageScore !== undefined && s.status === 'COMPLETED' && (
                        <Badge className={getScoreColor(s.averageScore)}>
                          {s.averageScore.toFixed(1)}/10
                        </Badge>
                      )}
                      <Badge variant={s.status === 'COMPLETED' ? 'default' : 'secondary'} className={
                        s.status === 'ONGOING' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' : ''
                      }>
                        {s.status}
                      </Badge>
                      {s.status === 'ONGOING' ? (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContinueSession(s.sessionId);
                          }}
                          disabled={isLoading}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <ChevronRight className="w-4 h-4 mr-1" />
                              Continue
                            </>
                          )}
                        </Button>
                      ) : (
                        <ChevronRight 
                          className="w-5 h-5 text-gray-400 cursor-pointer" 
                          onClick={() => handleViewSession(s.sessionId)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <div
        className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-6 items-start transition-all duration-300"
        style={{
          ["--sticky-offset" as string]: `${headerHeight || 0}px`,
          ["--content-pad" as string]: "24px",
        }}
      >
        {/* Sidebar */}
        <aside className="hidden lg:block sticky [top:calc(var(--sticky-offset)+var(--content-pad))] self-start transition-all duration-300">
          <CVSidebar activePage="interview-practice" />
        </aside>

        {/* Main Content */}
        <section className="min-w-0 transition-all duration-300">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {stage === 'start' && renderStartScreen()}
            {stage === 'job-description' && renderJobDescriptionScreen()}
            {stage === 'interview' && renderInterviewScreen()}
            {stage === 'completed' && renderCompletedScreen()}
            {stage === 'history' && renderHistoryScreen()}
          </div>
        </section>
      </div>
    </main>
  );
}
