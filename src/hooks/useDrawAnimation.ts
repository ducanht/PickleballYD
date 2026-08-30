import { useCallback, useRef, useState } from 'react';

export interface SpinState {
  isSpinning: boolean;
  highlightedId: string | null;
  selectedIds: string[];
  phase: 'idle' | 'spinning' | 'revealing' | 'done';
}

/**
 * useDrawAnimation — Controls the spin animation for draw steps
 * @param totalDuration - Total spin duration in ms (default 3500ms)
 * @param onComplete - Callback when animation completes with selected IDs
 */
export function useDrawAnimation(
  poolIds: string[],
  pickCount: 1 | 2,
  onComplete: (picked: string[]) => void,
  totalDuration: number = 3500
) {
  const [state, setState] = useState<SpinState>({
    isSpinning: false,
    highlightedId: null,
    selectedIds: [],
    phase: 'idle',
  });

  const timerRef = useRef<number | null>(null);

  const startSpin = useCallback(() => {
    if (poolIds.length < pickCount) return;
    if (state.isSpinning) return;

    setState(s => ({ ...s, isSpinning: true, phase: 'spinning', selectedIds: [] }));

    const startTime = Date.now();
    let frameCount = 0;

    // Pre-select the winner(s) immediately (hidden from user)
    const shuffled = [...poolIds].sort(() => Math.random() - 0.5);
    const winners = shuffled.slice(0, pickCount);

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);

      // Ease-out: fast at start, slow at end
      // Interval starts at 80ms, ends at 300ms
      const interval = 80 + Math.pow(progress, 2) * 220;

      frameCount++;
      const currentIdx = frameCount % poolIds.length;
      const highlightedId = poolIds[currentIdx];

      setState(s => ({ ...s, highlightedId }));

      if (elapsed >= totalDuration) {
        // Reveal phase — land on the winner
        setState(s => ({
          ...s,
          isSpinning: false,
          phase: 'revealing',
          highlightedId: winners[0],
          selectedIds: winners,
        }));

        setTimeout(() => {
          setState(s => ({ ...s, phase: 'done', highlightedId: null }));
          onComplete(winners);
        }, 800);

        return;
      }

      timerRef.current = window.setTimeout(tick, interval);
    };

    timerRef.current = window.setTimeout(tick, 80);
  }, [poolIds, pickCount, onComplete, totalDuration, state.isSpinning]);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState({ isSpinning: false, highlightedId: null, selectedIds: [], phase: 'idle' });
  }, []);

  return { ...state, startSpin, reset };
}
