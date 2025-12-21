import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MonthYearPicker from "../MonthYearPicker";
import { HighlightProject } from "../types";

interface ProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingProject: HighlightProject | null;
    onEditingProjectChange: (project: HighlightProject | null) => void;
    onSave: () => void;
}

export default function ProjectDialog({
    open,
    onOpenChange,
    editingProject,
    onEditingProjectChange,
    onSave
}: ProjectDialogProps) {
    const handleFieldChange = (field: keyof HighlightProject, value: any) => {
        if (editingProject) {
            onEditingProjectChange({
                ...editingProject,
                [field]: value
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-white">
                <DialogHeader>
                    <DialogTitle>
                        {!editingProject?.id || editingProject.id === '0' ? 'Add Highlight Project' : 'Edit Project'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Project Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={editingProject?.name || ''}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            placeholder="Enter project name"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Month/Year <span className="text-red-500">*</span>
                            </label>
                            <MonthYearPicker
                                monthValue={editingProject?.startMonth || ''}
                                yearValue={editingProject?.startYear || ''}
                                onMonthChange={(value: string) => handleFieldChange('startMonth', value)}
                                onYearChange={(value: string) => handleFieldChange('startYear', value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Month/Year <span className="text-red-500">*</span>
                            </label>
                            <MonthYearPicker
                                monthValue={editingProject?.endMonth || ''}
                                yearValue={editingProject?.endYear || ''}
                                onMonthChange={(value: string) => handleFieldChange('endMonth', value)}
                                onYearChange={(value: string) => handleFieldChange('endYear', value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Project URL
                        </label>
                        <Input
                            value={editingProject?.url || ''}
                            onChange={(e) => handleFieldChange('url', e.target.value)}
                            placeholder="https://github.com/username/project"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <Textarea
                            value={editingProject?.description || ''}
                            onChange={(e) => handleFieldChange('description', e.target.value)}
                            placeholder="Describe your role, technologies used, and key achievements..."
                            rows={4}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={onSave}
                        className="bg-gradient-to-r from-[#3a4660] to-gray-400 text-white rounded-lg hover:from-[#3a4660] hover:to-[#3a4660]"
                    >
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
