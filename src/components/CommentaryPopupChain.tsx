import React, { useEffect, useState } from 'react';

interface PopupItem {
  id: string;
  type: string;
  emoji: string;
  text: string;
  delayMs: number;
  durationMs: number;
}

interface Props {
  popups: PopupItem[];
  variant: 'tv' | 'player';
}

export const CommentaryPopupChain: React.FC<Props> = ({ popups, variant }) => {
  const [visibleIndex, setVisibleIndex] = useState(-1);
  const [animState, setAnimState] = useState<'entering' | 'visible' | 'exiting'>('entering');

  useEffect(() => {
    if (popups.length === 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    popups.forEach((popup, idx) => {
      // Show popup
      timers.push(setTimeout(() => {
        setVisibleIndex(idx);
        setAnimState('entering');
        // Transition to visible after enter animation
        timers.push(setTimeout(() => setAnimState('visible'), 300));
      }, popup.delayMs));

      // Start exit animation before next popup
      timers.push(setTimeout(() => {
        setAnimState('exiting');
      }, popup.delayMs + popup.durationMs - 300));
    });

    return () => timers.forEach(clearTimeout);
  }, [popups]);

  if (visibleIndex < 0 || visibleIndex >= popups.length) return null;

  const current = popups[visibleIndex];

  const animClass =
    animState === 'entering'
      ? 'translate-y-4 opacity-0'
      : animState === 'exiting'
        ? '-translate-y-3 opacity-0'
        : 'translate-y-0 opacity-100';

  const typeColor = {
    stat: 'from-blue-500/90 to-cyan-500/90',
    highlight: 'from-yellow-500/90 to-orange-500/90',
    roast: 'from-red-500/90 to-pink-500/90',
    praise: 'from-green-500/90 to-emerald-500/90',
    joker: 'from-purple-500/90 to-violet-500/90',
  }[current.type] || 'from-blue-500/90 to-cyan-500/90';

  if (variant === 'tv') {
    return (
      <div className="w-full flex justify-center pointer-events-none">
        <div
          className={`
            inline-flex items-center gap-6 px-14 py-8
            bg-gradient-to-r ${typeColor}
            backdrop-blur-xl rounded-3xl
            shadow-2xl border-2 border-white/30
            transition-all duration-500 ease-out
            ${animClass}
          `}
        >
          <span className="text-7xl flex-shrink-0">{current.emoji}</span>
          <p className="text-4xl font-extrabold text-white leading-snug max-w-4xl drop-shadow-lg">
            {current.text}
          </p>
        </div>
      </div>
    );
  }

  // Player variant — bigger and more readable on mobile
  return (
    <div className="w-full pointer-events-none">
      <div
        className={`
          flex items-center gap-4 px-5 py-4
          bg-gradient-to-r ${typeColor}
          backdrop-blur-xl rounded-2xl
          shadow-xl border border-white/25
          transition-all duration-500 ease-out
          ${animClass}
        `}
      >
        <span className="text-4xl flex-shrink-0">{current.emoji}</span>
        <p className="text-lg font-extrabold text-white leading-snug">
          {current.text}
        </p>
      </div>
    </div>
  );
};
