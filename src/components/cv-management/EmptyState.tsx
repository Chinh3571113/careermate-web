import React from "react";
import { FileText, AlertCircle, Upload, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

type TabType = "built" | "uploaded" | "draft";

interface EmptyStateProps {
  /** Current active tab */
  activeTab?: TabType;
  /** Upload handler for file input */
  onFileInput?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Build CV handler */
  onBuildClick?: () => void;
  /** Upload CV handler (for button click) */
  onUploadClick?: () => void;
  /** 
   * Unified empty state mode 
   * - "no-cvs": User has no CVs at all (show upload/build CTAs)
   * - "no-default": User has CVs but no default set (show instructions)
   * - "tab-empty": Current tab is empty (show tab-specific message)
   */
  mode?: "no-cvs" | "no-default" | "tab-empty";
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  activeTab = "built",
  onFileInput,
  onBuildClick,
  onUploadClick,
  mode = "tab-empty"
}) => {
  // ========================================
  // UNIFIED EMPTY STATE LOGIC
  // ========================================

  const getContent = () => {
    // Case 1: User has NO CVs at all
    if (mode === "no-cvs") {
      return {
        icon: <FileText className="w-10 h-10 text-white" strokeWidth={1.5} />,
        iconBg: "bg-gradient-to-r from-[#3a4660] to-gray-400",
        title: "No CV Yet",
        description: (
          <>
            You don't have any CV yet.
            <br />
            Upload your existing CV or build a new one using our CV builder to get started.
          </>
        ),
        showActions: true,
        showHelp: false
      };
    }

    // Case 2: User has CVs but NO default CV set
    if (mode === "no-default") {
      return {
        icon: <AlertCircle className="h-16 w-16 text-amber-500" />,
        iconBg: "", // No background for alert icon
        title: "No Default CV Selected",
        description: "You have CVs but none is set as default. Please select a CV below and set it as your default CV to apply for jobs.",
        showActions: false,
        showHelp: true
      };
    }

    // Case 3: Tab-specific empty state
    switch (activeTab) {
      case "uploaded":
        return {
          icon: <FileText className="w-10 h-10 text-white" strokeWidth={1.5} />,
          iconBg: "bg-gradient-to-r from-[#3a4660] to-gray-400",
          title: "No Uploaded CVs",
          description: "Upload your CV to start applying for jobs",
          showActions: false,
          showHelp: false
        };
      case "built":
        return {
          icon: <FileText className="w-10 h-10 text-white" strokeWidth={1.5} />,
          iconBg: "bg-gradient-to-r from-[#3a4660] to-gray-400",
          title: "No Created CVs",
          description: "Create a professional CV using our builder",
          showActions: false,
          showHelp: false
        };
      case "draft":
        return {
          icon: <FileText className="w-10 h-10 text-white" strokeWidth={1.5} />,
          iconBg: "bg-gradient-to-r from-[#3a4660] to-gray-400",
          title: "No Drafts",
          description: "Your CV drafts will appear here",
          showActions: false,
          showHelp: false
        };
    }
  };

  const content = getContent();

  return (
    <div className="text-center">
      <div className="w-full">
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          {content.iconBg ? (
            <div className={`w-20 h-20 mx-auto ${content.iconBg} rounded-full flex items-center justify-center shadow-md`}>
              {content.icon}
            </div>
          ) : (
            content.icon
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-gray-900 mb-2">{content.title}</h3>

        {/* Description */}
        <p className="text-gray-600 mb-4">{content.description}</p>

        {/* Action Buttons (only for "no-cvs" mode) */}
        {/* {content.showActions && (
          <div className="flex flex-col gap-3 sm:flex-row justify-center">
            <Button
              onClick={onUploadClick}
              className="bg-[#3a4660] hover:bg-[#2d3750]"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload CV
            </Button>
            <Button
              onClick={onBuildClick}
              variant="outline"
              className="border-[#3a4660] text-[#3a4660] hover:bg-[#3a4660] hover:text-white"
            >
              <FilePlus className="mr-2 h-4 w-4" />
              Build New CV
            </Button>
          </div>
        )} */}

        {content.showHelp && (
          <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 p-4 text-left">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-medium text-amber-900 mb-1">
                  How to set a default CV
                </p>
                <p className="text-xs text-amber-800">
                  Scroll down to your CV list, find the CV you want to use, and
                  click the "Set as Default" button.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
