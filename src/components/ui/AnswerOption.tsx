import React from 'react';
import { cn } from '../../utils/cn';

interface AnswerOptionProps {
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
  selected?: boolean;
  correct?: boolean;
  incorrect?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export const AnswerOption: React.FC<AnswerOptionProps> = ({
  letter,
  text,
  selected = false,
  correct = false,
  incorrect = false,
  disabled = false,
  onClick,
}) => {
  const letterColors = {
    A: 'bg-red-500',
    B: 'bg-blue-500',
    C: 'bg-yellow-500',
    D: 'bg-green-500',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300',
        'border-2 text-left',
        disabled && 'cursor-not-allowed opacity-50',
        !disabled && 'hover:scale-102 active:scale-98 cursor-pointer',
        selected && !correct && !incorrect && 'border-white bg-white/10',
        !selected && !correct && !incorrect && 'border-white/20 bg-white/5 hover:bg-white/10',
        correct && 'border-green-500 bg-green-500/20',
        incorrect && 'border-red-500 bg-red-500/20'
      )}
    >
      {/* Letter Badge */}
      <div
        className={cn(
          'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center',
          'text-white font-bold text-xl',
          letterColors[letter]
        )}
      >
        {letter}
      </div>

      {/* Text */}
      <div className="flex-1">
        <p className="text-white font-medium text-lg">{text}</p>
      </div>

      {/* Status Indicator */}
      {correct && (
        <div className="flex-shrink-0 text-2xl">✓</div>
      )}
      {incorrect && (
        <div className="flex-shrink-0 text-2xl">✗</div>
      )}
    </button>
  );
};
