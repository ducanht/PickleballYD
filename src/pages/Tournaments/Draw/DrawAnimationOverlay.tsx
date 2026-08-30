import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy } from 'lucide-react';

interface DrawAnimationOverlayProps {
  title?: string;
  subtitle?: string;
  onComplete: () => void;
  durationMs?: number;
}

export default function DrawAnimationOverlay({
  title = 'Đang Bốc Thăm Ngẫu Nhiên...',
  subtitle = 'Thuật toán LCG Seeded Shuffle đang xáo trộn công khai minh bạch',
  onComplete,
  durationMs = 2500,
}: DrawAnimationOverlayProps) {
  useEffect(() => {
    // Launch fireworks confetti
    const end = Date.now() + durationMs;
    const interval: NodeJS.Timeout = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        onComplete();
        return;
      }

      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
        colors: ['#f97316', '#38bdf8', '#fbbf24', '#ffffff'],
      });
    }, 250);

    return () => clearInterval(interval);
  }, [onComplete, durationMs]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="flex flex-col items-center text-center space-y-6 max-w-sm">
        {/* Animated Icon Ring */}
        <div className="relative flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-orange-500 animate-bounce" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            {title}
          </h2>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
