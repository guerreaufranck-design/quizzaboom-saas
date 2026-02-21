import React, { useRef, useEffect, useState } from 'react';

/**
 * AutoFitText — dynamically scales font size to fit its container.
 * Uses actual DOM measurement for accurate sizing across all languages.
 * Falls back to a length-based estimate for the first render (avoids flash).
 */
export const AutoFitText: React.FC<{
  text: string;
  className?: string;
  minFontSize?: number;
  maxFontSize?: number;
}> = ({ text, className = '', minFontSize = 12, maxFontSize = 200 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<number>(minFontSize);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const fitText = () => {
      const container = containerRef.current;
      const textEl = textRef.current;
      if (!container || !textEl || !text) return;

      // Use the container's actual rendered size (inside padding)
      const containerW = container.clientWidth;
      const containerH = container.clientHeight;

      if (containerW <= 0 || containerH <= 0) {
        // Container not yet sized (animation pending) — retry next frame
        rafRef.current = requestAnimationFrame(fitText);
        return;
      }

      // Binary search for the largest font size that fits
      let lo = minFontSize;
      let hi = Math.min(maxFontSize, Math.round(containerH * 0.95));
      let best = lo;

      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        textEl.style.fontSize = `${mid}px`;

        // scrollHeight is the true content height after word-wrap
        const fits = textEl.scrollHeight <= containerH && textEl.scrollWidth <= containerW;

        if (fits) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }

      textEl.style.fontSize = `${best}px`;
      setFontSize(best);
    };

    // Run after a frame so the container has its final size
    rafRef.current = requestAnimationFrame(() => {
      fitText();
      // Re-run after animations settle (CSS animations take ~500ms)
      setTimeout(fitText, 600);
    });

    // ResizeObserver for container changes (flex recalc, window resize)
    let ro: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(fitText);
      });
      ro.observe(containerRef.current);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro?.disconnect();
    };
  }, [text, minFontSize, maxFontSize]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-hidden"
      style={{ padding: '4% 5%' }}
    >
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
