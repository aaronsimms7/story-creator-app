"use client";

interface CharacterReviewProps {
  imageUrl: string;
  characterName: string;
  onApprove: () => void;
  onModify: () => void;
  onStartOver: () => void;
  iterationCount: number;
  maxIterations: number;
}

export function CharacterReview({
  imageUrl,
  characterName,
  onApprove,
  onModify,
  onStartOver,
  iterationCount,
  maxIterations,
}: CharacterReviewProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-purple-800">
          Meet {characterName}!
        </h2>
        <p className="text-sm text-gray-500">
          Try {iterationCount} of {maxIterations}
        </p>
      </div>

      <div className="flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`Generated character: ${characterName}`}
          className="w-80 h-80 object-cover rounded-2xl shadow-lg border-4 border-white/80"
        />
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onApprove}
          className="w-full bg-green-600 hover:bg-green-700 text-white text-lg
                     font-bold py-4 px-6 rounded-full transition-all duration-200
                     hover:scale-105 active:scale-95"
        >
          Perfect! Let&apos;s Continue
        </button>

        {iterationCount < maxIterations && (
          <button
            onClick={onModify}
            className="w-full btn-primary text-lg py-4 px-6"
          >
            Close, But Change Something
          </button>
        )}

        <button
          onClick={onStartOver}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white text-lg
                     font-bold py-4 px-6 rounded-full transition-all duration-200
                     hover:scale-105 active:scale-95"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}
