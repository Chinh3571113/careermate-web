import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MonthYearPicker from "../MonthYearPicker";
import { Education } from "../types";
import { useState, useEffect, useRef, useCallback } from "react";
import { FiFileText, FiTrash2 } from "react-icons/fi";

// Degree options matching SyncCVSummaryDialog
const DEGREE_OPTIONS = [
    { value: 'College', label: 'College' },
    { value: 'Bachelor', label: 'Bachelor' },
    { value: 'Master', label: 'Master' },
    { value: 'PhD', label: 'PhD' },
    { value: 'Other', label: 'Other' },
];

// ===== Custom Context Menu Component =====
interface ContextMenuProps {
    x: number;
    y: number;
    onAutoFill: () => void;
    onClearFields: () => void;
    onClose: () => void;
}

function ContextMenu({ x, y, onAutoFill, onClearFields, onClose }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        // Add listeners with a small delay to prevent immediate closing
        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }, 10);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    // Adjust position to keep menu in viewport
    const adjustedStyle = {
        top: y,
        left: x,
    };

    const handleAutoFillClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('[ContextMenu] Auto Fill clicked');
        onAutoFill();
        onClose();
    };

    const handleClearClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('[ContextMenu] Clear Fields clicked');
        onClearFields();
        onClose();
    };

    return (
        <div
            ref={menuRef}
            className="fixed z-[9999] bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px] animate-in fade-in-0 zoom-in-95 duration-100"
            style={{ ...adjustedStyle, userSelect: 'none' }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <button
                type="button"
                onClick={handleAutoFillClick}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors cursor-pointer select-none"
                style={{ cursor: 'pointer' }}
            >
                <FiFileText className="w-4 h-4" />
                Auto Fill Sample Data
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button
                type="button"
                onClick={handleClearClick}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 transition-colors cursor-pointer select-none"
                style={{ cursor: 'pointer' }}
            >
                <FiTrash2 className="w-4 h-4" />
                Clear Fields
            </button>
        </div>
    );
}

interface EducationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingEducation: Education | null;
    onEditingEducationChange: (edu: Education | null) => void;
    onSave: () => void;
}

export default function EducationDialog({
    open,
    onOpenChange,
    editingEducation,
    onEditingEducationChange,
    onSave
}: EducationDialogProps) {
    // ===== Context Menu State =====
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
    const [dateError, setDateError] = useState<string>("");
    const formContainerRef = useRef<HTMLDivElement>(null);

    // Validate dates whenever they change
    useEffect(() => {
        if (editingEducation?.startMonth && editingEducation?.startYear && 
            editingEducation?.endMonth && editingEducation?.endYear) {
            const startDate = new Date(parseInt(editingEducation.startYear), parseInt(editingEducation.startMonth) - 1);
            const endDate = new Date(parseInt(editingEducation.endYear), parseInt(editingEducation.endMonth) - 1);
            
            if (endDate < startDate) {
                setDateError("Please enter an end date bigger than the start date.");
            } else {
                setDateError("");
            }
        } else {
            setDateError("");
        }
    }, [editingEducation?.startMonth, editingEducation?.startYear, editingEducation?.endMonth, editingEducation?.endYear]);

    // Handle right-click on form container
    const handleContextMenu = useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setContextMenu({ x: event.clientX, y: event.clientY });
    }, []);

    // Auto fill sample education data
    const fillSampleEducation = useCallback(() => {
        console.log('[EducationDialog] fillSampleEducation called');
        console.log('[EducationDialog] editingEducation:', editingEducation);
        if (editingEducation) {
            const newEducation = {
                ...editingEducation,
                school: "FPT University",
                degree: "Bachelor",
                major: "Information Technology",
                startMonth: "09",  // Two-digit format matching MonthYearPicker options
                startYear: "2020",
                endMonth: "12",    // Two-digit format matching MonthYearPicker options
                endYear: "2024"
            };
            console.log('[EducationDialog] Calling onEditingEducationChange with:', newEducation);
            onEditingEducationChange(newEducation);
        } else {
            console.log('[EducationDialog] editingEducation is null, cannot fill');
        }
    }, [editingEducation, onEditingEducationChange]);

    // Clear all fields
    const clearFields = useCallback(() => {
        console.log('[EducationDialog] clearFields called');
        console.log('[EducationDialog] editingEducation:', editingEducation);
        if (editingEducation) {
            const clearedEducation = {
                ...editingEducation,
                school: "",
                degree: "",
                major: "",
                startMonth: "",
                startYear: "",
                endMonth: "",
                endYear: ""
            };
            console.log('[EducationDialog] Calling onEditingEducationChange with:', clearedEducation);
            onEditingEducationChange(clearedEducation);
        } else {
            console.log('[EducationDialog] editingEducation is null, cannot clear');
        }
    }, [editingEducation, onEditingEducationChange]);

    // Close context menu
    const closeContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    // Close context menu when dialog closes
    useEffect(() => {
        if (!open) {
            setContextMenu(null);
        }
    }, [open]);

    const handleFieldChange = (field: keyof Education, value: any) => {
        if (editingEducation) {
            onEditingEducationChange({
                ...editingEducation,
                [field]: value
            });
        }
    };

    const handleSave = () => {
        if (dateError) {
            return; // Prevent save if there's a date error
        }
        onSave();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-white">
                <DialogHeader>
                    <DialogTitle>
                        {!editingEducation?.id || editingEducation.id === '0' ? 'Add Education' : 'Edit Education'}
                    </DialogTitle>
                </DialogHeader>

                {/* Form container with custom context menu */}
                <div 
                    ref={formContainerRef}
                    onContextMenu={handleContextMenu}
                    className="space-y-4"
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            School/University <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={editingEducation?.school || ''}
                            onChange={(e) => handleFieldChange('school', e.target.value)}
                            placeholder="Enter school or university name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Degree <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={editingEducation?.degree || ''}
                            onChange={(e) => handleFieldChange('degree', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select degree</option>
                            {DEGREE_OPTIONS.map(d => (
                                <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Major <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={editingEducation?.major || ''}
                            onChange={(e) => handleFieldChange('major', e.target.value)}
                            placeholder="e.g., Computer Science"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Month/Year <span className="text-red-500">*</span>
                            </label>
                            <MonthYearPicker
                                monthValue={editingEducation?.startMonth || ''}
                                yearValue={editingEducation?.startYear || ''}
                                onMonthChange={(value: string) => handleFieldChange('startMonth', value)}
                                onYearChange={(value: string) => handleFieldChange('startYear', value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Month/Year
                            </label>
                            <MonthYearPicker
                                monthValue={editingEducation?.endMonth || ''}
                                yearValue={editingEducation?.endYear || ''}
                                onMonthChange={(value: string) => handleFieldChange('endMonth', value)}
                                onYearChange={(value: string) => handleFieldChange('endYear', value)}
                            />
                        </div>
                    </div>

                    {dateError && (
                        <p className="text-sm text-red-500 mt-1">{dateError}</p>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!!dateError}
                        className="bg-gradient-to-r from-[#3a4660] to-gray-400 text-white rounded-lg hover:from-[#3a4660] hover:to-[#3a4660] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>

            {/* Custom Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onAutoFill={fillSampleEducation}
                    onClearFields={clearFields}
                    onClose={closeContextMenu}
                />
            )}
        </Dialog>
    );
}
