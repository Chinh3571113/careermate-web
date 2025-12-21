import { SquarePlus, Trash2 } from "lucide-react";
import { FiEdit } from "react-icons/fi";
import { Certificate } from "./types";

interface CertificatesSectionProps {
    certificates: Certificate[];
    onAdd: () => void;
    onEdit: (certificate: Certificate) => void;
    onRemove: (id: string) => void;
}

export default function CertificatesSection({
    certificates,
    onAdd,
    onEdit,
    onRemove
}: CertificatesSectionProps) {
    const isEmpty = certificates.length === 0;
    
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${isEmpty ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">
                    Certificates
                </h2>
                <button
                    className="text-gray-600 hover:text-gray-700 p-2"
                    onClick={onAdd}
                >
                    <SquarePlus className="w-4 h-4" />
                </button>
            </div>
            {certificates.length === 0 ? (
                <p className="text-gray-400 text-sm italic mt-1">
                    Provides evidence of your specific expertise and skills
                </p>
            ) : (
                <div className="space-y-3">
                    {certificates.map((c) => (
                        <div key={c.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 text-base mb-1">
                                        {c.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-1">
                                        {c.org}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {c.month}/{c.year}
                                    </p>
                                    {c.url && (
                                        <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 block">
                                            {c.url}
                                        </a>
                                    )}
                                    {c.desc && (
                                        <p className="text-sm text-gray-700 mt-2">{c.desc}</p>
                                    )}
                                </div>
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => onEdit(c)}
                                        className="text-gray-400 hover:text-blue-600 p-1.5"
                                        title="Edit certificate"
                                    >
                                        <FiEdit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onRemove(c.id)}
                                        className="text-gray-400 hover:text-red-600 p-1.5"
                                        title="Delete certificate"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
