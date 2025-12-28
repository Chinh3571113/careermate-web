"use client";

import { useState } from "react";

type SalaryRangeProps = {
    minLimit?: number;
    maxLimit?: number;
    onApply: (range: { min: number; max: number }) => void;
    onReset?: () => void;
};

export default function SalaryRange({
    minLimit = 500,
    maxLimit = 10000,
    onApply,
    onReset,
}: SalaryRangeProps) {
    const [min, setMin] = useState(minLimit);
    const [max, setMax] = useState(maxLimit);

    const handleReset = () => {
        setMin(minLimit);
        setMax(maxLimit);
        onReset?.();
    };

    return (
        <div className="w-80 rounded-xl border bg-white p-4 shadow-lg">
            {/* Label */}
            <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-700">
                    ${min.toLocaleString()} – ${max.toLocaleString()}
                </div>
                {onReset && (
                    <button
                        onClick={handleReset}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                        Reset
                    </button>
                )}
            </div>

            {/* Slider */}
            <div className="relative mb-6 h-6">
                {/* Track */}
                <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded bg-gray-200" />

                {/* Active range */}
                <div
                    className="absolute top-1/2 h-1 -translate-y-1/2 rounded bg-blue-500"
                    style={{
                        left: `${((min - minLimit) / (maxLimit - minLimit)) * 100}%`,
                        right: `${100 - ((max - minLimit) / (maxLimit - minLimit)) * 100}%`,
                    }}
                />

                {/* Min thumb */}
                <input
                    type="range"
                    min={minLimit}
                    max={max}
                    value={min}
                    step={100}
                    onChange={(e) => setMin(Number(e.target.value))}
                    className="range-thumb pointer-events-auto absolute z-10 h-6 w-full appearance-none bg-transparent"
                />

                {/* Max thumb */}
                <input
                    type="range"
                    min={min}
                    max={maxLimit}
                    value={max}
                    step={100}
                    onChange={(e) => setMax(Number(e.target.value))}
                    className="range-thumb pointer-events-auto absolute z-10 h-6 w-full appearance-none bg-transparent"
                />
            </div>

            {/* Apply button */}
            <button
                onClick={() => onApply({ min, max })}
                className="
                        w-full rounded-lg py-2 text-sm font-semibold
                        bg-blue-600 text-white
                        hover:bg-blue-700
">
                Apply
            </button>
        </div>
    );
}
