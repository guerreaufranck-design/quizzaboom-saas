import React from 'react';

/**
 * AutoFitText — scales font size based on text length.
 * Simple, reliable approach: longer text = smaller font.
 * No DOM measurement needed — works perfectly inside CSS animations.
 *
 * The text fills ~75% of the container (12.5% padding on each side).
 */
export const AutoFitText: React.FC<{
  text: string;
  className?: string;
  minFontSize?: number;
  maxFontSize?: number;
}> = ({ text, className = '', minFontSize = 14, maxFontSize = 200 }) => {
  const len = text?.length || 0;

  // Calculate font size: inverse relationship between text length and font size
  // Short text → large font, long text → small font
  let fontSize: number;

  if (len <= 10) {
    fontSize = maxFontSize;
  } else if (len <= 30) {
    // Lerp from 100% to 70% of max
    const t = (len - 10) / 20;
    fontSize = maxFontSize * (1 - t * 0.3);
  } else if (len <= 60) {
    // Lerp from 70% to 45% of max
    const t = (len - 30) / 30;
    fontSize = maxFontSize * (0.7 - t * 0.25);
  } else if (len <= 100) {
    // Lerp from 45% to 30% of max
    const t = (len - 60) / 40;
    fontSize = maxFontSize * (0.45 - t * 0.15);
  } else if (len <= 180) {
    // Lerp from 30% to 18% of max
    const t = (len - 100) / 80;
    fontSize = maxFontSize * (0.30 - t * 0.12);
  } else {
    // Very long text: 18% of max
    fontSize = maxFontSize * 0.18;
  }

  // Clamp between min and max
  fontSize = Math.max(minFontSize, Math.min(maxFontSize, Math.round(fontSize)));

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden px-[8%] py-[6%]">
      <div
        className={`text-center break-words leading-[1.15] w-full ${className}`}
        style={{ fontSize: `${fontSize}px` }}
      >
        {text}
      </div>
    </div>
  );
};
