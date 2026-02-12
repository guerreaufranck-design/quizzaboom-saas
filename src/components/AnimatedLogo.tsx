import React, { useState } from 'react';

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'h-16',
  md: 'h-24',
  lg: 'h-40',
};

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ size = 'md', className = '' }) => {
  const [videoError, setVideoError] = useState(false);

  if (videoError) {
    // Fallback: gradient text logo
    const textSizes = {
      sm: 'text-2xl',
      md: 'text-4xl',
      lg: 'text-6xl',
    };

    return (
      <div className={`${className}`}>
        <span className={`${textSizes[size]} font-bold bg-gradient-to-r from-qb-magenta via-qb-purple to-qb-cyan bg-clip-text text-transparent`}>
          QuizzaBoom
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-block ${className}`}>
      <video
        autoPlay
        loop
        muted
        playsInline
        className={`${SIZE_CLASSES[size]} w-auto object-contain`}
        onError={() => setVideoError(true)}
      >
        <source src="/images/logo-animated.mp4" type="video/mp4" />
      </video>
    </div>
  );
};
