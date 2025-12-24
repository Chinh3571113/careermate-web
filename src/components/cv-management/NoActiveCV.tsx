import { FileX, Upload, FileText, AlertCircle, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoActiveCVProps {
  onUploadClick?: () => void;
  onBuildClick?: () => void;
  hasResumes?: boolean;
}

export const NoActiveCV = ({
  onUploadClick,
  onBuildClick,
  hasResumes = false
}: NoActiveCVProps) => {
  return (
    <div className="w-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
      {/* <div className="mx-auto max-w-md"> */}
      <div className="mx-auto max-w-md min-h-[280px] flex flex-col justify-center">
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          {hasResumes ? (
            <AlertCircle className="h-16 w-16 text-amber-500" />
          ) : (
            <FileX className="h-16 w-16 text-gray-400" />
          )}
        </div>

        {/* Title */}
        <h3 className="mb-2 text-xl font-semibold text-gray-900">
          {hasResumes ? "No Active CV Selected" : "No CV Yet"}
        </h3>

        {/* Description */}
        <p className="mb-6 text-sm text-gray-600">
          {hasResumes ? (
            <>
              You have CVs but none is set as active. Please select a CV below
              and set it as your active CV to apply for jobs.
            </>
          ) : (
            <>
              You don't have any CV yet. Upload your existing CV or build a new
              one using our CV builder to get started.
            </>
          )}
        </p>

        {/* Action Buttons */}
        {!hasResumes && (
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
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
        )}

        {/* Help Text */}
        {hasResumes && (
          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-medium text-amber-900 mb-1">
                  How to set an active CV
                </p>
                <p className="text-xs text-amber-800">
                  Scroll down to your CV list, find the CV you want to use, and
                  click the "Set as Active" button. This CV will be used when
                  you apply for jobs.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
