"use client";

import { useEffect, useRef } from "react";
import { StoryBeat } from "@/types/story";
import { StoryBeatCard } from "./StoryBeatCard";

interface StoryBookViewProps {
  beats: StoryBeat[];
}

export function StoryBookView({ beats }: StoryBookViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest beat
  useEffect(() => {
    if (containerRef.current && beats.length > 0) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [beats.length]);

  if (beats.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 italic py-12">
        Your story will appear here as you tell it...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto space-y-6 py-4 px-2 max-h-[400px]"
    >
      {beats.map((beat, i) => (
        <StoryBeatCard
          key={beat.id}
          beat={beat}
          isLatest={i === beats.length - 1}
        />
      ))}
    </div>
  );
}
