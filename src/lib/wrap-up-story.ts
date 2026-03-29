import { WrapUpRequest, WrapUpResult } from "@/types/story";

export async function wrapUpStory(
  req: WrapUpRequest
): Promise<WrapUpResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable");
  }

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
          content: `You are a children's story author helping wrap up a child's story.

CHARACTER: ${JSON.stringify(req.characterData)}
ART STYLE: ${req.artStyle.promptModifier}

STORY SO FAR:
${req.storyContext}

The story needs a satisfying ending. Write:
1. A short ending paragraph (2-3 sentences) that wraps up the adventure in a warm, satisfying way. Keep the child's creative voice.
2. An image generation prompt for the final scene (16:9 landscape children's book illustration).
3. A short narration the AI storyteller will speak aloud to conclude (e.g., "What a wonderful adventure! And that's how {character}'s story ends.").

Return a JSON object with these exact fields:
- endingText: the ending paragraph for the book
- imagePrompt: full image prompt starting with "Children's book illustration, ${req.artStyle.promptModifier}, 16:9 landscape,"
- aiNarration: what to speak aloud to the child

Return ONLY valid JSON, no other text.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Story wrap-up failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text?.trim();

  if (!text) {
    throw new Error("No wrap-up returned from Claude");
  }

  const jsonStr = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(jsonStr) as WrapUpResult;
}
