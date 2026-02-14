"use client";

import { useState } from "react";

interface TranscriptionReviewProps {
  transcript: string;
  onConfirm: (editedTranscript: string) => void;
  onRerecord: () => void;
}

export function TranscriptionReview({
  transcript,
  onConfirm,
  onRerecord,
}: TranscriptionReviewProps) {
  const [edited, setEdited] = useState(transcript);

  const handleConfirm = () => {
    const trimmed = edited.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-purple-800 mb-2">
          Here&apos;s what we heard!
        </h2>
        <p className="text-gray-700">
          Edit anything that doesn&apos;t look right:
        </p>
      </div>

      <textarea
        value={edited}
        onChange={(e) => setEdited(e.target.value)}
        className="w-full text-lg p-4 rounded-xl border-4 border-purple-300
                   focus:border-purple-600 outline-none h-40 resize-none"
        placeholder="Your story description will appear here..."
      />

      <div className="flex gap-4">
        <button
          onClick={onRerecord}
          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-lg
                     font-bold py-4 px-6 rounded-full transition-colors"
        >
          Re-record
        </button>
        <button
          onClick={handleConfirm}
          disabled={!edited.trim()}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300
                     text-white text-lg font-bold py-4 px-6 rounded-full
                     transition-colors disabled:cursor-not-allowed"
        >
          That&apos;s Right!
        </button>
      </div>
    </div>
  );
}
