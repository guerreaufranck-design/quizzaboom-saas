import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input: React.FC<InputProps> = ({ error, className, ...props }) => {
  return (
    <div className="w-full">
      <input
        className={cn(
          'w-full px-4 py-3 rounded-xl',
          'bg-qb-darker border-2 border-white/20',
          'text-white placeholder-white/50',
          'focus:border-qb-cyan focus:outline-none',
          'transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-red-400 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};
