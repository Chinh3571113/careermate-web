/**
 * Shared Profile Progress Circle Component
 * Used in both Dashboard and CM Profile pages with consistent colors
 */

interface ProfileProgressCircleProps {
  completion: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

// Helper function to get progress circle color based on completion
const getProgressColor = (completion: number) => {
  if (completion >= 100) {
    return { start: "#16a34a", end: "#22c55e", text: "text-green-600" }; // green-600 to green-500
  } else if (completion >= 70) {
    return { start: "#163988", end: "#3b82f6", text: "text-blue-600" }; // blue
  } else if (completion >= 40) {
    return { start: "#d97706", end: "#fbbf24", text: "text-amber-600" }; // amber-600 to amber-400
  } else {
    return { start: "#6b7280", end: "#9ca3af", text: "text-gray-600" }; // gray
  }
};

// Size configurations
const sizeConfigs = {
  sm: { container: "w-20 h-20", text: "text-lg", label: "text-[10px]" },
  md: { container: "w-32 h-32", text: "text-2xl", label: "text-xs" },
  lg: { container: "w-36 h-36", text: "text-4xl", label: "text-sm" },
  xl: { container: "w-44 h-44", text: "text-5xl", label: "text-base" }
};

export function ProfileProgressCircle({ 
  completion, 
  size = 'md',
  showLabel = true 
}: ProfileProgressCircleProps) {
  const progressColor = getProgressColor(completion);
  const sizeConfig = sizeConfigs[size];

  return (
    <div className={`relative ${sizeConfig.container}`}>
      <svg className="w-full h-full" viewBox="0 0 36 36">
        <defs>
          <linearGradient
            id={`progressGradient-${completion}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={progressColor.start} />
            <stop offset="100%" stopColor={progressColor.end} />
          </linearGradient>
        </defs>

        {/* Background Circle */}
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="#eeeeee"
          strokeWidth="3"
        />

        {/* Progress Circle */}
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke={`url(#progressGradient-${completion})`}
          strokeWidth="3"
          strokeDasharray={`${completion}, 100`}
        />
      </svg>

      {/* Text Center */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <div className={`${sizeConfig.text} font-bold ${progressColor.text}`}>
          {completion}%
        </div>
        {showLabel && (
          <div className={`${sizeConfig.label} text-gray-500`}>completed</div>
        )}
      </div>
    </div>
  );
}
