import React, { useRef, useEffect, useState } from 'react';

/**
 * AutoFitText — dynamically scales font size to fit its container.
 * Uses a hidden measurement div for accurate binary-search sizing.
 * Works across all languages (FR, DE, ES, EN) regardless of text length.
 *
 * The outer div is the "viewport" (overflow-hidden, takes full parent size).
 * A hidden offscreen clone measures text height at various font sizes.
 * Once the best size is found, it's applied to the visible text.
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

      // Available space = container size minus padding (4% top/bottom, 5% left/right)
      const rect = container.getBoundingClientRect();
      const availW = Math.floor(rect.width * 0.90);
      const availH = Math.floor(rect.height * 0.92);

      if (availW <= 0 || availH <= 0) {
        // Container not rendered yet — retry
        rafRef.current = requestAnimationFrame(measure);
        return;
      }

      // Create offscreen measurement element
      const probe = document.createElement('div');
      probe.style.cssText = `
        position:absolute; left:-9999px; top:-9999px;
        width:${availW}px;
        word-wrap:break-word; overflow-wrap:break-word;
        text-align:center; line-height:1.18;
        visibility:hidden; pointer-events:none;
      `;
      // Copy font-related computed styles from container
      const cs = window.getComputedStyle(container);
      probe.style.fontFamily = cs.fontFamily;
      probe.style.fontWeight = cs.fontWeight || '400';
      probe.textContent = text;
      document.body.appendChild(probe);

      // Binary search for largest fitting font size
      let lo = minFontSize;
      let hi = Math.min(maxFontSize, availH);
      let best = lo;

      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        probe.style.fontSize = `${mid}px`;
        const h = probe.scrollHeight;

        if (h <= availH) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }

      document.body.removeChild(probe);
      setFontSize(best);
    };

    // Run immediately + after animations (500ms)
    rafRef.current = requestAnimationFrame(() => {
      measure();
      timerRef.current = setTimeout(measure, 550);
    });

    // ResizeObserver for container changes
    let ro: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(measure);
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
