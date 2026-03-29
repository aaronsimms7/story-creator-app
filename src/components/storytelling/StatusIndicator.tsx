"use client";

import { StorySessionStatus } from "@/types/story";

interface StatusIndicatorProps {
  status: StorySessionStatus;
  isTTSPlaying: boolean;
  latestFollowUp?: string | null;
}

export function StatusIndicator({
  status,
  isTTSPlaying,
  latestFollowUp,
}: StatusIndicatorProps) {
  if (status === "complete") return null;

  return (
    <div className="flex items-center justify-center gap-2 py-2">
      {status === "listening" && !isTTSPlaying && (
        <>
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-green-700 font-medium">
            Listening...
          </span>
        </>
      )}

      {status === "processing-beat" && (
        <>
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600" />
          <span className="text-sm text-purple-700 font-medium">
            Thinking about your story...
          </span>
        </>
      )}

      {(status === "ai-speaking" || isTTSPlaying) && (
        <div className="flex items-center justify-center gap-2">
          <svg
            className="w-4 h-4 text-blue-600"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
          <span className="text-sm text-blue-700 font-medium">
            Storyteller is talking...
          </span>
        </div>
      )}

      {status === "ending" && (
        <>
          <span className="text-lg">&#10024;</span>
          <span className="text-sm text-amber-700 font-medium">
            Wrapping up your story...
          </span>
        </>
      )}
    </div>
  );
}
