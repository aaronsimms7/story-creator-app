"use client";

import { StoryBeat } from "@/types/story";

interface StoryBeatCardProps {
  beat: StoryBeat;
  isLatest: boolean;
}

export function StoryBeatCard({ beat, isLatest }: StoryBeatCardProps) {
  return (
    <div
      className={`rounded-xl overflow-hidden transition-all duration-500 ${
        isLatest ? "animate-[fadeIn_0.5s_ease-out]" : ""
      }`}
    >
      {/* Scene image */}
      {beat.isVisuallySignificant && (
        <div className="w-full aspect-video bg-purple-100 rounded-xl overflow-hidden mb-3">
          {beat.imageResult ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={beat.imageResult.imageUrl}
              alt={beat.sceneDescription}
              className="w-full h-full object-cover"
            />
          ) : (
            // Shimmer loading placeholder
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center gap-2">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
                <span className="text-sm text-purple-400">
                  Creating illustration...
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Narrative text */}
      <p className="text-gray-800 text-base leading-relaxed px-1">
        {beat.narrativeText}
      </p>
    </div>
  );
}
