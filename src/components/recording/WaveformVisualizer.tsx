"use client";

const BAR_COUNT = 16;

interface WaveformVisualizerProps {
  audioLevel: number;
  isActive: boolean;
}

export function WaveformVisualizer({ audioLevel, isActive }: WaveformVisualizerProps) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-12" aria-hidden="true">
      {Array.from({ length: BAR_COUNT }, (_, i) => {
        // Create a wave-like distribution from center
        const distFromCenter = Math.abs(i - BAR_COUNT / 2) / (BAR_COUNT / 2);
        const baseHeight = isActive ? 0.15 : 0.08;
        const scale = isActive
          ? audioLevel * (1 - distFromCenter * 0.6) + baseHeight
          : baseHeight;
        const heightPx = Math.max(4, Math.min(48, scale * 48));

        return (
          <div
            key={i}
            className="w-1.5 rounded-full bg-purple-500 transition-[height] duration-75"
            style={{ height: `${heightPx}px` }}
          />
        );
      })}
    </div>
  );
}
