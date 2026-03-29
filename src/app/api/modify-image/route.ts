import { NextResponse } from "next/server";
import { generateImage } from "@/lib/generate-image";

export async function POST(request: Request) {
  try {
    const { originalPrompt, modificationText } = await request.json();

    if (!originalPrompt || !modificationText) {
      return NextResponse.json(
        { error: "Missing originalPrompt or modificationText" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("Missing ANTHROPIC_API_KEY");
    }

    const mergeResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 512,
          messages: [
            {
              role: "user",
              content: `You are helping modify an image generation prompt for a children's book character.

Original prompt:
"${originalPrompt}"

The user wants this change:
"${modificationText}"

Create a new complete image generation prompt that incorporates the requested changes while keeping everything else from the original. Return ONLY the new prompt text, nothing else.`,
            },
          ],
        }),
      }
    );

    if (!mergeResponse.ok) {
      throw new Error("Failed to merge modification");
    }

    const mergeData = await mergeResponse.json();
    const newPrompt = mergeData.content?.[0]?.text?.trim();

    if (!newPrompt) {
      throw new Error("No modified prompt returned");
    }

    const result = await generateImage(newPrompt);

    return NextResponse.json({ ...result, prompt: newPrompt });
  } catch (err) {
    console.error("Image modification error:", err);
    return NextResponse.json(
      { error: "Failed to modify image. Please try again." },
      { status: 500 }
    );
  }
}
