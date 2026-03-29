import { CharacterData } from "@/types/character";

export async function extractCharacter(
  transcript: string
): Promise<CharacterData> {
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
          content: `Analyze this child's story idea and extract character details.

Story idea: "${transcript}"

Extract and return a JSON object with these exact fields:
- name: The character's name (if not given, invent a fun one that fits)
- type: What kind of character (e.g., "dragon", "princess", "robot dog")
- personality: 2-3 personality traits
- appearance: Detailed visual description for an illustrator (colors, size, features, clothing)
- colors: Primary colors associated with the character
- distinguishingFeatures: Unique visual features that make this character recognizable
- setting: Where the story takes place
- conflict: The main adventure or challenge

Return ONLY valid JSON, no other text.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Character extraction failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text?.trim();

  if (!text) {
    throw new Error("No character data returned from Claude");
  }

  const jsonStr = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(jsonStr) as CharacterData;
}
