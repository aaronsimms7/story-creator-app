"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type StreamingStatus = "idle" | "connecting" | "streaming" | "stopped";

interface StreamingRecorderState {
  status: StreamingStatus;
  interimTranscript: string;
  finalTranscript: string;
  audioLevel: number;
  duration: number;
  error: string | null;
}

const MAX_DURATION = 120; // 2 minutes for streaming

export function useStreamingRecorder() {
  const [state, setState] = useState<StreamingRecorderState>({
    status: "idle",
    interimTranscript: "",
    finalTranscript: "",
    audioLevel: 0,
    duration: 0,
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const levelAnimationRef = useRef<number | null>(null);

  const fullTranscript =
    state.finalTranscript +
    (state.interimTranscript
      ? (state.finalTranscript ? " " : "") + state.interimTranscript
      : "");

  // Audio level monitoring (same approach as useAudioRecorder)
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

  const cleanup = useCallback(() => {
    stopMonitoringLevel();

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
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
  }, [stopMonitoringLevel]);

  const startRecording = useCallback(async () => {
    setState((prev) => ({ ...prev, status: "connecting", error: null }));

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

      // 2. Set up AudioContext
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      // 3. AnalyserNode for audio level visualization
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // 4. AudioWorklet for PCM capture
      await audioContext.audioWorklet.addModule("/audio-processor.js");
      const workletNode = new AudioWorkletNode(audioContext, "pcm-processor");
      workletNodeRef.current = workletNode;
      source.connect(workletNode);
      // AudioWorklet needs a destination to keep processing
      workletNode.connect(audioContext.destination);

      // 5. Open WebSocket (separate port from Next.js to avoid HMR conflicts)
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsPort = 3001;
      const ws = new WebSocket(`${protocol}//${window.location.hostname}:${wsPort}`);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("WebSocket connection timed out"));
        }, 10000);

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: "start", sampleRate: 16000 }));
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

      // 6. Set up ongoing message handler for transcripts
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "transcript") {
            setState((prev) => ({
              ...prev,
              finalTranscript: data.final || prev.finalTranscript,
              interimTranscript: data.interim || "",
            }));
          } else if (data.type === "error") {
            setState((prev) => ({ ...prev, error: data.message }));
          }
        } catch {}
      };

      ws.onclose = () => {
        // If we're still streaming, it means unexpected close
        setState((prev) => {
          if (prev.status === "streaming") {
            return { ...prev, status: "stopped" };
          }
          return prev;
        });
      };

      // 7. Forward audio chunks from worklet to WebSocket
      workletNode.port.onmessage = (event) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(event.data);
        }
      };

      // 8. Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.duration >= MAX_DURATION) {
            // Auto-stop at max duration
            return prev;
          }
          return { ...prev, duration: prev.duration + 1 };
        });
      }, 1000);

      // 9. Start audio level monitoring
      monitorAudioLevel();

      setState((prev) => ({ ...prev, status: "streaming" }));
    } catch (err) {
      cleanup();
      const message =
        err instanceof Error ? err.message : "Failed to start recording";

      // Friendly error for mic permission denial
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
  }, [cleanup, monitorAudioLevel]);

  const stopRecording = useCallback(() => {
    cleanup();
    setState((prev) => ({
      ...prev,
      status: "stopped",
      interimTranscript: "",
      audioLevel: 0,
    }));
  }, [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setState({
      status: "idle",
      interimTranscript: "",
      finalTranscript: "",
      audioLevel: 0,
      duration: 0,
      error: null,
    });
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    ...state,
    fullTranscript,
    maxDuration: MAX_DURATION,
    startRecording,
    stopRecording,
    reset,
  };
}
