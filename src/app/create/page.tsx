"use client";

import { useState } from "react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { RecordButton } from "@/components/recording/RecordButton";
import { WaveformVisualizer } from "@/components/recording/WaveformVisualizer";
import { RecordingTimer } from "@/components/recording/RecordingTimer";
import { AudioPlayback } from "@/components/recording/AudioPlayback";
import { TranscriptionReview } from "@/components/recording/TranscriptionReview";

type FlowStep = "ready" | "recording" | "stopped" | "transcribing" | "reviewing" | "confirmed";

export default function CreatePage() {
  const recorder = useAudioRecorder({ maxDuration: 60 });
  const [step, setStep] = useState<FlowStep>("ready");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleStartRecording = async () => {
    setError(null);
    await recorder.startRecording();
    setStep("recording");
  };

  const handleStopRecording = () => {
    recorder.stopRecording();
    setStep("stopped");
  };

  const handleSubmitAudio = async () => {
    if (!recorder.audioBlob) return;

    setStep("transcribing");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", recorder.audioBlob, "recording.webm");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Transcription failed");
      }

      setTranscript(data.transcript);
      setStep("reviewing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("stopped");
    }
  };

  const handleRerecord = () => {
    recorder.reset();
    setTranscript("");
    setError(null);
    setStep("ready");
  };

  const handleConfirmTranscript = (editedTranscript: string) => {
    setTranscript(editedTranscript);
    setStep("confirmed");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="card max-w-2xl w-full">
        {/* Error banner */}
        {(error || recorder.error) && (
          <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-4 mb-6">
            <p>{error || recorder.error}</p>
          </div>
        )}

        {/* Step: Ready to record */}
        {step === "ready" && (
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold text-purple-800">
              Tell Us About Your Story!
            </h2>
            <p className="text-lg text-gray-700">
              Who is the main character? What do they look like?
              What adventure will they have?
            </p>
            <div className="flex justify-center">
              <RecordButton
                isRecording={false}
                onStart={handleStartRecording}
                onStop={() => {}}
              />
            </div>
            <p className="text-sm text-gray-500">
              Tap the button and start talking (up to 60 seconds)
            </p>
          </div>
        )}

        {/* Step: Recording */}
        {step === "recording" && (
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xl font-bold text-red-600">Recording...</span>
            </div>

            <RecordingTimer
              duration={recorder.duration}
              maxDuration={recorder.maxDuration}
            />

            <WaveformVisualizer
              audioLevel={recorder.audioLevel}
              isActive={true}
            />

            <div className="flex justify-center">
              <RecordButton
                isRecording={true}
                onStart={() => {}}
                onStop={handleStopRecording}
              />
            </div>

            <p className="text-sm text-gray-500">
              Tap the button when you&apos;re done
            </p>
          </div>
        )}

        {/* Step: Stopped — review recording */}
        {step === "stopped" && (
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold text-purple-800">
              Great job!
            </h2>
            <p className="text-lg text-gray-700">
              Listen back to your recording, then send it in.
            </p>

            {recorder.audioUrl && (
              <div className="flex justify-center">
                <AudioPlayback audioUrl={recorder.audioUrl} />
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleRerecord}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-lg
                           font-bold py-4 px-6 rounded-full transition-colors"
              >
                Re-record
              </button>
              <button
                onClick={handleSubmitAudio}
                className="flex-1 btn-primary text-lg py-4 px-6"
              >
                Send It In!
              </button>
            </div>
          </div>
        )}

        {/* Step: Transcribing */}
        {step === "transcribing" && (
          <div className="text-center space-y-6 py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600" />
            <h2 className="text-2xl font-bold text-purple-800">
              Listening to your story...
            </h2>
            <p className="text-gray-600">This will just take a moment</p>
          </div>
        )}

        {/* Step: Reviewing transcript */}
        {step === "reviewing" && (
          <TranscriptionReview
            transcript={transcript}
            onConfirm={handleConfirmTranscript}
            onRerecord={handleRerecord}
          />
        )}

        {/* Step: Confirmed */}
        {step === "confirmed" && (
          <div className="text-center space-y-6">
            <div className="text-6xl">🎉</div>
            <h2 className="text-3xl font-bold text-purple-800">
              Story Idea Saved!
            </h2>
            <div className="bg-white/60 rounded-xl p-4 text-left">
              <p className="text-gray-800">{transcript}</p>
            </div>
            <p className="text-gray-500">
              Next up: character creation and illustration (coming in Phase 2)
            </p>
            <button
              onClick={handleRerecord}
              className="btn-primary text-lg py-3 px-8"
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
