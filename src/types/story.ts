import { ArtStyle, CharacterData, VisualSeed } from "./character";

export interface StoryBeat {
  id: string;
  index: number;
  transcript: string;
  narrativeText: string;
  sceneDescription: string;
  imagePrompt: string | null;
  imageResult: SceneImageResult | null;
  isVisuallySignificant: boolean;
  aiFollowUp: string;
  createdAt: number;
}

export interface SceneImageResult {
  imageUrl: string;
  predictionId: string;
  seed?: number;
}

export type StorySessionStatus =
  | "idle"
  | "listening"
  | "processing-beat"
  | "ai-speaking"
  | "ending"
  | "complete";

export interface StorytellingState {
  status: StorySessionStatus;
  beats: StoryBeat[];
  currentSegment: string;
  interimTranscript: string;
  totalImagesGenerated: number;
  deferredImagesRemaining: number;
  audioLevel: number;
  duration: number;
  isProcessingBeat: boolean;
  isTTSPlaying: boolean;
  latestFollowUp: string | null;
  error: string | null;
}

export interface BeatAnalysisRequest {
  transcript: string;
  storyContext: string;
  characterData: CharacterData;
  artStyle: ArtStyle;
  beatIndex: number;
  totalImagesGenerated: number;
  maxImages: number;
}

export interface BeatAnalysisResult {
  refinedTranscript: string;
  sceneDescription: string;
  isVisuallySignificant: boolean;
  imagePrompt: string | null;
  aiFollowUp: string;
  isEnding: boolean;
  narrativeText: string;
}

export interface WrapUpRequest {
  storyContext: string;
  characterData: CharacterData;
  artStyle: ArtStyle;
}

export interface WrapUpResult {
  endingText: string;
  imagePrompt: string;
  aiNarration: string;
}

export const MAX_BEATS = 20;
export const IMAGE_THRESHOLD_BEAT = 8;
export const MAX_IMAGES = 15;
export const PAUSE_THRESHOLD_MS = 2500;
export const AUDIO_LEVEL_SILENCE = 0.05;
export const MAX_STORYTELLING_DURATION = 1200; // 20 minutes in seconds
