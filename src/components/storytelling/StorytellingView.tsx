"use client";

import { useEffect, useRef, useState } from "react";
import { VisualSeed } from "@/types/character";
import { StorytellingSession } from "@/hooks/useStorytellingSession";
import { LiveTranscript } from "@/components/recording/LiveTranscript";
import { WaveformVisualizer } from "@/components/recording/WaveformVisualizer";
import { StatusIndicator } from "./StatusIndicator";

interface StorytellingViewProps {
  session: StorytellingSession;
  visualSeed: VisualSeed;
  onStartOver: () => void;
}

export function StorytellingView({
  session,
  visualSeed,
  onStartOver,
}: StorytellingViewProps) {
  const [showText, setShowText] = useState(false);
  const imageScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll images area when new images arrive
  const completedImages = session.beats.filter(
    (b) => b.isVisuallySignificant && b.imageResult
  );
  useEffect(() => {
    if (imageScrollRef.current && completedImages.length > 0) {
      imageScrollRef.current.scrollTo({
        top: imageScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [completedImages.length]);

  const isActive =
    session.status === "listening" ||
    session.status === "processing-beat" ||
    session.status === "ai-speaking";

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {/* Error banner */}
      {session.error && (
        <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-3 text-sm">
          {session.error}
        </div>
      )}

      {/* Header: character + stats */}
      <div className="text-center space-y-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={visualSeed.imageUrl}
          alt={visualSeed.characterData.name}
          className="w-24 h-24 rounded-2xl object-cover border-4 border-purple-300 mx-auto shadow-lg"
        />
        <h2 className="text-2xl font-bold text-purple-800">
          Tell {visualSeed.characterData.name}&apos;s Story!
        </h2>
        <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
          <span>{formatDuration(session.duration)}</span>
          <span>&middot;</span>
          <span>
            {session.beats.length} scene
            {session.beats.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Scene images (no text) — only images that have completed */}
      {completedImages.length > 0 && (
        <div
          ref={imageScrollRef}
          className="overflow-y-auto max-h-[250px] space-y-3 px-1"
        >
          {completedImages.map((beat) => (
            <div
              key={beat.id}
              className="w-full aspect-video rounded-xl overflow-hidden shadow-md
                         animate-[fadeIn_0.8s_ease-out]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={beat.imageResult!.imageUrl}
                alt={beat.sceneDescription}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* AI follow-up question — always visible as text */}
      {session.latestFollowUp && isActive && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <p className="text-blue-700 text-sm italic">
            &ldquo;{session.latestFollowUp}&rdquo;
          </p>
        </div>
      )}

      {/* Waveform + status */}
      {isActive && (
        <div className="space-y-2">
          <WaveformVisualizer
            audioLevel={session.audioLevel}
            isActive={
              session.status === "listening" && !session.isTTSPlaying
            }
          />
          <StatusIndicator
            status={session.status}
            isTTSPlaying={session.isTTSPlaying}
            latestFollowUp={null}
          />
        </div>
      )}

      {/* Story ending state */}
      {session.status === "ending" && (
        <div className="text-center py-6">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-4 border-purple-600" />
          <p className="text-purple-700 font-medium mt-3">
            Wrapping up your story...
          </p>
        </div>
      )}

      {/* Finishing deferred illustrations after story ends */}
      {session.status === "complete" &&
        session.deferredImagesRemaining > 0 && (
          <div className="text-center py-6">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-4 border-purple-600" />
            <p className="text-purple-700 font-medium mt-3">
              Finishing your illustrations...
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {session.deferredImagesRemaining} remaining
            </p>
          </div>
        )}

      {/* Parent controls */}
      <div className="border-t border-gray-200 pt-3 space-y-3">
        <p className="text-xs text-gray-400 text-center uppercase tracking-wide">
          Parent Controls
        </p>

        {/* Transcript (hidden by default) */}
        {isActive && showText && (
          <div className="bg-white/40 rounded-xl p-3">
            <LiveTranscript
              finalTranscript={session.currentSegment.replace(
                session.interimTranscript,
                ""
              )}
              interimTranscript={session.interimTranscript}
            />
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          {isActive && (
            <button
              onClick={() => setShowText(!showText)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-600 text-sm
                         font-medium py-2 px-4 rounded-full transition-colors"
            >
              {showText ? "Hide Text" : "Show Text"}
            </button>
          )}
          {isActive && (
            <button
              onClick={session.wrapUp}
              className="bg-amber-500 hover:bg-amber-600 text-white text-sm
                         font-bold py-2 px-4 rounded-full transition-colors"
            >
              Wrap It Up
            </button>
          )}
          <button
            onClick={onStartOver}
            className="bg-gray-400 hover:bg-gray-500 text-white text-sm
                       font-bold py-2 px-4 rounded-full transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
}
