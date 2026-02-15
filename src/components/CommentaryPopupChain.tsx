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
            inline-flex items-center gap-4 px-10 py-5
            bg-gradient-to-r ${typeColor}
            backdrop-blur-xl rounded-2xl
            shadow-2xl border border-white/20
            transition-all duration-300 ease-out
            ${animClass}
          `}
        >
          <span className="text-5xl flex-shrink-0">{current.emoji}</span>
          <p className="text-2xl font-bold text-white leading-tight max-w-3xl">
            {current.text}
          </p>
        </div>
      </div>
    );
  }

  // Player variant — compact mobile-friendly
  return (
    <div className="w-full pointer-events-none">
      <div
        className={`
          flex items-center gap-3 px-4 py-3
          bg-gradient-to-r ${typeColor}
          backdrop-blur-xl rounded-xl
          shadow-lg border border-white/20
          transition-all duration-300 ease-out
          ${animClass}
        `}
      >
        <span className="text-2xl flex-shrink-0">{current.emoji}</span>
        <p className="text-sm font-bold text-white leading-tight">
          {current.text}
        </p>
      </div>
    </div>
  );
};
