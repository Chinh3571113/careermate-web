import { SquarePlus, Trash2 } from "lucide-react";
import { FiEdit } from "react-icons/fi";
import { Language } from "./types";

interface LanguageSectionProps {
    languages: Language[];
    onAdd: () => void;
    onEdit: (language: Language) => void;
    onRemove: (id: string) => void;
}

export default function LanguageSection({
    languages,
    onAdd,
    onEdit,
    onRemove
}: LanguageSectionProps) {
    const isEmpty = languages.length === 0;
    
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${isEmpty ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Foreign Language</h2>
                <button
                    onClick={onAdd}
                    className="text-gray-600 hover:text-gray-700 p-2"
                >
                    <SquarePlus className="w-4 h-4" />
                </button>
            </div>

            {languages.length > 0 ? (
                <div className="space-y-2">
                    {languages.map((lang) => (
                        <div key={lang.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <div>
                                <span className="font-medium text-gray-900">{lang.language}</span>
                                <span className="text-gray-500 ml-2">({lang.level})</span>
                            </div>
                            <div className="flex space-x-1">
                                <button
                                    onClick={() => onEdit(lang)}
                                    className="text-gray-400 hover:text-blue-600 p-1.5"
                                    title="Edit language"
                                >
                                    <FiEdit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onRemove(lang.id)}
                                    className="text-gray-400 hover:text-red-600 p-1.5"
                                    title="Delete language"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-400 text-sm italic mt-1">
                    List languages (0/5)
                </p>
            )}
        </div>
    );
}
