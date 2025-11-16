import React from 'react';
import { cn } from '../../utils/cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ error, className, children, ...props }) => {
  return (
    <div className="w-full">
      <select
        className={cn(
          'w-full px-4 py-3 rounded-xl',
          'bg-qb-darker border-2 border-white/20',
          'text-white',
          'focus:border-qb-cyan focus:outline-none',
          'transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-red-500',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-red-400 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};
