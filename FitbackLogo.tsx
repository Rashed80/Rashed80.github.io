import React from 'react';
import { FITBACK_LOGO_DATA_URI, FITBACK_LOGO_URL } from './logoData';

interface FitbackLogoProps {
  className?: string;
  height?: number | string;
  showTagline?: boolean;
}

export const FitbackLogo: React.FC<FitbackLogoProps> = ({
  className = 'h-10',
}) => {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <img
        src={FITBACK_LOGO_DATA_URI}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = FITBACK_LOGO_URL;
        }}
        alt="Fitback Reset Logo"
        referrerPolicy="no-referrer"
        className="h-full w-auto max-w-full object-contain"
      />
    </div>
  );
};

