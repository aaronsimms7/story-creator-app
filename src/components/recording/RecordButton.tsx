"use client";

interface RecordButtonProps {
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function RecordButton({ isRecording, onStart, onStop }: RecordButtonProps) {
  if (isRecording) {
    return (
      <button
        onClick={onStop}
        className="group relative w-24 h-24 rounded-full bg-red-500
                   animate-pulse-recording shadow-lg shadow-red-500/50
                   hover:bg-red-600 transition-colors"
        aria-label="Stop recording"
      >
        {/* Stop square icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-white rounded-sm" />
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onStart}
      className="group relative w-24 h-24 rounded-full bg-red-500
                 shadow-lg hover:bg-red-600 hover:scale-110
                 transition-all duration-200 active:scale-95"
      aria-label="Start recording"
    >
      {/* Microphone icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      </div>
    </button>
  );
}
