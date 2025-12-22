/**
 * AI CV Analysis Result - Print Page
 * 
 * This page is used for PDF export via Puppeteer.
 * It receives the analysis data via query parameter (base64 encoded).
 * 
 * IMPORTANT: This page should ONLY render the analysis content.
 * - No header, no footer, no sidebar
 * - No interactive buttons
 * - Optimized for PDF printing
 */

"use client";

import { Suspense, useEffect, useRef } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Award,
  Layout,
  BookOpen,
  Palette,
  Lightbulb
} from "lucide-react";
import { CVATSAnalyzeResponse } from "@/types/cv-ats";

// =============================================================================
// Print-Only CSS for Clean PDF Pagination
// =============================================================================

function PrintStyles() {
  return (
    <style jsx global>{`
      @media print {
        /* Prevent page breaks inside cards and major sections */
        .print-avoid-break {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* Force page break before section */
        .print-page-break {
          break-before: page;
          page-break-before: always;
        }

        /* Reduce excessive spacing for print */
        .print-reduce-spacing {
          margin-top: 0.75rem !important;
          margin-bottom: 0.75rem !important;
        }

        /* Keep content together */
        .print-keep-together {
          break-inside: avoid;
          page-break-inside: avoid;
          orphans: 3;
          widows: 3;
        }

        /* Optimize outer container padding for print - prevent edge touching */
        .print-container {
          padding: 24px 20px !important;
        }

        /* Optimize card padding for print */
        .print-compact-card {
          padding: 1.25rem !important;
        }

        /* Remove box shadows for cleaner print */
        .print-no-shadow {
          box-shadow: none !important;
        }

        /* Prevent horizontal overflow */
        * {
          max-width: 100%;
        }

        /* Ensure proper page sizing */
        @page {
          size: A4;
          margin: 0.5in;
        }

        /* Remove unnecessary margins on body */
        body {
          margin: 0;
          padding: 0;
        }

        /* Optimize grid layouts for print */
        .print-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          break-inside: avoid;
        }
      }
    `}</style>
  );
}

// =============================================================================
// Radar Chart Component (SAME AS ORIGINAL PAGE)
// =============================================================================

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

// =============================================================================
// Helper Functions
// =============================================================================

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-green-100";
  if (score >= 60) return "bg-yellow-100";
  return "bg-red-100";
}

// =============================================================================
// Print Content Component
// =============================================================================

function PrintContent({ result }: { result: CVATSAnalyzeResponse }) {
  return (
    <>
      <PrintStyles />
      <div className="min-h-screen bg-white">
        {/* Fixed-width container for A4 print @ 96 DPI */}
        <div 
          className="mx-auto space-y-6 print-reduce-spacing print-container" 
          style={{ width: '794px', padding: '48px 32px' }}
        >
          {/* Header Section - Keep together on same page */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 print-avoid-break print-no-shadow print-compact-card">
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

        {/* Overview Section - Keep together on same page */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 print-avoid-break print-no-shadow print-compact-card">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Overview</h2>
          <p className="mb-1">
            <span className="text-gray-700">Suitability Level: </span>
            <span className={`text-xl font-bold ${getScoreColor(result.overall_score)}`}>
              {result.overall_score}
            </span>
          </p>
          <p className="text-gray-600 mb-6">{result.overall_comment}</p>

          {/* FIXED GRID - Remove md: breakpoint for print */}
          <div className="grid grid-cols-2 gap-8 print-grid">
            {/* Radar Chart - EXACT SAME AS ORIGINAL */}
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

            {/* Strengths & Improvements - EXACT MATCH */}
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

        {/* Content Score */}
        <ScoreCard
            icon={<FileText className="w-6 h-6" />}
            title="Content"
            score={result.content?.score || 0}
            description={result.content?.description || ""}
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
            score={result.skills?.score || 0}
            description={result.skills?.description || ""}
          >
            {/* FIXED GRID - Remove md: breakpoint for print */}
            <div className="grid grid-cols-2 gap-6 print-grid">
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
            score={result.format?.score || 0}
            description={result.format?.description || ""}
          >
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-3">Format Checks</h4>
              <div className="space-y-2">
                <FormatCheck label="Date Format" status={result.format?.checks?.date_format || "FAIL"} />
                <FormatCheck label="Length" status={result.format?.checks?.length || "FAIL"} />
                <FormatCheck label="Bullet Points" status={result.format?.checks?.bullet_points || "FAIL"} />
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
            score={result.sections?.score || 0}
            description={result.sections?.description || ""}
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
            score={result.style?.score || 0}
            description={result.style?.description || ""}
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

          {/* Recommendations - Keep together */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-sm border border-green-200 p-8 print-avoid-break print-no-shadow print-compact-card">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                {result.recommendations?.title || "Recommendations for You"}
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
      </div>
    </>
  );
}

// =============================================================================
// Helper Components
// =============================================================================

function ScoreItem({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
      <span className="text-gray-700 font-medium">{label}</span>
      <span className={`text-xl font-bold ${getScoreColor(score)}`}>{score}</span>
    </div>
  );
}

interface ScoreCardProps {
  icon: React.ReactNode;
  title: string;
  score: number;
  description: string;
  children: React.ReactNode;
}

function ScoreCard({ icon, title, score, description, children }: ScoreCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 print-avoid-break print-no-shadow print-compact-card">
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
      <div className="print-keep-together">
        {children}
      </div>
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
            <span className="text-gray-700 text-sm">{item}</span>
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

// =============================================================================
// Server Component - Parse Query Params
// =============================================================================

interface PrintPageProps {
  searchParams: Promise<{ data?: string }>;
}

export default async function AICVResultPrintPage({ searchParams }: PrintPageProps) {
  // Await searchParams (Next.js 15+ requirement)
  const params = await searchParams;
  
  // Parse data from query parameter
  let result: CVATSAnalyzeResponse | null = null;
  
  if (params.data) {
    try {
      const decodedData = Buffer.from(params.data, 'base64').toString('utf-8');
      result = JSON.parse(decodedData);
    } catch (error) {
      console.error('[PrintPage] Failed to parse data:', error);
    }
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Data</h1>
          <p className="text-gray-600">
            No analysis data provided or data format is invalid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <PrintContent result={result} />
    </Suspense>
  );
}
