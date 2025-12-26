"use client";

import React from 'react';
import { User } from 'lucide-react';
import { useFileUrl } from '@/lib/firebase-file';

interface PremiumAvatarProps {
  /** Storage path or download URL */
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isPremium?: boolean;
  showOnline?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-8 h-8',
  xl: 'w-10 h-10',
};

// Online indicator sizes based on avatar size
const onlineSizes = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
  xl: 'w-5 h-5',
};

export function PremiumAvatar({
  src,
  alt = 'User Avatar',
  size = 'md',
  isPremium = false,
  showOnline = false,
  className = '',
}: PremiumAvatarProps) {
  // Use the hook to resolve storage paths to download URLs
  const resolvedUrl = useFileUrl(src);
  
  // Debug logging
  console.log('🖼️ [PremiumAvatar] Debug:', {
    src,
    resolvedUrl,
    size,
    isPremium,
  });
  
  const baseSize = sizeClasses[size];
  const iconSize = iconSizes[size];

  return (
    <div className={`relative inline-block ${className}`}>
      {isPremium && (
        <>
          {/* Outer glowing ring with gradient */}
          <div
            className={`absolute inset-0 ${baseSize} rounded-full animate-spin-slow`}
            style={{
              background: 'conic-gradient(from 0deg, #FFD700, #FFA500, #FFD700, #FFED4E, #FFD700)',
              filter: 'blur(4px)',
              opacity: 0.7,
              padding: '2px',
            }}
          />
          
          {/* Static golden ring */}
          <div
            className={`absolute inset-0 ${baseSize} rounded-full`}
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
              padding: '2px',
            }}
          >
            <div className={`${baseSize} rounded-full`} />
          </div>
        </>
      )}
      
      {/* Avatar Image */}
      <div className={`relative ${baseSize} rounded-full overflow-hidden ${isPremium ? 'border-2 border-transparent' : ''}`}>
        {resolvedUrl ? (
          <img
            src={resolvedUrl}
            alt={alt}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`${baseSize} bg-gray-200 flex items-center justify-center rounded-full`}>
            <User className={`${iconSize} text-gray-500`} />
          </div>
        )}
      </div>
      
      {/* Online Indicator - positioned outside avatar div */}
      {showOnline && (
        <span className={`absolute -bottom-0.5 -right-0.5 ${onlineSizes[size]} rounded-full border-2 border-background bg-green-500`} />
      )}
    </div>
  );
}

// CSS for animation (add to globals.css)
// @keyframes spin-slow {
//   from { transform: rotate(0deg); }
//   to { transform: rotate(360deg); }
// }
// .animate-spin-slow {
//   animation: spin-slow 3s linear infinite;
// }