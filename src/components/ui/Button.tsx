import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  gradient?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  gradient = false,
  fullWidth = false,
  icon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
  
  const variants = {
    primary: 'bg-qb-purple hover:bg-qb-purple/90 text-white focus:ring-qb-purple/30',
    secondary: 'bg-qb-cyan hover:bg-qb-cyan/90 text-qb-darker focus:ring-qb-cyan/30',
    success: 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500/30',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500/30',
    ghost: 'bg-white/10 hover:bg-white/20 text-white focus:ring-white/30',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };
  
  const gradientStyles = gradient
    ? 'gradient-primary hover:scale-105'
    : variants[variant];

  return (
    <button
      className={cn(
        baseStyles,
        gradientStyles,
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!loading && icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};
