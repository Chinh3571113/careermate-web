import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MonthYearPicker from "../MonthYearPicker";
import { Award } from "../types";

interface AwardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingAward: Award | null;
    onEditingAwardChange: (award: Award | null) => void;
    onSave: () => void;
}

export default function AwardDialog({
    open,
    onOpenChange,
    editingAward,
    onEditingAwardChange,
    onSave
}: AwardDialogProps) {
    const handleFieldChange = (field: keyof Award, value: any) => {
        if (editingAward) {
            onEditingAwardChange({
                ...editingAward,
                [field]: value
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-white">
                <DialogHeader>
                    <DialogTitle>
                        {!editingAward?.id || editingAward.id === '0' ? 'Add Award' : 'Edit Award'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Award Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={editingAward?.name || ''}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            placeholder="Enter award name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Organization <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={editingAward?.organization || ''}
                            onChange={(e) => handleFieldChange('organization', e.target.value)}
                            placeholder="Enter organization or issuer"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Month/Year <span className="text-red-500">*</span>
                            </label>
                            <MonthYearPicker
                                monthValue={editingAward?.month || ''}
                                yearValue={editingAward?.year || ''}
                                onMonthChange={(value: string) => handleFieldChange('month', value)}
                                onYearChange={(value: string) => handleFieldChange('year', value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <Textarea
                            value={editingAward?.description || ''}
                            onChange={(e) => handleFieldChange('description', e.target.value)}
                            placeholder="Describe what you achieved and why you received this award..."
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
