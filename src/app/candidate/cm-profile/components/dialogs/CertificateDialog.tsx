import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MonthYearPicker from "../MonthYearPicker";
import { Certificate } from "../types";

interface CertificateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingCertificate: Certificate | null;
    onEditingCertificateChange: (cert: Certificate | null) => void;
    onSave: () => void;
}

export default function CertificateDialog({
    open,
    onOpenChange,
    editingCertificate,
    onEditingCertificateChange,
    onSave
}: CertificateDialogProps) {
    const handleFieldChange = (field: keyof Certificate, value: any) => {
        if (editingCertificate) {
            onEditingCertificateChange({
                ...editingCertificate,
                [field]: value
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-white">
                <DialogHeader>
                    <DialogTitle>
                        {!editingCertificate?.id || editingCertificate.id === '0' ? 'Add Certificate' : 'Edit Certificate'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Certificate Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={editingCertificate?.name || ''}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            placeholder="Enter certificate name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Issuing Organization <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={editingCertificate?.org || ''}
                            onChange={(e) => handleFieldChange('org', e.target.value)}
                            placeholder="Enter organization name"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Issue Month/Year <span className="text-red-500">*</span>
                            </label>
                            <MonthYearPicker
                                monthValue={editingCertificate?.month || ''}
                                yearValue={editingCertificate?.year || ''}
                                onMonthChange={(value: string) => handleFieldChange('month', value)}
                                onYearChange={(value: string) => handleFieldChange('year', value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Certificate URL
                        </label>
                        <Input
                            value={editingCertificate?.url || ''}
                            onChange={(e) => handleFieldChange('url', e.target.value)}
                            placeholder="https://example.com/certificate"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <Textarea
                            value={editingCertificate?.desc || ''}
                            onChange={(e) => handleFieldChange('desc', e.target.value)}
                            placeholder="Describe what skills or knowledge this certificate validates..."
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
