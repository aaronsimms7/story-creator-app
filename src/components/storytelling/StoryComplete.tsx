"use client";

import { StoryBeat } from "@/types/story";
import { VisualSeed } from "@/types/character";

interface StoryCompleteProps {
  beats: StoryBeat[];
  visualSeed: VisualSeed;
  onStartOver: () => void;
}

export function StoryComplete({
  beats,
  visualSeed,
  onStartOver,
}: StoryCompleteProps) {
  const beatsWithImages = beats.filter(
    (b) => b.isVisuallySignificant && b.imageResult
  );
  const beatsStillLoading = beats.filter(
    (b) => b.isVisuallySignificant && !b.imageResult
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-purple-800">
          Your Story is Complete!
        </h2>
        <p className="text-gray-600 mt-1">
          {beats.length} scene{beats.length !== 1 ? "s" : ""} &middot;{" "}
          {beatsWithImages.length} illustration
          {beatsWithImages.length !== 1 ? "s" : ""}
          {beatsStillLoading.length > 0 && (
            <span className="text-purple-500">
              {" "}
              ({beatsStillLoading.length} finishing...)
            </span>
          )}
        </p>
      </div>

      {/* Character header */}
      <div className="flex items-center justify-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={visualSeed.imageUrl}
          alt={visualSeed.characterData.name}
          className="w-16 h-16 rounded-xl object-cover border-2 border-green-400"
        />
        <div>
          <p className="font-bold text-purple-800">
            {visualSeed.characterData.name}
          </p>
          <p className="text-sm text-gray-500">
            {visualSeed.artStyle.name}
          </p>
        </div>
      </div>

      {/* Story pages */}
      <div className="space-y-6 max-h-[500px] overflow-y-auto py-2 px-1">
        {beats.map((beat) => (
          <div key={beat.id} className="rounded-xl overflow-hidden">
            {beat.isVisuallySignificant && (
              <div className="w-full aspect-video rounded-xl overflow-hidden mb-2">
                {beat.imageResult ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={beat.imageResult.imageUrl}
                    alt={beat.sceneDescription}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-purple-100 flex items-center justify-center">
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
            <p className="text-gray-800 leading-relaxed px-1">
              {beat.narrativeText}
            </p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <p className="text-center text-gray-500 text-sm">
          Next up: book layout and printing (coming soon!)
        </p>
        <button
          onClick={onStartOver}
          className="btn-primary text-lg py-3 px-8"
        >
          Create Another Story
        </button>
      </div>
    </div>
  );
}
