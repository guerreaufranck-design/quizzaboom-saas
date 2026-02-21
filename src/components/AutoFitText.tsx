import React, { useRef, useEffect, useState } from 'react';

/**
 * AutoFitText — dynamically scales font size to fit its container.
 * Uses an offscreen probe element for accurate binary-search measurement.
 * Works across all languages (FR, DE, ES, EN) regardless of text length.
 *
 * IMPORTANT: Uses offsetWidth/offsetHeight (not getBoundingClientRect)
 * because CSS animations with transform:scale affect getBoundingClientRect
 * but NOT offsetWidth/offsetHeight.
 */
export const AutoFitText: React.FC<{
  text: string;
  className?: string;
  minFontSize?: number;
  maxFontSize?: number;
}> = ({ text, className = '', minFontSize = 12, maxFontSize = 200 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<number>(minFontSize);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!text) return;

    const measure = () => {
      const container = containerRef.current;
      if (!container) return;

      // offsetWidth/offsetHeight are NOT affected by CSS transforms (scale animations)
      // This gives the true CSS layout size, not the visually transformed size
      const rawW = container.offsetWidth;
      const rawH = container.offsetHeight;

      if (rawW <= 0 || rawH <= 0) {
        // Container not rendered yet — retry
        rafRef.current = requestAnimationFrame(measure);
        return;
      }

      // Subtract padding (4% top/bottom, 5% left/right)
      const availW = Math.floor(rawW * 0.90);
      const availH = Math.floor(rawH * 0.92);

      // Create offscreen measurement element
      const probe = document.createElement('div');
      probe.style.cssText = [
        'position:absolute',
        'left:-9999px',
        'top:-9999px',
        `width:${availW}px`,
        'word-wrap:break-word',
        'overflow-wrap:break-word',
        'text-align:center',
        'line-height:1.18',
        'visibility:hidden',
        'pointer-events:none',
      ].join(';');

      // Copy font styles
      const cs = window.getComputedStyle(container);
      probe.style.fontFamily = cs.fontFamily;
      probe.style.fontWeight = cs.fontWeight || '400';
      probe.textContent = text;
      document.body.appendChild(probe);

      // Binary search: find largest font size where text fits in availH
      let lo = minFontSize;
      let hi = Math.min(maxFontSize, availH);
      let best = lo;

      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        probe.style.fontSize = `${mid}px`;

        if (probe.scrollHeight <= availH) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }

      document.body.removeChild(probe);
      setFontSize(best);
    };

    // Measure after layout (rAF) + re-measure after CSS animations settle
    rafRef.current = requestAnimationFrame(() => {
      measure();
      // Re-measure after animations (pop-in/slide-up are ~500ms)
      timerRef.current = setTimeout(measure, 600);
    });

    // ResizeObserver for container changes (window resize, flex recalc)
    let ro: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      let debounceTimer: NodeJS.Timeout | null = null;
      ro = new ResizeObserver(() => {
        // Debounce: only measure after resize stops (avoids mid-animation flicker)
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(measure, 100);
      });
      ro.observe(containerRef.current);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
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
        className={`text-center break-words leading-[1.18] w-full ${className}`}
        style={{ fontSize: `${fontSize}px` }}
      >
        {text}
      </div>
    </div>
  );
};
