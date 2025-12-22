"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  TrendingUp,
  FileText,
  Award,
  Layout,
  BookOpen,
  Palette,
  Lightbulb,
  Target,
  Download
} from "lucide-react";
import { CVATSAnalyzeResponse } from "@/types/cv-ats";
import CVSidebar from "@/components/layout/CVSidebar";
import toast from "react-hot-toast";

// Radar Chart Component
function RadarChart({
  data
}: {
  data: { label: string; value: number; color: string }[]
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 60;
    const angleStep = (Math.PI * 2) / data.length;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background circles
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      const r = (radius * i) / 5;
      for (let j = 0; j <= data.length; j++) {
        const angle = j * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Draw axis lines
    ctx.strokeStyle = '#d1d5db';
    data.forEach((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );
      ctx.stroke();
    });

    // Draw data polygon
    ctx.beginPath();
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    data.forEach((item, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = (radius * item.value) / 100;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw data points
    data.forEach((item, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = (radius * item.value) / 100;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = item.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw labels
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    data.forEach((item, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const labelRadius = radius + 35;
      const x = centerX + Math.cos(angle) * labelRadius;
      const y = centerY + Math.sin(angle) * labelRadius;

      // Draw colored dot
      ctx.beginPath();
      ctx.arc(x + 25, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = item.color;
      ctx.fill();

      // Draw label text
      ctx.fillStyle = '#374151';
      ctx.fillText(item.label, x, y);
    });

  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={320}
      className="mx-auto"
    />
  );
}

export default function AICVResult() {
  const router = useRouter();
  const [result, setResult] = useState<CVATSAnalyzeResponse | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const storedResult = sessionStorage.getItem('cv_ats_result');
    if (storedResult) {
      try {
        const parsedResult = JSON.parse(storedResult);
        console.log('[AI CV Result] Loaded analysis data:', {
          overall_score: parsedResult.overall_score,
          hasContent: !!parsedResult.content,
          hasSkills: !!parsedResult.skills,
          dataSize: storedResult.length,
        });
        setResult(parsedResult);
      } catch (error) {
        console.error('[AI CV Result] Failed to parse stored result:', error);
        toast.error("Failed to load analysis results");
        router.push('/candidate/ai-cv-checker');
      }
    } else {
      console.warn('[AI CV Result] No stored result found in sessionStorage');
      toast.error("Analysis result not found");
      router.push('/candidate/ai-cv-checker');
    }
  }, [router]);

  const handleExportPDF = async () => {
    if (!result) {
      console.error('[Export PDF] No result data available');
      toast.error("No analysis data available. Please analyze a CV first.");
      return;
    }

    // Validate result has required data
    if (!result.overall_score) {
      console.error('[Export PDF] Invalid result data:', result);
      toast.error("Invalid analysis data. Please try analyzing again.");
      return;
    }

    console.log('[Export PDF] Starting export with data:', {
      overall_score: result.overall_score,
      hasContent: !!result.content,
      hasSkills: !!result.skills,
      hasFormat: !!result.format,
    });

    setIsExporting(true);

    try {
      const today = new Date().toISOString().split("T")[0];
      const fileName = `careermate-cv-analysis-report-${today}`;
      const response = await fetch('/api/export-cv-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisData: result,
          fileName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export PDF');
      }

      console.log('[Export PDF] PDF generated successfully');

      // Get PDF blob and trigger download
      const blob = await response.blob();
      console.log('[Export PDF] PDF size:', (blob.size / 1024).toFixed(2), 'KB');

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('PDF exported successfully!');
    } catch (error: any) {
      console.error('[Export PDF] Error:', error);
      toast.error(error.message || 'Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <CVSidebar activePage="cm-profile" />
          </aside>

          {/* Main Content */}
          <div className="max-w-5xl mx-auto w-full">
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={() => router.push('/candidate/ai-cv-checker')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      CV Analysis Results
                    </h1>
                    <p className="text-gray-600">{result.overall_comment}</p>
                  </div>
                  <div className={`text-center ${getScoreBgColor(result.overall_score)} rounded-2xl px-8 py-6`}>
                    <div className={`text-5xl font-bold ${getScoreColor(result.overall_score)}`}>
                      {result.overall_score}
                    </div>
                    <div className="text-sm font-semibold text-gray-600 mt-1">
                      Overall Score
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Section - Overview with Radar Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Overview</h2>
              <p className="mb-1">
                <span className="text-gray-700">Suitability Level: </span>
                <span className={`text-xl font-bold ${getScoreColor(result.overall_score)}`}>
                  {result.overall_score}
                </span>
              </p>
              <p className="text-gray-600 mb-6">{result.overall_comment}</p>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Radar Chart */}
                <div className="flex items-center justify-center">
                  <RadarChart
                    data={[
                      { label: "Content", value: result.content?.score || 0, color: "#3b82f6" },
                      { label: "Format", value: result.format?.score || 0, color: "#f97316" },
                      { label: "Style", value: result.style?.score || 0, color: "#8b5cf6" },
                      { label: "Sections", value: result.sections?.score || 0, color: "#ef4444" },
                      { label: "Skills", value: result.skills?.score || 0, color: "#22c55e" },
                    ]}
                  />
                </div>

                {/* Strengths & Improvements */}
                <div className="space-y-6">
                  {/* Strengths */}
                  <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                    <h3 className="font-bold text-gray-900 mb-3">Strengths</h3>
                    <ul className="space-y-2">
                      {(result.summary?.strengths || []).map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-700">
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Improvements */}
                  <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                    <h3 className="font-bold text-gray-900 mb-3">Improvements</h3>
                    <ul className="space-y-2">
                      {(result.summary?.improvements || []).map((improvement, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-700">
                          <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Sections */}
            <div className="space-y-6">
              {/* Content Score */}
              <ScoreCard
                icon={<FileText className="w-6 h-6" />}
                title="Content"
                score={result.content?.score}
                description={result.content?.description}
              >
                <DetailSection
                  title="Measurable Results"
                  items={result.content?.measurable_results || []}
                  type="success"
                />
                <DetailSection
                  title="Grammar Issues"
                  items={result.content?.grammar_issues || []}
                  type="error"
                />
                <DetailSection
                  title="Improvement Tips"
                  items={result.content?.tips || []}
                  type="tip"
                />
              </ScoreCard>

              {/* Skills Score */}
              <ScoreCard
                icon={<Award className="w-6 h-6" />}
                title="Skills"
                score={result.skills?.score}
                description={result.skills?.description}
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Technical Skills</h4>
                    <DetailSection
                      title="Matched"
                      items={result.skills?.technical?.matched || []}
                      type="success"
                    />
                    <DetailSection
                      title="Missing"
                      items={result.skills?.technical?.missing || []}
                      type="error"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Soft Skills</h4>
                    <DetailSection
                      title="Missing"
                      items={result.skills?.soft?.missing || []}
                      type="error"
                    />
                  </div>
                </div>
                <DetailSection
                  title="Improvement Tips"
                  items={result.skills?.tips || []}
                  type="tip"
                />
              </ScoreCard>

              {/* Format Score */}
              <ScoreCard
                icon={<Layout className="w-6 h-6" />}
                title="Format"
                score={result.format?.score}
                description={result.format?.description}
              >
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Format Checks</h4>
                  <div className="space-y-2">
                    <FormatCheck label="Date Format" status={result.format?.checks?.date_format} />
                    <FormatCheck label="Length" status={result.format?.checks?.length} />
                    <FormatCheck label="Bullet Points" status={result.format?.checks?.bullet_points} />
                  </div>
                </div>
                <DetailSection
                  title="Improvement Tips"
                  items={result.format?.tips || []}
                  type="tip"
                />
              </ScoreCard>

              {/* Sections Score */}
              <ScoreCard
                icon={<BookOpen className="w-6 h-6" />}
                title="Sections"
                score={result.sections?.score}
                description={result.sections?.description}
              >
                <DetailSection
                  title="Missing Sections"
                  items={result.sections?.missing || []}
                  type="error"
                />
                <DetailSection
                  title="Improvement Tips"
                  items={result.sections?.tips || []}
                  type="tip"
                />
              </ScoreCard>

              {/* Style Score */}
              <ScoreCard
                icon={<Palette className="w-6 h-6" />}
                title="Style"
                score={result.style?.score}
                description={result.style?.description}
              >
                <DetailSection
                  title="Tone"
                  items={result.style?.tone || []}
                  type="warning"
                />
                <DetailSection
                  title="Buzzwords"
                  items={result.style?.buzzwords || []}
                  type="info"
                />
                <DetailSection
                  title="Improvement Tips"
                  items={result.style?.tips || []}
                  type="tip"
                />
              </ScoreCard>

              {/* Recommendations */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-sm border border-green-200 p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Lightbulb className="w-6 h-6 text-green-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    {result.recommendations?.title || "Gợi ý"}
                  </h2>
                </div>
                <p className="text-gray-600 mb-6">{result.recommendations?.description || ""}</p>
                <ul className="space-y-3">
                  {(result.recommendations?.items || []).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 bg-white rounded-lg p-4 shadow-sm">
                      <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="px-6 py-3 border border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Export PDF
                  </>
                )}
              </button>
              <button
                onClick={() => router.push('/candidate/ai-cv-checker')}
                className="px-6 py-3 border-2 border-green-600 text-green-600 rounded-xl hover:bg-green-50 transition-colors font-semibold"
              >
                Analyze Another CV
              </button>
              <button
                onClick={() => router.push('/candidate/cm-profile')}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold"
              >
                Improve Your CV
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper Components
interface ScoreCardProps {
  icon: React.ReactNode;
  title: string;
  score: number;
  description: string;
  children: React.ReactNode;
}

function ScoreCard({ icon, title, score, description, children }: ScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-green-600">{icon}</div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        <div className={`${getScoreBgColor(score)} rounded-xl px-6 py-3`}>
          <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
        </div>
      </div>
      <p className="text-gray-600 mb-6">{description}</p>
      {children}
    </div>
  );
}

interface DetailSectionProps {
  title: string;
  items: string[];
  type: 'success' | 'error' | 'warning' | 'info' | 'tip';
}

function DetailSection({ title, items, type }: DetailSectionProps) {
  if (items.length === 0) return null;

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { icon: '✓', color: 'text-green-600', bg: 'bg-green-50' };
      case 'error':
        return { icon: '✗', color: 'text-red-600', bg: 'bg-red-50' };
      case 'warning':
        return { icon: '⚠', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      case 'info':
        return { icon: 'ℹ', color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'tip':
        return { icon: '💡', color: 'text-purple-600', bg: 'bg-purple-50' };
    }
  };

  const { icon, color, bg } = getIconAndColor();

  return (
    <div className="mb-4">
      <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className={`flex items-start gap-2 ${bg} rounded-lg p-3`}>
            <span className={`${color} font-bold flex-shrink-0`}>{icon}</span>
            <span className="text-gray-700">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface FormatCheckProps {
  label: string;
  status: 'PASS' | 'FAIL';
}

function FormatCheck({ label, status }: FormatCheckProps) {
  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
      <span className="text-gray-700 font-medium">{label}</span>
      {status === 'PASS' ? (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold">PASS</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="w-5 h-5" />
          <span className="font-semibold">FAIL</span>
        </div>
      )}
    </div>
  );
}
