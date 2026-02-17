import React, { useRef, useEffect, useState } from 'react';

/**
 * AutoFitText — dynamically scales text to FILL its parent container.
 * Uses binary search to find the maximum font size that fits without overflow.
 * The parent MUST have a defined width and height (e.g. flex-1, h-full, explicit px/%).
 */
export const AutoFitText: React.FC<{
  text: string;
  className?: string;
  minFontSize?: number;
  maxFontSize?: number;
  padding?: number;
}> = ({ text, className = '', minFontSize = 16, maxFontSize = 200, padding = 0 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(minFontSize);

  useEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl || !text) return;

    const maxW = container.clientWidth - padding * 2;
    const maxH = container.clientHeight - padding * 2;
    if (maxW <= 0 || maxH <= 0) return;

    // Binary search for the largest font size that fits
    let lo = minFontSize;
    let hi = maxFontSize;
    let best = minFontSize;

    // Temporarily make text visible for measurement
    textEl.style.visibility = 'hidden';
    textEl.style.position = 'absolute';
    textEl.style.width = `${maxW}px`;
    textEl.style.whiteSpace = 'normal';
    textEl.style.wordBreak = 'break-word';

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      textEl.style.fontSize = `${mid}px`;
      const fits = textEl.scrollHeight <= maxH && textEl.scrollWidth <= maxW;
      if (fits) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    // Reset measurement styles
    textEl.style.visibility = '';
    textEl.style.position = '';
    textEl.style.width = '';
    textEl.style.whiteSpace = '';
    textEl.style.wordBreak = '';

    setFontSize(best);
  }, [text, minFontSize, maxFontSize, padding]);

  // Re-fit on window resize
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const textEl = textRef.current;
      if (!container || !textEl || !text) return;

      const maxW = container.clientWidth - padding * 2;
      const maxH = container.clientHeight - padding * 2;
      if (maxW <= 0 || maxH <= 0) return;

      let lo = minFontSize;
      let hi = maxFontSize;
      let best = minFontSize;

      textEl.style.visibility = 'hidden';
      textEl.style.position = 'absolute';
      textEl.style.width = `${maxW}px`;
      textEl.style.whiteSpace = 'normal';
      textEl.style.wordBreak = 'break-word';

      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        textEl.style.fontSize = `${mid}px`;
        const fits = textEl.scrollHeight <= maxH && textEl.scrollWidth <= maxW;
        if (fits) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }

      textEl.style.visibility = '';
      textEl.style.position = '';
      textEl.style.width = '';
      textEl.style.whiteSpace = '';
      textEl.style.wordBreak = '';

      setFontSize(best);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [text, minFontSize, maxFontSize, padding]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden">
      <div
        ref={textRef}
        className={`text-center leading-tight ${className}`}
        style={{ fontSize: `${fontSize}px` }}
      >
        {text}
      </div>
    </div>
  );
};
