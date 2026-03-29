import { ImageGenerationResult } from "@/types/character";

const REPLICATE_MODEL_URL =
  "https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions";
const REPLICATE_PREDICTIONS_URL = "https://api.replicate.com/v1/predictions";
const POLL_INTERVAL_MS = 1500;
const MAX_POLL_TIME_MS = 60000;

export async function generateImage(
  prompt: string,
  options?: { aspectRatio?: string }
): Promise<ImageGenerationResult> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    throw new Error("Missing REPLICATE_API_TOKEN environment variable");
  }

  const createResponse = await fetch(REPLICATE_MODEL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      input: {
        prompt,
        aspect_ratio: options?.aspectRatio || "1:1",
        num_outputs: 1,
        guidance: 3.5,
        num_inference_steps: 28,
        output_format: "webp",
        output_quality: 90,
      },
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(
      `Replicate create failed: ${createResponse.status} - ${error}`
    );
  }

  const prediction = await createResponse.json();
  const predictionId = prediction.id;

  const startTime = Date.now();
  while (Date.now() - startTime < MAX_POLL_TIME_MS) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    const pollResponse = await fetch(`${REPLICATE_PREDICTIONS_URL}/${predictionId}`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });

    if (!pollResponse.ok) {
      throw new Error(`Replicate poll failed: ${pollResponse.status}`);
    }

    const result = await pollResponse.json();

    if (result.status === "succeeded") {
      const imageUrl = Array.isArray(result.output)
        ? result.output[0]
        : result.output;
      return {
        imageUrl,
        predictionId,
        seed: result.input?.seed,
      };
    }

    if (result.status === "failed" || result.status === "canceled") {
      throw new Error(
        `Image generation ${result.status}: ${result.error || "unknown error"}`
      );
    }
  }

  throw new Error("Image generation timed out after 60 seconds");
}
