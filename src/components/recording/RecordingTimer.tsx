"use client";

interface RecordingTimerProps {
  duration: number;
  maxDuration: number;
}

export function RecordingTimer({ duration, maxDuration }: RecordingTimerProps) {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progress = Math.min(duration / maxDuration, 1);
  const isNearLimit = duration >= maxDuration - 10;

  return (
    <div className="text-center">
      <div
        className={`text-4xl font-mono font-bold ${
          isNearLimit ? "text-red-600" : "text-purple-800"
        }`}
      >
        {formatTime(duration)} <span className="text-lg text-gray-500">/ {formatTime(maxDuration)}</span>
      </div>
      {/* Progress bar */}
      <div className="w-48 h-1.5 bg-purple-200 rounded-full mx-auto mt-2">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            isNearLimit ? "bg-red-500" : "bg-purple-500"
          }`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
