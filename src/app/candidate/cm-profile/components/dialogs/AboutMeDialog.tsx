import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AboutMeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    value: string;
    onChange: (value: string) => void;
    onSave: () => void;
    maxLength?: number;
}

export default function AboutMeDialog({
    open,
    onOpenChange,
    value,
    onChange,
    onSave,
    maxLength = 256
}: AboutMeDialogProps) {
    const charCount = value.length;

    const handleChange = (newValue: string) => {
        if (newValue.length <= maxLength) {
            onChange(newValue);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl bg-white">
                <DialogHeader>
                    <DialogTitle>About Me</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                            <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white text-xs font-bold">!</span>
                            </div>
                            <div>
                                <span className="font-medium text-orange-800">Tips:</span>
                                <span className="text-orange-700 ml-1">
                                    Summarize your professional experience, highlight your skills and your strengths.
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Rich text editor toolbar
                    <div className="border-b border-gray-200 pb-2">
                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-gray-100 rounded" type="button">
                                <strong>B</strong>
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded italic" type="button">
                                I
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded underline" type="button">
                                U
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded" type="button">
                                ≡
                            </button>
                        </div>
                    </div> */}

                    <div className="space-y-2">
                        <Textarea
                            value={value}
                            onChange={(e) => handleChange(e.target.value)}
                            rows={8}
                            className="resize-none"
                            placeholder="Summarize your professional experience, highlight your skills and your strengths..."
                        />
                        <div className="text-right text-sm text-gray-500">
                            {charCount}/{maxLength} characters remaining
                        </div>
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
