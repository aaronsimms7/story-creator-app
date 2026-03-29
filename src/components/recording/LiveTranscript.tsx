"use client";

import { useEffect, useRef } from "react";

interface LiveTranscriptProps {
  finalTranscript: string;
  interimTranscript: string;
}

export function LiveTranscript({
  finalTranscript,
  interimTranscript,
}: LiveTranscriptProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as text grows
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [finalTranscript, interimTranscript]);

  const isEmpty = !finalTranscript && !interimTranscript;

  return (
    <div
      ref={containerRef}
      className="bg-white/60 rounded-xl p-4 min-h-[80px] max-h-[160px] overflow-y-auto
                 text-left transition-all duration-200"
    >
      {isEmpty ? (
        <p className="text-gray-400 italic">Start talking...</p>
      ) : (
        <p className="text-lg leading-relaxed">
          {finalTranscript && (
            <span className="text-gray-800">{finalTranscript}</span>
          )}
          {interimTranscript && (
            <span className="text-purple-500 italic">
              {finalTranscript ? " " : ""}
              {interimTranscript}
            </span>
          )}
        </p>
      )}
    </div>
  );
}
