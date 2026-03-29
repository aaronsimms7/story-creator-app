"use client";

import { useState, useCallback } from "react";
import {
  ArtStyle,
  CharacterData,
  VisualSeed,
  ImageGenerationResult,
} from "@/types/character";

interface CharacterCreationState {
  artStyle: ArtStyle | null;
  characterData: CharacterData | null;
  currentImage: ImageGenerationResult | null;
  currentPrompt: string | null;
  visualSeed: VisualSeed | null;
  iterationCount: number;
  error: string | null;
  isLoading: boolean;
}

const MAX_ITERATIONS = 5;

function buildPrompt(character: CharacterData, style: ArtStyle): string {
  return `Children's book illustration, ${style.promptModifier}, featuring a ${character.type} named ${character.name}, ${character.appearance}, ${character.colors} color palette, ${character.distinguishingFeatures}, set in ${character.setting}, bright colors, friendly, age-appropriate, high quality, professional illustration, single character portrait, centered composition`;
}

export function useCharacterCreation() {
  const [state, setState] = useState<CharacterCreationState>({
    artStyle: null,
    characterData: null,
    currentImage: null,
    currentPrompt: null,
    visualSeed: null,
    iterationCount: 0,
    error: null,
    isLoading: false,
  });

  const selectStyle = useCallback((style: ArtStyle) => {
    setState((prev) => ({ ...prev, artStyle: style }));
  }, []);

  const extractAndGenerate = useCallback(
    async (transcript: string, style: ArtStyle) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const extractRes = await fetch("/api/extract-character", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript }),
        });
        const extractData = await extractRes.json();
        if (!extractRes.ok) throw new Error(extractData.error);

        const character: CharacterData = extractData.character;
        const prompt = buildPrompt(character, style);

        setState((prev) => ({ ...prev, characterData: character }));

        const genRes = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        const genData = await genRes.json();
        if (!genRes.ok) throw new Error(genData.error);

        setState((prev) => ({
          ...prev,
          currentImage: genData,
          currentPrompt: prompt,
          iterationCount: 1,
          isLoading: false,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : "Something went wrong",
        }));
      }
    },
    []
  );

  const generateFromData = useCallback(
    async (characterData: CharacterData, style: ArtStyle) => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        characterData,
        artStyle: style,
      }));

      const prompt = buildPrompt(characterData, style);

      try {
        const genRes = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        const genData = await genRes.json();
        if (!genRes.ok) throw new Error(genData.error);

        setState((prev) => ({
          ...prev,
          currentImage: genData,
          currentPrompt: prompt,
          iterationCount: 1,
          isLoading: false,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : "Something went wrong",
        }));
      }
    },
    []
  );

  const modifyImage = useCallback(
    async (modificationText: string) => {
      if (!state.currentPrompt) return;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const res = await fetch("/api/modify-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            originalPrompt: state.currentPrompt,
            modificationText,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setState((prev) => ({
          ...prev,
          currentImage: data,
          currentPrompt: data.prompt,
          iterationCount: prev.iterationCount + 1,
          isLoading: false,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : "Something went wrong",
        }));
      }
    },
    [state.currentPrompt]
  );

  const lockVisualSeed = useCallback(() => {
    if (
      !state.currentImage ||
      !state.artStyle ||
      !state.characterData ||
      !state.currentPrompt
    )
      return;

    const seed: VisualSeed = {
      imageUrl: state.currentImage.imageUrl,
      prompt: state.currentPrompt,
      artStyle: state.artStyle,
      characterData: state.characterData,
      replicatePredictionId: state.currentImage.predictionId,
      generationParams: {
        seed: state.currentImage.seed,
        guidanceScale: 3.5,
        numInferenceSteps: 28,
        aspectRatio: "1:1",
      },
    };

    setState((prev) => ({ ...prev, visualSeed: seed }));
  }, [
    state.currentImage,
    state.artStyle,
    state.characterData,
    state.currentPrompt,
  ]);

  const reset = useCallback(() => {
    setState({
      artStyle: null,
      characterData: null,
      currentImage: null,
      currentPrompt: null,
      visualSeed: null,
      iterationCount: 0,
      error: null,
      isLoading: false,
    });
  }, []);

  return {
    ...state,
    maxIterations: MAX_ITERATIONS,
    selectStyle,
    extractAndGenerate,
    generateFromData,
    modifyImage,
    lockVisualSeed,
    reset,
  };
}
