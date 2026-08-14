import React, { useState } from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  name?: string;
  className?: string;
  sizeClassName?: string;
  alt?: string;
}

// Generate consistent background color based on name
const getInitials = (name?: string): string => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  className = '',
  sizeClassName = 'w-10 h-10',
  alt = 'Avatar',
}) => {
  const [imageError, setImageError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const cleanSrc = src?.trim();
  const initials = getInitials(name);
  const showFallback = !cleanSrc || imageError;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 select-none bg-[#e6f4f1] dark:bg-[#115e59]/30 text-[#005052] dark:text-[#84d4d5] font-bold ${sizeClassName} ${className}`}
    >
      {!showFallback ? (
        <img
          src={cleanSrc}
          alt={alt || name || 'User Avatar'}
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setImageError(true);
            setLoaded(false);
          }}
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : null}

      {showFallback && (
        <span className="text-[0.85em] tracking-tight leading-none">
          {name ? initials : <User className="w-1/2 h-1/2" />}
        </span>
      )}
    </div>
  );
};
