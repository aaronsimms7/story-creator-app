"use client";

interface CharacterLockedProps {
  imageUrl: string;
  characterName: string;
  artStyleName: string;
  onStartOver: () => void;
  onBeginStorytelling: () => void;
}

export function CharacterLocked({
  imageUrl,
  characterName,
  artStyleName,
  onStartOver,
  onBeginStorytelling,
}: CharacterLockedProps) {
  return (
    <div className="text-center space-y-6">
      <h2 className="text-3xl font-bold text-purple-800">
        {characterName} is Ready!
      </h2>

      <div className="flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={characterName}
          className="w-72 h-72 object-cover rounded-2xl shadow-lg border-4 border-green-400"
        />
      </div>

      <div className="bg-white/60 rounded-xl p-4">
        <p className="text-gray-700">
          Art style: <span className="font-bold">{artStyleName}</span>
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Visual seed locked. This look will be used throughout your book.
        </p>
      </div>

      <p className="text-gray-600 text-lg">
        Time to tell {characterName}&apos;s story!
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={onBeginStorytelling}
          className="w-full bg-green-600 hover:bg-green-700 text-white text-xl
                     font-bold py-4 px-8 rounded-full transition-all duration-200
                     hover:scale-105 active:scale-95"
        >
          Begin Storytelling
        </button>
        <button
          onClick={onStartOver}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white text-lg
                     font-bold py-3 px-8 rounded-full transition-colors"
        >
          Start a New Story
        </button>
      </div>
    </div>
  );
}
