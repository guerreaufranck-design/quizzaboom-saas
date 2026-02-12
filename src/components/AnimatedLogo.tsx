import React, { useState, useRef, useEffect } from 'react';

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'h-16',
  md: 'h-28',
  lg: 'h-48',
  xl: 'h-64',
};

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ size = 'md', className = '' }) => {
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Force autoplay — React's autoPlay attribute is unreliable on some browsers
  useEffect(() => {
    const video = videoRef.current;
    if (!video || videoError) return;

    video.muted = true; // Required for autoplay policy
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay blocked — retry on user interaction
        const handleInteraction = () => {
          video.play().catch(() => {});
          document.removeEventListener('click', handleInteraction);
          document.removeEventListener('touchstart', handleInteraction);
        };
        document.addEventListener('click', handleInteraction);
        document.addEventListener('touchstart', handleInteraction);
      });
    }
  }, [videoError]);

  if (videoError) {
    // Fallback: gradient text logo
    const textSizes = {
      sm: 'text-2xl',
      md: 'text-4xl',
      lg: 'text-6xl',
      xl: 'text-8xl',
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
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className={`${SIZE_CLASSES[size]} w-auto object-contain`}
        onError={() => setVideoError(true)}
      >
        <source src="/images/logo-animated.mp4" type="video/mp4" />
      </video>
    </div>
  );
};
