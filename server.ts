import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";
import { SpeechClient } from "@google-cloud/speech";
import type { google } from "@google-cloud/speech/build/protos/protos";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = parseInt(process.env.PORT || "3000", 10);
const WS_PORT = parseInt(process.env.WS_PORT || "3001", 10);

// Google STT streaming config
const STT_CONFIG: google.cloud.speech.v1.IStreamingRecognitionConfig = {
  config: {
    encoding: "LINEAR16" as const,
    sampleRateHertz: 16000,
    languageCode: "en-US",
    enableAutomaticPunctuation: true,
    model: "latest_long",
  },
  interimResults: true,
  singleUtterance: false,
};

// Google STT streams auto-close after ~5 minutes. Restart before that.
const STT_STREAM_TIMEOUT_MS = 4 * 60 * 1000;

function handleWebSocketConnection(ws: WebSocket) {
  console.log("[WS] Client connected");
  const speechClient = new SpeechClient();
  let recognizeStream: ReturnType<
    typeof speechClient.streamingRecognize
  > | null = null;
  let restartTimeout: NodeJS.Timeout | null = null;
  let finalTranscriptSoFar = "";

  function startSTTStream() {
    console.log("[WS] Starting Google STT stream");
    recognizeStream = speechClient
      .streamingRecognize(STT_CONFIG)
      .on("error", (err: Error) => {
        if (
          err.message.includes("cancelled") ||
          err.message.includes("CANCELLED")
        ) {
          return;
        }
        console.error("[STT] Stream error:", err.message);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "error", message: err.message }));
        }
      })
      .on(
        "data",
        (data: google.cloud.speech.v1.IStreamingRecognizeResponse) => {
          if (
            !data.results ||
            data.results.length === 0 ||
            ws.readyState !== WebSocket.OPEN
          ) {
            return;
          }

          const result = data.results[0];
          const transcript = result.alternatives?.[0]?.transcript || "";

          if (result.isFinal) {
            finalTranscriptSoFar +=
              (finalTranscriptSoFar ? " " : "") + transcript;
            ws.send(
              JSON.stringify({
                type: "transcript",
                interim: "",
                final: finalTranscriptSoFar,
              })
            );
          } else {
            ws.send(
              JSON.stringify({
                type: "transcript",
                interim: transcript,
                final: finalTranscriptSoFar,
              })
            );
          }
        }
      );

    if (restartTimeout) clearTimeout(restartTimeout);
    restartTimeout = setTimeout(() => {
      restartSTTStream();
    }, STT_STREAM_TIMEOUT_MS);
  }

  function restartSTTStream() {
    if (recognizeStream) {
      recognizeStream.end();
      recognizeStream = null;
    }
    startSTTStream();
  }

  function cleanup() {
    if (restartTimeout) {
      clearTimeout(restartTimeout);
      restartTimeout = null;
    }
    if (recognizeStream) {
      recognizeStream.end();
      recognizeStream = null;
    }
  }

  ws.on("message", (message: Buffer, isBinary: boolean) => {
    // Binary data = audio chunk
    if (isBinary) {
      if (recognizeStream) {
        recognizeStream.write(message);
      }
      return;
    }

    // Text message = control command
    try {
      const data = JSON.parse(message.toString());

      if (data.type === "start") {
        console.log("[WS] Received start command");
        finalTranscriptSoFar = "";
        startSTTStream();
        ws.send(JSON.stringify({ type: "ready" }));
        console.log("[WS] Sent ready response");
      } else if (data.type === "stop") {
        console.log("[WS] Received stop command");
        cleanup();
      }
    } catch {
      console.error("[WS] Invalid message");
    }
  });

  ws.on("close", () => {
    console.log("[WS] Client disconnected");
    cleanup();
  });

  ws.on("error", (err: Error) => {
    console.error("[WS] Error:", err.message);
    cleanup();
  });
}

app.prepare().then(() => {
  // Next.js HTTP server
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  server.listen(PORT, () => {
    console.log(`> Next.js ready on http://localhost:${PORT}`);
  });

  // Separate WebSocket server on its own port (avoids Next.js HMR conflicts)
  const wss = new WebSocketServer({ port: WS_PORT });
  wss.on("connection", handleWebSocketConnection);
  console.log(`> WebSocket server on ws://localhost:${WS_PORT}`);
});
