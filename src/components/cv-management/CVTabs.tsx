import React from "react";
import { FiInfo } from "react-icons/fi";

type TabType = "built" | "uploaded" | "draft";

interface CVTabsProps {
  activeTab: TabType;
  builtCount: number;
  uploadedCount: number;
  draftCount: number;
  isUploading: boolean;
  onTabChange: (tab: TabType) => void;
  onUploadClick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCreateCVClick: () => void;
}

export const CVTabs: React.FC<CVTabsProps> = ({
  activeTab,
  builtCount,
  uploadedCount,
  draftCount,
  isUploading,
  onTabChange,
  onUploadClick,
  onCreateCVClick
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200">
      <div className="border-b border-gray-200 flex items-center justify-between px-6">
        <nav className="flex gap-8" aria-label="Tabs">
          <button
            onClick={() => onTabChange("built")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "built"
                ? "border-[#3a4660] text-[#3a4660]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Created CVs ({builtCount})
          </button>
          <button
            onClick={() => onTabChange("uploaded")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "uploaded"
                ? "border-[#3a4660] text-[#3a4660]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Uploaded CVs ({uploadedCount})
          </button>
          <button
            onClick={() => onTabChange("draft")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "draft"
                ? "border-[#3a4660] text-[#3a4660]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Draft ({draftCount})
          </button>
        </nav>

        {/* Action Buttons - Always visible on the right */}
        <div className="py-2 flex items-center gap-3">
          {/* Recommendation hint for Upload tab */}
          {activeTab === "uploaded" && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-200">
              <FiInfo className="w-3.5 h-3.5" />
              <span>Tip: Use a <strong>CareerMate template</strong> for best results</span>
            </div>
          )}

          {/* Create CV Builder Button */}
          <button
            onClick={onCreateCVClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-md hover:shadow-xl transition-all text-sm"
            title="Build new CV from scratch"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Build new CV</span>
            <span className="sm:hidden">Build</span>
          </button>

          {/* Upload Button */}
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={onUploadClick}
              disabled={isUploading}
            />
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#3a4660] to-gray-400 hover:from-[#3a4660] hover:to-[#3a4660] text-white rounded-lg font-medium shadow-md hover:shadow-xl transition-all text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {isUploading ? "Uploading..." : "Upload CV"}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};
