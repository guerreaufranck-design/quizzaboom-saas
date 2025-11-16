import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';

interface TimerProps {
  duration: number; // seconds
  onComplete: () => void;
  variant?: 'circular' | 'linear';
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

export const Timer: React.FC<TimerProps> = ({
  duration,
  onComplete,
  variant = 'circular',
  size = 'md',
  color = 'primary',
}) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);

  useEffect(() => {
    setTimeRemaining(duration);
  }, [duration]);

  useEffect(() => {
    if (timeRemaining <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, onComplete]);

  const percentage = (timeRemaining / duration) * 100;
  
  const colors = {
    primary: '#8B3FE8',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  };

  const getColor = () => {
    if (timeRemaining <= 5) return colors.danger;
    if (timeRemaining <= 10) return colors.warning;
    return colors[color];
  };

  if (variant === 'circular') {
    const sizes = { sm: 60, md: 80, lg: 120 };
    const strokeWidths = { sm: 6, md: 8, lg: 12 };
    const circleSize = sizes[size];
    const strokeWidth = strokeWidths[size];
    const radius = (circleSize - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={circleSize} height={circleSize} className="transform -rotate-90">
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            stroke={getColor()}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            'font-bold text-white',
            size === 'sm' && 'text-lg',
            size === 'md' && 'text-2xl',
            size === 'lg' && 'text-4xl'
          )}>
            {timeRemaining}
          </span>
        </div>
      </div>
    );
  }

  // Linear variant
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-white">Time Remaining</span>
        <span className="text-lg font-bold text-white">{timeRemaining}s</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${percentage}%`,
            backgroundColor: getColor(),
          }}
        />
      </div>
    </div>
  );
};
