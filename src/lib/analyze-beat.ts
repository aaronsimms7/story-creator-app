import { BeatAnalysisRequest, BeatAnalysisResult, IMAGE_THRESHOLD_BEAT } from "@/types/story";

export async function analyzeBeat(
  req: BeatAnalysisRequest
): Promise<BeatAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable");
  }

  const imageGuidance =
    req.beatIndex < IMAGE_THRESHOLD_BEAT
      ? "For the first 8 beats, always mark as visually significant."
      : "Be selective — only mark as visually significant if there is a new location, a new character appears, a big action scene, or a dramatic moment. Mundane dialogue or minor details should NOT get an image.";

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a children's story collaborator helping a child (ages 3-10) tell their story.

CHARACTER: ${JSON.stringify(req.characterData)}
ART STYLE: ${req.artStyle.promptModifier}

STORY SO FAR:
${req.storyContext || "(Story just started)"}

LATEST SEGMENT (what the child just said):
"${req.transcript}"

BEAT NUMBER: ${req.beatIndex + 1}
IMAGES GENERATED SO FAR: ${req.totalImagesGenerated} of ${req.maxImages} maximum

Your tasks:
1. Clean up the child's words into a short narrative paragraph for a picture book (1-3 sentences). Keep their voice and creativity — don't make it sound like an adult wrote it.
2. Describe the scene visually in one sentence.
3. Decide if this beat is VISUALLY SIGNIFICANT (worthy of an illustration). ${imageGuidance}
4. If visually significant, write an image generation prompt for a 16:9 landscape children's book illustration in the specified art style, featuring the character. Start with "Children's book illustration, ${req.artStyle.promptModifier}, 16:9 landscape,". Include the character's key visual features for consistency.
5. Write a short, encouraging follow-up question to keep the child talking (1-2 sentences, spoken aloud by an AI storyteller). Be warm, curious, and age-appropriate. Don't repeat questions you've already asked.
6. Determine if the child is ending the story. Look for phrases like "the end", "that's the end", "and they lived happily ever after", "the story is over", "all done", "that's my story", "finished".

Return a JSON object with these exact fields:
- refinedTranscript: the cleaned-up version of what the child said
- sceneDescription: one-sentence visual description of the scene
- isVisuallySignificant: true or false
- imagePrompt: the full image generation prompt, or null if not visually significant
- aiFollowUp: the follow-up question to speak aloud
- isEnding: true if the child is ending the story, false otherwise
- narrativeText: the polished book-ready paragraph (1-3 sentences)

Return ONLY valid JSON, no other text.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Beat analysis failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text?.trim();

  if (!text) {
    throw new Error("No analysis returned from Claude");
  }

  const jsonStr = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  const result = JSON.parse(jsonStr) as BeatAnalysisResult;

  // Hard-cap enforcement: override Claude's decision if we've hit the image limit
  if (result.isVisuallySignificant && req.totalImagesGenerated >= req.maxImages) {
    result.isVisuallySignificant = false;
    result.imagePrompt = null;
  }

  return result;
}
