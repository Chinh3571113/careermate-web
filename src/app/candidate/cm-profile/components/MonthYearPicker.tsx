interface MonthYearPickerProps {
    monthValue: string;
    yearValue: string;
    onMonthChange: (value: string) => void;
    onYearChange: (value: string) => void;
    label?: string;
    required?: boolean;
}

export default function MonthYearPicker({
    monthValue,
    yearValue,
    onMonthChange,
    onYearChange,
    label,
    required = false
}: MonthYearPickerProps) {
    const months = [
        { value: "01", label: "01" },
        { value: "02", label: "02" },
        { value: "03", label: "03" },
        { value: "04", label: "04" },
        { value: "05", label: "05" },
        { value: "06", label: "06" },
        { value: "07", label: "07" },
        { value: "08", label: "08" },
        { value: "09", label: "09" },
        { value: "10", label: "10" },
        { value: "11", label: "11" },
        { value: "12", label: "12" },
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                    <select
                        value={monthValue}
                        onChange={(e) => onMonthChange(e.target.value)}
                        className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800 bg-white cursor-pointer appearance-none"
                        style={{ 
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 0.5rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1.5em 1.5em',
                            paddingRight: '2.5rem'
                        }}
                    >
                        <option value="">Month</option>
                        {months.map((month) => (
                            <option key={month.value} value={month.value}>
                                {month.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="relative">
                    <select
                        value={yearValue}
                        onChange={(e) => onYearChange(e.target.value)}
                        className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800 bg-white cursor-pointer appearance-none"
                        style={{ 
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 0.5rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1.5em 1.5em',
                            paddingRight: '2.5rem'
                        }}
                    >
                        <option value="">Year</option>
                        {years.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
