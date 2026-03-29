"use client";

import { ArtStyle } from "@/types/character";

interface ArtStyleSelectorProps {
  styles: ArtStyle[];
  onSelect: (style: ArtStyle) => void;
}

export function ArtStyleSelector({ styles, onSelect }: ArtStyleSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-purple-800">
          Choose Your Story&apos;s Style!
        </h2>
        <p className="text-lg text-gray-700 mt-2">
          Pick the art style for your character
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelect(style)}
            className="flex flex-col items-center p-4 rounded-2xl bg-white/60
                       hover:bg-white/90 hover:scale-105 transition-all duration-200
                       border-2 border-transparent hover:border-purple-400"
          >
            <span className="text-4xl mb-2">{style.emoji}</span>
            <span className="font-bold text-purple-800 text-sm">
              {style.name}
            </span>
            <span className="text-xs text-gray-600 mt-1">
              {style.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
