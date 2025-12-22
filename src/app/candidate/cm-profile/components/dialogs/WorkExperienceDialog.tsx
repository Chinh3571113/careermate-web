import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MonthYearPicker from "../MonthYearPicker";
import { WorkExperience } from "../types";
import { useState, useEffect } from "react";

interface WorkExperienceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingWorkExp: WorkExperience | null;
    onEditingWorkExpChange: (exp: WorkExperience | null) => void;
    onSave: () => void;
}

export default function WorkExperienceDialog({
    open,
    onOpenChange,
    editingWorkExp,
    onEditingWorkExpChange,
    onSave
}: WorkExperienceDialogProps) {
    const [dateError, setDateError] = useState<string>("");

    // Validate dates whenever they change
    useEffect(() => {
        if (editingWorkExp?.startMonth && editingWorkExp?.startYear && 
            editingWorkExp?.endMonth && editingWorkExp?.endYear) {
            const startDate = new Date(parseInt(editingWorkExp.startYear), parseInt(editingWorkExp.startMonth) - 1);
            const endDate = new Date(parseInt(editingWorkExp.endYear), parseInt(editingWorkExp.endMonth) - 1);
            
            if (endDate < startDate) {
                setDateError("Please enter an end date bigger than the start date.");
            } else {
                setDateError("");
            }
        } else {
            setDateError("");
        }
    }, [editingWorkExp?.startMonth, editingWorkExp?.startYear, editingWorkExp?.endMonth, editingWorkExp?.endYear]);

    const handleFieldChange = (field: keyof WorkExperience, value: any) => {
        if (editingWorkExp) {
            onEditingWorkExpChange({
                ...editingWorkExp,
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
                        {!editingWorkExp?.id || editingWorkExp.id === '0' ? 'Add Work Experience' : 'Edit Work Experience'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Company Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={editingWorkExp?.company || ''}
                            onChange={(e) => handleFieldChange('company', e.target.value)}
                            placeholder="Enter company name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Job Title <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={editingWorkExp?.jobTitle || ''}
                            onChange={(e) => handleFieldChange('jobTitle', e.target.value)}
                            placeholder="e.g., Senior Software Engineer"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Month/Year <span className="text-red-500">*</span>
                            </label>
                            <MonthYearPicker
                                monthValue={editingWorkExp?.startMonth || ''}
                                yearValue={editingWorkExp?.startYear || ''}
                                onMonthChange={(value: string) => handleFieldChange('startMonth', value)}
                                onYearChange={(value: string) => handleFieldChange('startYear', value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Month/Year <span className="text-red-500">*</span>
                            </label>
                            <MonthYearPicker
                                monthValue={editingWorkExp?.endMonth || ''}
                                yearValue={editingWorkExp?.endYear || ''}
                                onMonthChange={(value: string) => handleFieldChange('endMonth', value)}
                                onYearChange={(value: string) => handleFieldChange('endYear', value)}
                            />
                        </div>
                    </div>
                    
                    {dateError && (
                        <p className="text-sm text-red-500 mt-1">{dateError}</p>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Project/Responsibilities
                        </label>
                        <Input
                            value={editingWorkExp?.project || ''}
                            onChange={(e) => handleFieldChange('project', e.target.value)}
                            placeholder="Main project or key responsibility"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <Textarea
                            value={editingWorkExp?.description || ''}
                            onChange={(e) => handleFieldChange('description', e.target.value)}
                            placeholder="Describe your key achievements, responsibilities, and technologies used..."
                            rows={4}
                        />
                    </div>
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
        </Dialog>
    );
}
