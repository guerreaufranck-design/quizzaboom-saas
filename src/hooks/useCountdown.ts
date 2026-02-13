import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useCountdown — Timestamp-based countdown hook.
 *
 * Given a `phaseEndTime` (Unix ms timestamp when the phase expires),
 * returns the number of whole seconds remaining.
 *
 * Uses setInterval(200ms) internally for responsive updates:
 * - 200ms is fast enough that displayed seconds change within 200ms of wall-clock boundaries
 * - Only 5 lightweight Date.now() calls/second — negligible CPU overhead
 * - React only re-renders when the integer second value actually changes
 *
 * Calls `onExpire()` exactly once when timer reaches 0.
 * Returns 0 when `phaseEndTime` is null or in the past.
 */
export function useCountdown(
  phaseEndTime: number | null,
  onExpire?: () => void
): number {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  // Keep the callback ref up-to-date without re-subscribing the effect
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const calculate = useCallback(() => {
    if (!phaseEndTime) {
      setSecondsLeft(0);
      return;
    }

    const remaining = Math.ceil((phaseEndTime - Date.now()) / 1000);
    const clamped = Math.max(0, remaining);
    setSecondsLeft(clamped);

    if (clamped <= 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpireRef.current?.();
    }
  }, [phaseEndTime]);

  useEffect(() => {
    if (!phaseEndTime) {
      setSecondsLeft(0);
      expiredRef.current = false;
      return;
    }

    // Reset expired flag when phaseEndTime changes (new phase)
    expiredRef.current = false;

    // Immediate first calculation
    calculate();

    // 200ms interval for smooth updates
    const interval = setInterval(calculate, 200);

    return () => clearInterval(interval);
  }, [phaseEndTime, calculate]);

  return secondsLeft;
}
