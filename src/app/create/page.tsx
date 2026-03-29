"use client";

import { useEffect, useState } from "react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useCharacterCreation } from "@/hooks/useCharacterCreation";
import { useStorytellingSession } from "@/hooks/useStorytellingSession";
import { RecordButton } from "@/components/recording/RecordButton";
import { WaveformVisualizer } from "@/components/recording/WaveformVisualizer";
import { RecordingTimer } from "@/components/recording/RecordingTimer";
import { AudioPlayback } from "@/components/recording/AudioPlayback";
import { GuidedCharacterInterview } from "@/components/character/GuidedCharacterInterview";
import { CharacterReview } from "@/components/character/CharacterReview";
import { CharacterLocked } from "@/components/character/CharacterLocked";
import { StorytellingView } from "@/components/storytelling/StorytellingView";
import { StoryComplete } from "@/components/storytelling/StoryComplete";
import { CharacterData } from "@/types/character";
import { ART_STYLES } from "@/lib/art-styles";

type FlowStep =
  | "interview"
  | "extracting"
  | "reviewing-character"
  | "modifying-recording"
  | "modifying-stopped"
  | "modifying-transcribing"
  | "modifying"
  | "character-locked"
  | "storytelling"
  | "story-complete";

export default function CreatePage() {
  const modRecorder = useAudioRecorder({ maxDuration: 30 });
  const character = useCharacterCreation();
  const session = useStorytellingSession();

  const [step, setStep] = useState<FlowStep>("interview");
  const [error, setError] = useState<string | null>(null);

  // Transition to story-complete once the story is done AND all deferred images
  // have finished generating. session.beats is live, so StoryComplete always
  // has the latest image results without needing a frozen snapshot.
  useEffect(() => {
    console.log("[TRANSITION] step:", step, "| status:", session.status, "| deferredRemaining:", session.deferredImagesRemaining, "| beats:", session.beats.length);
    if (
      step === "storytelling" &&
      session.status === "complete" &&
      session.beats.length > 0 &&
      session.deferredImagesRemaining === 0
    ) {
      console.log("[TRANSITION] → transitioning to story-complete");
      setStep("story-complete");
    }
  }, [step, session.status, session.deferredImagesRemaining, session.beats.length]);

  // --- Interview complete handler ---

  const handleInterviewComplete = async (characterData: CharacterData) => {
    const defaultStyle = ART_STYLES.find((s) => s.id === "classic-storybook")!;
    setStep("extracting");
    await character.generateFromData(characterData, defaultStyle);
    if (!character.error) {
      setStep("reviewing-character");
    }
  };

  const handleRerecord = () => {
    session.endSession();
    modRecorder.reset();
    character.reset();
    setError(null);
    setStep("interview");
  };

  const handleBeginStorytelling = () => {
    if (character.visualSeed) {
      // startSession is async (mic + WebSocket setup) but fire-and-forget here;
      // StorytellingView renders the loading/listening state as it initializes.
      session.startSession(character.visualSeed);
    }
    setStep("storytelling");
  };

  const handleApproveCharacter = () => {
    character.lockVisualSeed();
    setStep("character-locked");
  };

  const handleRequestModification = () => {
    modRecorder.reset();
    setError(null);
    setStep("modifying-recording");
  };

  const handleModStartRecording = async () => {
    setError(null);
    await modRecorder.startRecording();
  };

  const handleModStopRecording = () => {
    modRecorder.stopRecording();
    setStep("modifying-stopped");
  };

  const handleModSubmit = async () => {
    if (!modRecorder.audioBlob) return;

    setStep("modifying-transcribing");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", modRecorder.audioBlob, "recording.webm");

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStep("modifying");
      await character.modifyImage(data.transcript);
      if (!character.error) {
        setStep("reviewing-character");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("reviewing-character");
    }
  };

  const handleModRerecord = () => {
    modRecorder.reset();
    setError(null);
    setStep("modifying-recording");
  };

  // Determine which error to show
  const displayError = error || character.error || modRecorder.error;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="card max-w-2xl w-full">
        {/* Error banner */}
        {displayError && (
          <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-4 mb-6">
            <p>{displayError}</p>
          </div>
        )}

        {/* Step: Guided character interview */}
        {step === "interview" && (
          <GuidedCharacterInterview
            onComplete={handleInterviewComplete}
            onStartOver={handleRerecord}
          />
        )}

        {/* Step: Generating character image */}
        {step === "extracting" && (
          <div className="text-center space-y-6 py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600" />
            <h2 className="text-2xl font-bold text-purple-800">
              Bringing your character to life...
            </h2>
            <p className="text-gray-600">Generating your character illustration</p>
          </div>
        )}

        {/* Step: Reviewing character image */}
        {step === "reviewing-character" && character.currentImage && character.characterData && (
          <CharacterReview
            imageUrl={character.currentImage.imageUrl}
            characterName={character.characterData.name}
            onApprove={handleApproveCharacter}
            onModify={handleRequestModification}
            onStartOver={handleRerecord}
            iterationCount={character.iterationCount}
            maxIterations={character.maxIterations}
          />
        )}

        {/* Step: Recording modification */}
        {step === "modifying-recording" && (
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold text-purple-800">
              Tell Me What to Change!
            </h2>
            <p className="text-lg text-gray-700">
              Describe what you&apos;d like different about your character
            </p>

            {modRecorder.status === "recording" && (
              <>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xl font-bold text-red-600">Recording...</span>
                </div>
                <RecordingTimer
                  duration={modRecorder.duration}
                  maxDuration={modRecorder.maxDuration}
                />
                <WaveformVisualizer
                  audioLevel={modRecorder.audioLevel}
                  isActive={true}
                />
              </>
            )}

            <div className="flex justify-center">
              <RecordButton
                isRecording={modRecorder.status === "recording"}
                onStart={handleModStartRecording}
                onStop={handleModStopRecording}
              />
            </div>

            <p className="text-sm text-gray-500">
              Up to 30 seconds — tell us what to change
            </p>
          </div>
        )}

        {/* Step: Modification recording stopped */}
        {step === "modifying-stopped" && (
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold text-purple-800">
              Got it!
            </h2>
            <p className="text-lg text-gray-700">
              Listen back, then send your feedback.
            </p>

            {modRecorder.audioUrl && (
              <div className="flex justify-center">
                <AudioPlayback audioUrl={modRecorder.audioUrl} />
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleModRerecord}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-lg
                           font-bold py-4 px-6 rounded-full transition-colors"
              >
                Re-record
              </button>
              <button
                onClick={handleModSubmit}
                className="flex-1 btn-primary text-lg py-4 px-6"
              >
                Send It In!
              </button>
            </div>
          </div>
        )}

        {/* Step: Transcribing modification */}
        {step === "modifying-transcribing" && (
          <div className="text-center space-y-6 py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600" />
            <h2 className="text-2xl font-bold text-purple-800">
              Listening to your feedback...
            </h2>
            <p className="text-gray-600">This will just take a moment</p>
          </div>
        )}

        {/* Step: Regenerating with modifications */}
        {step === "modifying" && (
          <div className="text-center space-y-6 py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600" />
            <h2 className="text-2xl font-bold text-purple-800">
              Updating your character...
            </h2>
            <p className="text-gray-600">Making those changes now</p>
          </div>
        )}

        {/* Step: Character locked */}
        {step === "character-locked" && character.visualSeed && (
          <CharacterLocked
            imageUrl={character.visualSeed.imageUrl}
            characterName={character.visualSeed.characterData.name}
            artStyleName={character.visualSeed.artStyle.name}
            onStartOver={handleRerecord}
            onBeginStorytelling={handleBeginStorytelling}
          />
        )}

        {/* Step: Storytelling */}
        {step === "storytelling" && character.visualSeed && (
          <StorytellingView
            session={session}
            visualSeed={character.visualSeed}
            onStartOver={handleRerecord}
          />
        )}

        {/* Step: Story complete — passes live session.beats so images update as they arrive */}
        {step === "story-complete" && character.visualSeed && (
          <StoryComplete
            beats={session.beats}
            visualSeed={character.visualSeed}
            onStartOver={handleRerecord}
          />
        )}
      </div>
    </main>
  );
}
