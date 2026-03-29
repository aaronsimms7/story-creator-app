"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { VisualSeed } from "@/types/character";
import {
  StoryBeat,
  StorytellingState,
  StorySessionStatus,
  BeatAnalysisResult,
  SceneImageResult,
  MAX_BEATS,
  MAX_IMAGES,
  PAUSE_THRESHOLD_MS,
  AUDIO_LEVEL_SILENCE,
  MAX_STORYTELLING_DURATION,
} from "@/types/story";

// --- Image queue item ---
interface ImageQueueItem {
  beatIndex: number;
  prompt: string;
  status: "pending" | "generating" | "complete" | "failed";
}

// --- Deferred image (generated after story ends) ---
interface DeferredImage {
  beatIndex: number;
  prompt: string;
}

const INITIAL_STATE: StorytellingState = {
  status: "idle",
  beats: [],
  currentSegment: "",
  interimTranscript: "",
  totalImagesGenerated: 0,
  deferredImagesRemaining: 0,
  audioLevel: 0,
  duration: 0,
  isProcessingBeat: false,
  isTTSPlaying: false,
  latestFollowUp: null,
  error: null,
};

export function useStorytellingSession() {
  const [state, setState] = useState<StorytellingState>(INITIAL_STATE);

  // --- Refs for audio pipeline ---
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const levelAnimationRef = useRef<number | null>(null);

  // --- Refs for storytelling orchestration ---
  const visualSeedRef = useRef<VisualSeed | null>(null);
  const isMutedRef = useRef(false);
  const isProcessingBeatRef = useRef(false);
  const lastFinalTimestampRef = useRef(0);
  const lastFinalTextRef = useRef("");
  const beatBoundaryRef = useRef(0);
  const pauseCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const imageQueueRef = useRef<ImageQueueItem[]>([]);
  const isGeneratingImageRef = useRef(false);
  const beatsRef = useRef<StoryBeat[]>([]);
  const totalImagesRef = useRef(0);
  const statusRef = useRef<StorySessionStatus>("idle");
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  // --- Refs for image throttling ---
  const significantBeatCountRef = useRef(0);
  const deferredImagesRef = useRef<DeferredImage[]>([]);

  // Keep refs in sync with state
  useEffect(() => {
    beatsRef.current = state.beats;
    totalImagesRef.current = state.totalImagesGenerated;
    statusRef.current = state.status;
  }, [state.beats, state.totalImagesGenerated, state.status]);

  // --- Audio level monitoring ---
  const monitorAudioLevel = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const update = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length / 255;
      setState((prev) => ({ ...prev, audioLevel: avg }));
      levelAnimationRef.current = requestAnimationFrame(update);
    };

    update();
  }, []);

  const stopMonitoringLevel = useCallback(() => {
    if (levelAnimationRef.current) {
      cancelAnimationFrame(levelAnimationRef.current);
      levelAnimationRef.current = null;
    }
  }, []);

  // --- Build story context for Claude ---
  const buildStoryContext = useCallback((beats: StoryBeat[]): string => {
    if (beats.length === 0) return "(Story just started)";
    return beats
      .map((b, i) => `Beat ${i + 1}: ${b.narrativeText}`)
      .join("\n");
  }, []);

  // --- Image queue processing ---
  const processImageQueue = useCallback(async () => {
    if (isGeneratingImageRef.current) return;

    const next = imageQueueRef.current.find(
      (item) => item.status === "pending"
    );
    if (!next) return;

    isGeneratingImageRef.current = true;
    next.status = "generating";

    const wasDeferredItem = deferredImagesRef.current.some(
      (d) => d.beatIndex === next.beatIndex
    );
    console.log("[QUEUE] Generating image for beat", next.beatIndex, "| deferred?", wasDeferredItem);

    try {
      const res = await fetch("/api/generate-scene-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: next.prompt }),
      });
      const result: SceneImageResult = await res.json();

      if (!res.ok) throw new Error("Image generation failed");

      next.status = "complete";
      console.log("[QUEUE] Image complete for beat", next.beatIndex, "| deferred?", wasDeferredItem, "| url:", result.imageUrl?.slice(0, 60));

      setState((prev) => {
        const updatedBeats = prev.beats.map((b) =>
          b.index === next.beatIndex ? { ...b, imageResult: result } : b
        );
        return {
          ...prev,
          beats: updatedBeats,
          totalImagesGenerated: prev.totalImagesGenerated + 1,
          deferredImagesRemaining: wasDeferredItem
            ? Math.max(0, prev.deferredImagesRemaining - 1)
            : prev.deferredImagesRemaining,
        };
      });
    } catch (err) {
      console.error("[QUEUE] Image FAILED for beat", next.beatIndex, "| deferred?", wasDeferredItem, err);
      next.status = "failed";
      if (wasDeferredItem) {
        setState((prev) => ({
          ...prev,
          deferredImagesRemaining: Math.max(
            0,
            prev.deferredImagesRemaining - 1
          ),
        }));
      }
    }

    isGeneratingImageRef.current = false;
    // Process next item in queue
    processImageQueue();
  }, []);

  const enqueueImage = useCallback(
    (beatIndex: number, prompt: string) => {
      imageQueueRef.current.push({
        beatIndex,
        prompt,
        status: "pending",
      });
      processImageQueue();
    },
    [processImageQueue]
  );

  // --- Enqueue all deferred images (called when story ends) ---
  const flushDeferredImages = useCallback(() => {
    const deferred = deferredImagesRef.current;
    console.log("[DEFERRED] flushDeferredImages called, count:", deferred.length);
    if (deferred.length === 0) return;

    setState((prev) => ({
      ...prev,
      deferredImagesRemaining: deferred.length,
    }));

    for (const item of deferred) {
      console.log("[DEFERRED] Enqueuing deferred image for beat", item.beatIndex);
      enqueueImage(item.beatIndex, item.prompt);
    }
  }, [enqueueImage]);

  // --- TTS playback with mic muting ---
  const playTTSAudio = useCallback(
    (audioBase64: string): Promise<void> => {
      return new Promise((resolve) => {
        isMutedRef.current = true;
        setState((prev) => ({
          ...prev,
          isTTSPlaying: true,
          status: "ai-speaking",
        }));

        const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
        ttsAudioRef.current = audio;

        audio.onended = () => {
          ttsAudioRef.current = null;
          isMutedRef.current = false;
          setState((prev) => ({ ...prev, isTTSPlaying: false }));
          // Small delay before resuming to avoid catching speaker tail
          setTimeout(resolve, 300);
        };

        audio.onerror = () => {
          ttsAudioRef.current = null;
          isMutedRef.current = false;
          setState((prev) => ({ ...prev, isTTSPlaying: false }));
          resolve();
        };

        audio.play().catch(() => {
          // Autoplay blocked — fall back to text display
          ttsAudioRef.current = null;
          isMutedRef.current = false;
          setState((prev) => ({ ...prev, isTTSPlaying: false }));
          resolve();
        });
      });
    },
    []
  );

  // --- Handle story ending ---
  const handleStoryEnd = useCallback(
    async (childInitiated: boolean) => {
      const vs = visualSeedRef.current;
      if (!vs) return;

      setState((prev) => ({ ...prev, status: "ending" }));

      if (!childInitiated) {
        // Generate an AI ending
        try {
          const res = await fetch("/api/wrap-up-story", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storyContext: buildStoryContext(beatsRef.current),
              characterData: vs.characterData,
              artStyle: vs.artStyle,
            }),
          });
          const wrapUp = await res.json();

          if (res.ok) {
            // Add ending as a final beat
            const endingBeat: StoryBeat = {
              id: crypto.randomUUID(),
              index: beatsRef.current.length,
              transcript: "",
              narrativeText: wrapUp.endingText,
              sceneDescription: "The story's conclusion",
              imagePrompt: wrapUp.imagePrompt,
              imageResult: null,
              isVisuallySignificant: true,
              aiFollowUp: wrapUp.aiNarration,
              createdAt: Date.now(),
            };

            setState((prev) => ({
              ...prev,
              beats: [...prev.beats, endingBeat],
              latestFollowUp: wrapUp.aiNarration,
            }));

            // Generate final image (always immediate, not deferred)
            if (wrapUp.imagePrompt && totalImagesRef.current < MAX_IMAGES) {
              enqueueImage(endingBeat.index, wrapUp.imagePrompt);
            }

            // Narrate the ending
            try {
              const ttsRes = await fetch("/api/synthesize-speech", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: wrapUp.aiNarration }),
              });
              const ttsData = await ttsRes.json();
              if (ttsRes.ok) {
                await playTTSAudio(ttsData.audioBase64);
              }
            } catch {
              // TTS failed — question still visible as text
            }
          }
        } catch (err) {
          console.error("Story wrap-up failed:", err);
        }
      }

      // Flush deferred images — generate the other ~50% now
      console.log("[STORY END] About to flush deferred images. deferredImagesRef count:", deferredImagesRef.current.length);
      flushDeferredImages();

      console.log("[STORY END] Setting status: complete");
      setState((prev) => ({
        ...prev,
        status: "complete",
        isProcessingBeat: false,
      }));
    },
    [buildStoryContext, enqueueImage, flushDeferredImages, playTTSAudio]
  );

  // --- Beat analysis pipeline ---
  const triggerBeatAnalysis = useCallback(async () => {
    if (isProcessingBeatRef.current) return;

    const vs = visualSeedRef.current;
    if (!vs) return;

    // Get the current segment (text since last beat boundary)
    const fullFinal = lastFinalTextRef.current;
    const segment = fullFinal.slice(beatBoundaryRef.current).trim();

    // Skip if segment is too short (< 5 words)
    if (!segment || segment.split(/\s+/).length < 5) return;

    isProcessingBeatRef.current = true;
    setState((prev) => ({
      ...prev,
      isProcessingBeat: true,
      status: "processing-beat",
    }));

    // Move the beat boundary forward
    beatBoundaryRef.current = fullFinal.length;
    setState((prev) => ({ ...prev, currentSegment: "" }));

    try {
      // 1. Analyze the beat
      const res = await fetch("/api/analyze-beat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: segment,
          storyContext: buildStoryContext(beatsRef.current),
          characterData: vs.characterData,
          artStyle: vs.artStyle,
          beatIndex: beatsRef.current.length,
          totalImagesGenerated: totalImagesRef.current,
          maxImages: MAX_IMAGES,
        }),
      });

      if (!res.ok) throw new Error("Beat analysis failed");

      const analysis: BeatAnalysisResult = await res.json();

      // 2. Create the beat
      const newBeat: StoryBeat = {
        id: crypto.randomUUID(),
        index: beatsRef.current.length,
        transcript: segment,
        narrativeText: analysis.narrativeText,
        sceneDescription: analysis.sceneDescription,
        imagePrompt: analysis.imagePrompt,
        imageResult: null,
        isVisuallySignificant: analysis.isVisuallySignificant,
        aiFollowUp: analysis.aiFollowUp,
        createdAt: Date.now(),
      };

      setState((prev) => ({
        ...prev,
        beats: [...prev.beats, newBeat],
        latestFollowUp: analysis.aiFollowUp,
      }));

      // 3. Image generation — alternate between immediate and deferred
      if (analysis.isVisuallySignificant && analysis.imagePrompt) {
        significantBeatCountRef.current += 1;
        const count = significantBeatCountRef.current;

        // Odd significant beats: generate now. Even: defer until story ends.
        if (count % 2 === 1) {
          console.log("[BEAT]", newBeat.index, "→ IMMEDIATE image (significant #" + count + ")");
          enqueueImage(newBeat.index, analysis.imagePrompt);
        } else {
          console.log("[BEAT]", newBeat.index, "→ DEFERRED image (significant #" + count + ")");
          deferredImagesRef.current.push({
            beatIndex: newBeat.index,
            prompt: analysis.imagePrompt,
          });
        }
      } else {
        console.log("[BEAT]", newBeat.index, "→ no image (significant:", analysis.isVisuallySignificant, "prompt:", !!analysis.imagePrompt, ")");
      }

      // 4. Check for ending
      if (analysis.isEnding || beatsRef.current.length + 1 >= MAX_BEATS) {
        isProcessingBeatRef.current = false;
        await handleStoryEnd(analysis.isEnding);
        return;
      }

      // 5. Synthesize and play TTS follow-up
      try {
        const ttsRes = await fetch("/api/synthesize-speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: analysis.aiFollowUp }),
        });
        const ttsData = await ttsRes.json();

        if (ttsRes.ok) {
          await playTTSAudio(ttsData.audioBase64);
        }
      } catch {
        // TTS failed — the follow-up question is still visible as text
      }

      isProcessingBeatRef.current = false;
      setState((prev) => ({
        ...prev,
        isProcessingBeat: false,
        status: "listening",
      }));
    } catch (err) {
      console.error("Beat analysis error:", err);
      isProcessingBeatRef.current = false;
      setState((prev) => ({
        ...prev,
        isProcessingBeat: false,
        status: "listening",
        error: err instanceof Error ? err.message : "Something went wrong",
      }));
    }
  }, [buildStoryContext, enqueueImage, handleStoryEnd, playTTSAudio]);

  // --- Cleanup ---
  const cleanup = useCallback(() => {
    stopMonitoringLevel();

    if (pauseCheckIntervalRef.current) {
      clearInterval(pauseCheckIntervalRef.current);
      pauseCheckIntervalRef.current = null;
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }

    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (wsRef.current) {
      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        try {
          wsRef.current.send(JSON.stringify({ type: "stop" }));
        } catch {}
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    analyserRef.current = null;
    isMutedRef.current = false;
  }, [stopMonitoringLevel]);

  // --- Start session ---
  const startSession = useCallback(
    async (visualSeed: VisualSeed) => {
      visualSeedRef.current = visualSeed;
      beatBoundaryRef.current = 0;
      lastFinalTextRef.current = "";
      lastFinalTimestampRef.current = Date.now();
      isProcessingBeatRef.current = false;
      imageQueueRef.current = [];
      isGeneratingImageRef.current = false;
      significantBeatCountRef.current = 0;
      deferredImagesRef.current = [];

      setState({
        ...INITIAL_STATE,
        status: "listening",
      });

      try {
        // 1. Get microphone
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        streamRef.current = stream;

        // 2. AudioContext
        const audioContext = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);

        // 3. AnalyserNode
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        // 4. AudioWorklet
        await audioContext.audioWorklet.addModule("/audio-processor.js");
        const workletNode = new AudioWorkletNode(
          audioContext,
          "pcm-processor"
        );
        workletNodeRef.current = workletNode;
        source.connect(workletNode);
        workletNode.connect(audioContext.destination);

        // 5. WebSocket
        const protocol =
          window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsPort = 3001;
        const ws = new WebSocket(
          `${protocol}//${window.location.hostname}:${wsPort}`
        );
        ws.binaryType = "arraybuffer";
        wsRef.current = ws;

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("WebSocket connection timed out"));
          }, 10000);

          ws.onopen = () => {
            ws.send(
              JSON.stringify({ type: "start", sampleRate: 16000 })
            );
          };

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.type === "ready") {
                clearTimeout(timeout);
                resolve();
              } else if (data.type === "error") {
                clearTimeout(timeout);
                reject(new Error(data.message));
              }
            } catch {}
          };

          ws.onerror = () => {
            clearTimeout(timeout);
            reject(new Error("WebSocket connection failed"));
          };

          ws.onclose = () => {
            clearTimeout(timeout);
          };
        });

        // 6. Transcript handler — track final results for pause detection
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "transcript") {
              const newFinal = data.final || "";
              const newInterim = data.interim || "";

              // Detect new final text (for pause timing)
              if (newFinal && newFinal !== lastFinalTextRef.current) {
                lastFinalTextRef.current = newFinal;
                lastFinalTimestampRef.current = Date.now();
              }

              // Compute current segment for display
              const segment = newFinal.slice(beatBoundaryRef.current);
              const displaySegment =
                segment +
                (newInterim ? (segment ? " " : "") + newInterim : "");

              setState((prev) => ({
                ...prev,
                currentSegment: displaySegment,
                interimTranscript: newInterim,
              }));
            } else if (data.type === "error") {
              setState((prev) => ({ ...prev, error: data.message }));
            }
          } catch {}
        };

        ws.onclose = () => {
          setState((prev) => {
            if (
              prev.status === "listening" ||
              prev.status === "ai-speaking"
            ) {
              return {
                ...prev,
                error: "Connection lost. Your story progress is saved.",
              };
            }
            return prev;
          });
        };

        // 7. Forward audio (with muting support)
        workletNode.port.onmessage = (event) => {
          if (!isMutedRef.current && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        };

        // 8. Duration timer
        durationIntervalRef.current = setInterval(() => {
          setState((prev) => {
            if (prev.duration >= MAX_STORYTELLING_DURATION) {
              return prev;
            }
            return { ...prev, duration: prev.duration + 1 };
          });
        }, 1000);

        // 9. Audio level monitoring
        monitorAudioLevel();

        // 10. Pause detection interval
        pauseCheckIntervalRef.current = setInterval(() => {
          if (
            isProcessingBeatRef.current ||
            isMutedRef.current ||
            statusRef.current === "complete" ||
            statusRef.current === "ending"
          ) {
            return;
          }

          const elapsed =
            Date.now() - lastFinalTimestampRef.current;
          if (elapsed > PAUSE_THRESHOLD_MS) {
            const analyserNode = analyserRef.current;
            if (analyserNode) {
              const dataArray = new Uint8Array(
                analyserNode.frequencyBinCount
              );
              analyserNode.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length / 255;

              if (avg < AUDIO_LEVEL_SILENCE) {
                triggerBeatAnalysis();
              }
            }
          }
        }, 500);
      } catch (err) {
        cleanup();
        const message =
          err instanceof Error ? err.message : "Failed to start storytelling";
        const friendlyMessage =
          message.includes("Permission") || message.includes("NotAllowed")
            ? "Microphone access denied. Please allow microphone access and try again."
            : message;

        setState((prev) => ({
          ...prev,
          status: "idle",
          error: friendlyMessage,
        }));
      }
    },
    [cleanup, monitorAudioLevel, triggerBeatAnalysis]
  );

  // --- End session ---
  const endSession = useCallback(() => {
    cleanup();
    setState((prev) => ({
      ...prev,
      status: "complete",
      audioLevel: 0,
      interimTranscript: "",
      currentSegment: "",
    }));
  }, [cleanup]);

  // --- Parent "Wrap It Up" ---
  const wrapUp = useCallback(async () => {
    cleanup();
    await handleStoryEnd(false);
  }, [cleanup, handleStoryEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    ...state,
    startSession,
    endSession,
    wrapUp,
  };
}

export type StorytellingSession = ReturnType<typeof useStorytellingSession>;
