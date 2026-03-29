"use client";

import { useState, useEffect } from "react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { CharacterData } from "@/types/character";
import { WaveformVisualizer } from "@/components/recording/WaveformVisualizer";
import { RecordButton } from "@/components/recording/RecordButton";

const CHARACTER_TYPES = [
  { id: "person", label: "Person", emoji: "👤" },
  { id: "animal", label: "Animal", emoji: "🐻" },
  { id: "dragon", label: "Dragon", emoji: "🐉" },
  { id: "magical creature", label: "Magic!", emoji: "✨" },
] as const;

// Maps question index (1-4) to the answer key
const QUESTION_KEYS = ["name", "colors", "special", "setting"] as const;
type AnswerKey = (typeof QUESTION_KEYS)[number];

interface Answers {
  type: string;
  name: string;
  colors: string;
  special: string;
  setting: string;
}

type Phase = "type-selection" | "question" | "recording" | "transcribing" | "confirming";

function getQuestion(index: number, name: string): string {
  switch (index) {
    case 1: return "What's their name?";
    case 2: return `What color is ${name}?`;
    case 3: return `Does ${name} have wings? A hat? Spots? Anything special?`;
    case 4: return `Where does ${name} live?`;
    default: return "";
  }
}

function buildCharacterData(answers: Answers): CharacterData {
  const rawSpecial = answers.special.trim().toLowerCase();
  const special =
    rawSpecial === "nothing" || rawSpecial === "no" || rawSpecial === "nope" || rawSpecial === ""
      ? ""
      : answers.special.trim();

  return {
    name: answers.name,
    type: answers.type,
    personality: "friendly and adventurous",
    appearance: `${answers.colors} ${answers.type}${special ? `, ${special}` : ""}`,
    colors: answers.colors,
    distinguishingFeatures: special || "charming and unique",
    setting: answers.setting,
    conflict: "",
  };
}

interface Props {
  onComplete: (characterData: CharacterData) => void;
  onStartOver?: () => void;
}

export function GuidedCharacterInterview({ onComplete, onStartOver }: Props) {
  const recorder = useAudioRecorder({ maxDuration: 15 });
  const [phase, setPhase] = useState<Phase>("type-selection");
  const [questionIndex, setQuestionIndex] = useState(1);
  const [answers, setAnswers] = useState<Answers>({
    type: "",
    name: "",
    colors: "",
    special: "",
    setting: "",
  });
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Handle auto-stop when maxDuration is reached while recording
  useEffect(() => {
    if (phase === "recording" && recorder.status === "stopped") {
      setPhase("transcribing");
    }
  }, [phase, recorder.status]);

  // Transcribe once the audio blob is ready
  useEffect(() => {
    if (phase !== "transcribing" || recorder.status !== "stopped" || !recorder.audioBlob) return;

    const blob = recorder.audioBlob;
    (async () => {
      try {
        const formData = new FormData();
        formData.append("audio", blob, "answer.webm");
        const res = await fetch("/api/transcribe", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setCurrentTranscript(data.transcript);
        setPhase("confirming");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't hear that. Try again?");
        recorder.reset();
        setPhase("question");
      }
    })();
    // Only run when these values settle — exhaustive deps would cause double-fire
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, recorder.status, recorder.audioBlob]);

  const handleTypeSelect = (type: string) => {
    setAnswers((prev) => ({ ...prev, type }));
    setPhase("question");
  };

  const handleStartRecording = async () => {
    setError(null);
    recorder.reset();
    await recorder.startRecording();
    setPhase("recording");
  };

  const handleStopRecording = () => {
    recorder.stopRecording();
    setPhase("transcribing");
  };

  const handleConfirmAnswer = () => {
    const key: AnswerKey = QUESTION_KEYS[questionIndex - 1];
    const updatedAnswers = { ...answers, [key]: currentTranscript };
    setAnswers(updatedAnswers);
    setCurrentTranscript("");

    if (questionIndex < 4) {
      recorder.reset();
      setQuestionIndex((prev) => prev + 1);
      setPhase("question");
    } else {
      onComplete(buildCharacterData(updatedAnswers));
    }
  };

  const handleRerecord = () => {
    recorder.reset();
    setCurrentTranscript("");
    setError(null);
    setPhase("question");
  };

  // Number of steps completed (used for progress dots)
  const completedSteps = phase === "type-selection" ? 0 : questionIndex;
  const name = answers.name || "your character";

  return (
    <div className="space-y-6">
      {/* Progress dots */}
      <div className="flex gap-3 justify-center pt-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors duration-300 ${
              i < completedSteps ? "bg-purple-600" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-600 text-center text-sm">{error}</p>
      )}

      {/* Q0: Character type buttons */}
      {phase === "type-selection" && (
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold text-purple-800">
            Who should your story be about?
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {CHARACTER_TYPES.map(({ id, label, emoji }) => (
              <button
                key={id}
                onClick={() => handleTypeSelect(id)}
                className="flex flex-col items-center gap-2 p-6 rounded-2xl border-2
                           border-purple-200 bg-white hover:border-purple-500 hover:bg-purple-50
                           transition-all active:scale-95 shadow-sm hover:shadow-md"
              >
                <span className="text-5xl">{emoji}</span>
                <span className="text-lg font-bold text-purple-800">{label}</span>
              </button>
            ))}
          </div>
          {onStartOver && (
            <button onClick={onStartOver} className="text-sm text-gray-400 underline">
              Start over
            </button>
          )}
        </div>
      )}

      {/* Q1–Q4: Voice recording */}
      {(phase === "question" || phase === "recording" || phase === "transcribing") && (
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold text-purple-800">
            {getQuestion(questionIndex, name)}
          </h2>

          {phase === "recording" && (
            <WaveformVisualizer audioLevel={recorder.audioLevel} isActive={true} />
          )}

          {phase === "transcribing" && (
            <div className="flex items-center justify-center gap-3 py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-4 border-purple-600" />
              <p className="text-gray-600">Listening...</p>
            </div>
          )}

          {phase !== "transcribing" && (
            <div className="flex justify-center">
              <RecordButton
                isRecording={phase === "recording"}
                onStart={handleStartRecording}
                onStop={handleStopRecording}
              />
            </div>
          )}

          <p className="text-sm text-gray-500">
            {phase === "question" && "Tap the mic and say your answer!"}
            {phase === "recording" && "Tap to stop when you\u2019re done"}
          </p>
        </div>
      )}

      {/* Confirm answer */}
      {phase === "confirming" && (
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold text-purple-800">I heard:</h2>
          <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6">
            <p className="text-2xl text-purple-900 font-medium">
              &ldquo;{currentTranscript}&rdquo;
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleRerecord}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-lg
                         font-bold py-4 px-6 rounded-full transition-colors"
            >
              Re-record
            </button>
            <button
              onClick={handleConfirmAnswer}
              className="flex-1 btn-primary text-lg py-4 px-6"
            >
              {questionIndex < 4 ? "Next!" : "Let\u2019s go!"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
