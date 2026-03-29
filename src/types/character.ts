export interface ArtStyle {
  id: string;
  name: string;
  description: string;
  emoji: string;
  promptModifier: string;
}

export interface CharacterData {
  name: string;
  type: string;
  personality: string;
  appearance: string;
  colors: string;
  distinguishingFeatures: string;
  setting: string;
  conflict: string;
}

export interface ImageGenerationResult {
  imageUrl: string;
  predictionId: string;
  seed?: number;
}

export interface VisualSeed {
  imageUrl: string;
  prompt: string;
  artStyle: ArtStyle;
  characterData: CharacterData;
  replicatePredictionId: string;
  generationParams: {
    seed?: number;
    guidanceScale: number;
    numInferenceSteps: number;
    aspectRatio: string;
  };
}
