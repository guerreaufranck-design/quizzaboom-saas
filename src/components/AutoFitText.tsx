import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * AutoFitText — dynamically scales font size to fit its container.
 * Uses actual DOM measurement for accurate sizing across all languages.
 * Falls back to a length-based estimate for the first render (avoids flash).
 *
 * Works perfectly inside CSS animations — re-measures on resize.
 */
export const AutoFitText: React.FC<{
  text: string;
  className?: string;
  minFontSize?: number;
  maxFontSize?: number;
}> = ({ text, className = '', minFontSize = 12, maxFontSize = 200 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<number>(() => {
    // Quick initial estimate based on text length (avoids layout flash)
    const len = text?.length || 0;
    if (len <= 10) return maxFontSize;
    if (len <= 30) return Math.round(maxFontSize * 0.7);
    if (len <= 60) return Math.round(maxFontSize * 0.5);
    if (len <= 100) return Math.round(maxFontSize * 0.35);
    if (len <= 150) return Math.round(maxFontSize * 0.25);
    if (len <= 250) return Math.round(maxFontSize * 0.18);
    return Math.round(maxFontSize * 0.14);
  });

  const fitText = useCallback(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl || !text) return;

    const containerW = container.clientWidth * 0.88; // 6% padding each side
    const containerH = container.clientHeight * 0.90; // 5% padding each side

    if (containerW <= 0 || containerH <= 0) return;

    // Binary search for the largest font size that fits
    let lo = minFontSize;
    let hi = Math.min(maxFontSize, containerH); // Can't be taller than container
    let best = lo;

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      textEl.style.fontSize = `${mid}px`;

      // Check if text fits within the container
      const fits = textEl.scrollWidth <= containerW + 1 && textEl.scrollHeight <= containerH + 1;

      if (fits) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    // Apply the best size found
    if (best !== fontSize) {
      setFontSize(best);
    }
    textEl.style.fontSize = `${best}px`;
  }, [text, minFontSize, maxFontSize, fontSize]);

  // Measure on mount, text change, and container resize
  useEffect(() => {
    fitText();

    // Re-measure on window resize
    const handleResize = () => fitText();
    window.addEventListener('resize', handleResize);

    // ResizeObserver for container changes (e.g. animation, flex recalc)
    let ro: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => fitText());
      ro.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      ro?.disconnect();
    };
  }, [fitText]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden px-[6%] py-[5%]">
      <div
        ref={textRef}
        className={`text-center break-words leading-[1.18] w-full ${className}`}
        style={{ fontSize: `${fontSize}px` }}
      >
        {text}
      </div>
    </div>
  );
};
