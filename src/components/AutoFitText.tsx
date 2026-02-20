import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * AutoFitText — dynamically scales text to FILL its parent container.
 * Uses binary search to find the maximum font size that fits without overflow.
 * NEVER clips text — always fully visible.
 */
export const AutoFitText: React.FC<{
  text: string;
  className?: string;
  minFontSize?: number;
  maxFontSize?: number;
}> = ({ text, className = '', minFontSize = 14, maxFontSize = 200 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(minFontSize);

  const computeFit = useCallback(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure || !text) return;

    // Available space = container dimensions
    const availW = container.clientWidth;
    const availH = container.clientHeight;
    if (availW <= 0 || availH <= 0) return;

    // Binary search: find max fontSize where text fits
    let lo = minFontSize;
    let hi = maxFontSize;
    let best = minFontSize;

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      measure.style.fontSize = `${mid}px`;
      // scrollHeight/scrollWidth include all overflowing content
      const textH = measure.scrollHeight;
      const textW = measure.scrollWidth;
      if (textH <= availH && textW <= availW) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    setFontSize(best);
  }, [text, minFontSize, maxFontSize]);

  // Compute on mount + text change — retry after CSS animations settle
  useEffect(() => {
    requestAnimationFrame(() => computeFit());
    // Retry after animations (anim-slide/anim-pop) to get correct container size
    const t1 = setTimeout(computeFit, 400);
    const t2 = setTimeout(computeFit, 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [computeFit]);

  // Re-compute on window resize
  useEffect(() => {
    const handleResize = () => computeFit();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [computeFit]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      {/* Hidden measurement div — absolutely positioned, same width as container, word-wrap enabled */}
      <div
        ref={measureRef}
        aria-hidden
        className={`absolute top-0 left-0 w-full break-words leading-[1.2] ${className}`}
        style={{ fontSize: `${fontSize}px`, visibility: 'hidden', pointerEvents: 'none' }}
      >
        {text}
      </div>
      {/* Visible text — centered */}
      <div
        className={`w-full h-full flex items-center justify-center overflow-hidden`}
      >
        <div
          className={`text-center break-words leading-[1.2] w-full ${className}`}
          style={{ fontSize: `${fontSize}px` }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};
