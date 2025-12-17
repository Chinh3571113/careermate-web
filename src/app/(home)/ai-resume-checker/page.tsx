"use client";

import { useState } from "react";
import { ClientHeader, ClientFooter } from "@/modules/client/components";
import {
    Upload,
    FileText,
    Search,
    AlertCircle,
    CheckCircle2,
    TrendingUp,
    Lightbulb
} from "lucide-react";
import toast from "react-hot-toast";

export default function AIResumeCheckerPage() {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [jobDescription, setJobDescription] = useState<string>("");
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);

    // Handle file upload
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['.pdf', '.doc', '.docx'];
            const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

            if (!allowedTypes.includes(fileExtension)) {
                toast.error('Chỉ hỗ trợ file .pdf, .doc, .docx');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Kích thước file không được vượt quá 5MB');
                return;
            }

            setUploadedFile(file);
            toast.success(`File "${file.name}" đã được tải lên`);
        }
    };

    // Handle drag and drop
    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['.pdf', '.doc', '.docx'];
            const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

            if (!allowedTypes.includes(fileExtension)) {
                toast.error('Chỉ hỗ trợ file .pdf, .doc, .docx');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Kích thước file không được vượt quá 5MB');
                return;
            }

            setUploadedFile(file);
            toast.success(`File "${file.name}" đã được tải lên`);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    // Analyze resume
    const handleAnalyze = async () => {
        if (!uploadedFile) {
            toast.error('Vui lòng tải lên CV của bạn');
            return;
        }

        setIsAnalyzing(true);

        // Simulate API call
        setTimeout(() => {
            setAnalysisResult({
                matchScore: 82,
                content: {
                    score: 75,
                    issues: [
                        'Thiếu thông tin về dự án cụ thể',
                        'Cần bổ sung thêm kỹ năng soft skills'
                    ]
                },
                skills: {
                    score: 85,
                    matched: ['React', 'TypeScript', 'Node.js'],
                    missing: ['AWS', 'Docker', 'Kubernetes']
                },
                format: {
                    score: 90,
                    feedback: 'Định dạng CV rõ ràng, dễ đọc'
                },
                sections: {
                    score: 70,
                    feedback: 'Thiếu phần "Certifications" và "Projects"'
                },
                style: {
                    score: 80,
                    feedback: 'Sử dụng font chữ professional, layout cân đối'
                },
                highlights: [
                    'Extensive experience working with AWS and building scalable microservices architecture',
                    'Extensive experience working with frontend technologies such as React, Next.js, databases',
                    'Provide more context on collaboration with cross-functional teams, especially with frontend developers or product managers'
                ],
                improvements: [
                    'Add measurable results such as system uptime improvements or performance gains',
                    'Provide more context on collaboration with cross-functional teams',
                    'Include any certifications or training relevant to backend development'
                ]
            });
            setIsAnalyzing(false);
            toast.success('Phân tích hoàn tất!');
        }, 2000);
    };

    return (
        <>
            <ClientHeader />
            <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12">
                <div className="container mx-auto px-4 max-w-7xl">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Điều chỉnh CV để tăng cơ hội phỏng vấn
                        </h1>
                        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                            Tăng cơ hội phỏng vấn nhờ đề xuất cải thiện CV, chấm điểm theo ATS
                            và tự động tạo Cover Letter - tùy chỉnh theo từng vị trí.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Panel - Input */}
                        <div className="space-y-6">
                            {/* Step 1: Upload CV */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-semibold">
                                        1
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Tải lên CV<span className="text-red-500">*</span>
                                    </h2>
                                </div>

                                {/* Upload Tabs */}
                                <div className="flex gap-2 mb-4">
                                    <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium">
                                        <Upload className="w-4 h-4" />
                                        Tải lên tệp
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                        <FileText className="w-4 h-4" />
                                        Sử dụng CV tạo bởi Cake
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                        <FileText className="w-4 h-4" />
                                        Dán văn bản
                                    </button>
                                </div>

                                {/* Upload Area */}
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors cursor-pointer"
                                >
                                    <input
                                        type="file"
                                        id="cv-upload"
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <label htmlFor="cv-upload" className="cursor-pointer">
                                        {uploadedFile ? (
                                            <div className="space-y-2">
                                                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                                                <p className="text-green-600 font-medium">{uploadedFile.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {(uploadedFile.size / 1024).toFixed(2)} KB
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                                                <p className="text-green-500 font-medium text-lg">Upload new files</p>
                                                <p className="text-gray-500">Drop files here or click to upload.</p>
                                            </div>
                                        )}
                                    </label>
                                </div>

                                <div className="mt-4 space-y-2">
                                    <div className="flex items-start gap-2 text-sm text-gray-600">
                                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <p>Định dạng được hỗ trợ: .pdf, .doc, .docx. Dung lượng tối đa: 5 MB.</p>
                                    </div>
                                    <div className="flex items-start gap-2 text-sm text-gray-600">
                                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <p>Hỗ trợ tất cả các ngôn ngữ.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: Job Description */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-semibold">
                                        2
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Thêm mô tả công việc<span className="text-red-500">*</span>
                                    </h2>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 mb-4">
                                    <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium">
                                        <FileText className="w-4 h-4" />
                                        Paste Text
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                        <Search className="w-4 h-4" />
                                        Search Jobs on Cake
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                        <Upload className="w-4 h-4" />
                                        Upload File
                                    </button>
                                </div>

                                {/* Textarea */}
                                <textarea
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    placeholder="Mô tả công việc càng chi tiết thì Cake AI có thể check CV của bạn tốt hơn."
                                    className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                                />
                            </div>

                            {/* Analyze Button */}
                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || !uploadedFile}
                                className={`w-full py-4 rounded-lg font-semibold text-white transition-colors ${isAnalyzing || !uploadedFile
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                                    }`}
                            >
                                {isAnalyzing ? 'Đang phân tích...' : 'Bắt đầu quét'}
                            </button>
                        </div>

                        {/* Right Panel - Analysis Result */}
                        <div className="space-y-6">
                            {analysisResult ? (
                                <>
                                    {/* Match Score Card */}
                                    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl shadow-sm border border-green-200 p-6">
                                        <div className="text-center">
                                            <h3 className="text-lg font-semibold text-gray-700 mb-4">Match Score</h3>
                                            <div className="relative inline-flex items-center justify-center">
                                                <div className="w-32 h-32 rounded-full border-8 border-green-500 flex items-center justify-center bg-white">
                                                    <span className="text-4xl font-bold text-green-600">
                                                        {analysisResult.matchScore}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="mt-4 text-sm text-gray-600">
                                                ✓ You will love it
                                            </p>
                                        </div>
                                    </div>

                                    {/* Detailed Scores */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>

                                        {/* Score Bars */}
                                        <div className="space-y-3">
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-700 font-medium">Content</span>
                                                    <span className="text-blue-600 font-semibold">{analysisResult.content.score}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                                        style={{ width: `${analysisResult.content.score}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-700 font-medium">Skills</span>
                                                    <span className="text-teal-600 font-semibold">{analysisResult.skills.score}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-teal-500 h-2 rounded-full transition-all duration-500"
                                                        style={{ width: `${analysisResult.skills.score}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-700 font-medium">Format</span>
                                                    <span className="text-orange-600 font-semibold">{analysisResult.format.score}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                                                        style={{ width: `${analysisResult.format.score}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-700 font-medium">Sections</span>
                                                    <span className="text-pink-600 font-semibold">{analysisResult.sections.score}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-pink-500 h-2 rounded-full transition-all duration-500"
                                                        style={{ width: `${analysisResult.sections.score}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-700 font-medium">Style</span>
                                                    <span className="text-purple-600 font-semibold">{analysisResult.style.score}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                                                        style={{ width: `${analysisResult.style.score}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <button className="w-full mt-4 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors">
                                            Edit Resume
                                        </button>
                                    </div>

                                    {/* Content Analysis */}
                                    <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <FileText className="w-5 h-5 text-blue-600" />
                                            <h3 className="text-lg font-semibold text-gray-900">Content</h3>
                                        </div>

                                        <div className="bg-white rounded-lg p-4 mb-4">
                                            <p className="text-center text-sm text-gray-600 mb-2">
                                                Almost there! Let's refine your content to make it more impactful and error-free.
                                            </p>
                                            <div className="flex justify-center gap-8">
                                                <div className="text-center">
                                                    <p className="text-sm text-gray-500">Measurable Results</p>
                                                    <p className="text-2xl font-bold text-gray-900">{analysisResult.improvements.length}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm text-gray-500">Spelling & Grammar</p>
                                                    <p className="text-2xl font-bold text-gray-900">5</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Measurable Results */}
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
                                            <div className="flex items-start gap-2">
                                                <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 mb-2">Measurable Results</h4>
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        Emphasize your impact and accomplishments by including measurable outcomes.
                                                    </p>
                                                    <p className="text-sm font-medium text-gray-700 mb-1">3 Issues</p>
                                                    <ul className="space-y-2">
                                                        {analysisResult.improvements.map((improvement: string, index: number) => (
                                                            <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                                                <span className="text-gray-400">•</span>
                                                                <span>{improvement}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Highlights */}
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <div className="flex items-start gap-2">
                                                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 mb-2">Highlights</h4>
                                                    <ul className="space-y-2">
                                                        {analysisResult.highlights.map((highlight: string, index: number) => (
                                                            <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                                                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                                <span>{highlight}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                        <FileText className="w-12 h-12 text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        No Analysis Results Yet
                                    </h3>
                                    <p className="text-gray-600">
                                        Upload CV and add job description to start analysis
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <ClientFooter />
        </>
    );
}
