import React from 'react';
import { cn } from '../../utils/cn';

interface AnswerOptionProps {
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
  selected?: boolean;
  disabled?: boolean;
  correct?: boolean;
  wrong?: boolean;
  onClick?: () => void;
}

export const AnswerOption: React.FC<AnswerOptionProps> = ({
  letter,
  text,
  selected = false,
  disabled = false,
  correct = false,
  wrong = false,
  onClick,
}) => {
  const getBackgroundColor = () => {
    if (correct) return 'bg-green-500 border-green-400';
    if (wrong) return 'bg-red-500 border-red-400';
    if (selected) return 'bg-qb-cyan border-qb-cyan scale-105';
    return 'bg-qb-darker border-white/20 hover:border-qb-cyan hover:bg-white/5';
  };

  const getTextColor = () => {
    if (correct || wrong || selected) return 'text-white';
    return 'text-white/90';
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full p-4 rounded-xl border-2 transition-all duration-300 text-left',
        'flex items-center gap-4',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        getBackgroundColor(),
        getTextColor()
      )}
    >
      <div className={cn(
        'w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl',
        correct ? 'bg-green-600' : wrong ? 'bg-red-600' : selected ? 'bg-qb-cyan/20' : 'bg-white/10'
      )}>
        {letter}
      </div>
      <div className="flex-1 text-lg font-medium">
        {text}
      </div>
      {correct && (
        <div className="text-2xl">✅</div>
      )}
      {wrong && (
        <div className="text-2xl">❌</div>
      )}
    </button>
  );
};
