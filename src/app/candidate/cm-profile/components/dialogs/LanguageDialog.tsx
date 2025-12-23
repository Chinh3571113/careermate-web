import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Language } from "../types";

interface LanguageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    languages: Language[];
    onAddLanguage: (language: string, level: string) => Promise<void>;
    onRemoveLanguage: (id: string) => Promise<void>;
    onSave: () => void;
}

const proficiencyLevels = [
    "Beginner",
    "Elementary",
    "Intermediate",
    "Upper Intermediate",
    "Advanced",
    "Native"
];

export default function LanguageDialog({
    open,
    onOpenChange,
    languages,
    onAddLanguage,
    onRemoveLanguage,
    onSave
}: LanguageDialogProps) {
    const [newLanguage, setNewLanguage] = useState("");
    const [newLevel, setNewLevel] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const handleAddLanguage = async () => {
        if (newLanguage.trim() && newLevel && !isAdding) {
            setIsAdding(true);
            try {
                await onAddLanguage(newLanguage.trim(), newLevel);
                setNewLanguage("");
                setNewLevel("");
            } finally {
                setIsAdding(false);
            }
        }
    };

    const handleRemoveLanguage = async (id: string) => {
        await onRemoveLanguage(id);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-white">
                <DialogHeader>
                    <DialogTitle>Foreign Languages</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="grid grid-cols-[1fr,1fr,auto] gap-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Language
                            </label>
                            <Input
                                value={newLanguage}
                                onChange={(e) => setNewLanguage(e.target.value)}
                                placeholder="e.g., English, French"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddLanguage();
                                    }
                                }}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Proficiency Level
                            </label>
                            <select
                                value={newLevel}
                                onChange={(e) => setNewLevel(e.target.value)}
                                className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value="">Select level</option>
                                {proficiencyLevels.map((level) => (
                                    <option key={level} value={level}>
                                        {level}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="pt-6">
                            <Button
                                onClick={handleAddLanguage}
                                disabled={!newLanguage.trim() || !newLevel || isAdding}
                                className="bg-gradient-to-r from-[#3a4660] to-gray-400 text-white rounded-lg hover:from-[#3a4660] hover:to-[#3a4660]"
                            >
                                {isAdding ? "Adding..." : "Add"}
                            </Button>
                        </div>
                    </div>

                    {languages.length > 0 && (
                        <div className="border rounded-lg divide-y">
                            {languages.map((lang) => (
                                <div
                                    key={lang.id}
                                    className="flex items-center justify-between p-3 hover:bg-gray-50"
                                >
                                    <div>
                                        <div className="font-medium text-gray-900">{lang.language}</div>
                                        <div className="text-sm text-gray-600">{lang.level}</div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRemoveLanguage(lang.id)}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {languages.length === 0 && (
                        <div className="text-center py-8 text-gray-500 border rounded-lg">
                            No languages added yet. Add your language skills above.
                        </div>
                    )}
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
