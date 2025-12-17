import React from "react";
import { FiInfo } from "react-icons/fi";

type TabType = "built" | "uploaded" | "draft";

interface EmptyStateProps {
  activeTab: TabType;
  onFileInput?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ activeTab, onFileInput }) => {
  const getContent = () => {
    switch (activeTab) {
      case "uploaded":
        return {
          title: "No Uploaded CVs",
          description: "Upload your CV to start applying for jobs",
          hasUpload: true,
          showRecommendation: true
        };
      case "built":
        return {
          title: "No Created CVs",
          description: "Create a professional CV using our builder",
          hasUpload: false,
          showRecommendation: false
        };
      case "draft":
        return {
          title: "No Drafts",
          description: "Your CV drafts will appear here",
          hasUpload: false,
          showRecommendation: false
        };
    }
  };

  const content = getContent();

  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-[#3a4660] to-gray-400 rounded-full flex items-center justify-center shadow-md">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-2">{content.title}</h3>

      <p className="text-gray-600 mb-4">{content.description}</p>

      {/* Recommendation text for Upload tab */}
        {/* {content.showRecommendation && (
          <div className="mb-6 mx-auto max-w-md">
            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              <FiInfo className="w-4 h-4 flex-shrink-0" />
              <span>For the best results, we recommend using a <strong>CareerMate CV template</strong>.</span>
            </div>
          </div>
        )} */}

      {/* {content.hasUpload && onFileInput ? (
        <label className="cursor-pointer">
          <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={onFileInput} />
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#3a4660] to-gray-400 hover:from-[#3a4660] hover:to-[#3a4660] text-white rounded-lg font-medium shadow-md hover:shadow-xl transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Upload CV
          </span>
        </label>
      ) : (
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#3a4660] to-gray-400 hover:from-[#3a4660] hover:to-[#3a4660] text-white rounded-lg font-medium shadow-md hover:shadow-xl transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New CV
        </button>
      )} */}
    </div>
  );
};
