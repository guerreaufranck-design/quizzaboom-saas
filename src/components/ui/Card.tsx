import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  gradient = false,
  hover = false,
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl p-6 border border-white/10',
        gradient
          ? 'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm'
          : 'bg-qb-card',
        hover && 'hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
};
