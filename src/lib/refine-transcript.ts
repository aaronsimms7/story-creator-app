export async function refineTranscript(rawTranscript: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("No ANTHROPIC_API_KEY — skipping transcript refinement");
    return rawTranscript;
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
          content: `Clean up this transcript from a child describing their story idea.

Rules:
- Remove filler words (um, uh, like, you know, so, basically)
- Fix grammar and sentence structure
- Keep the child's voice, personality, and creativity intact
- Do NOT add new ideas or change the meaning
- Do NOT make it sound like an adult wrote it
- Keep it in first person if they used first person
- Return ONLY the cleaned text, nothing else

Transcript:
${rawTranscript}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    console.warn("Transcript refinement failed, using raw transcript");
    return rawTranscript;
  }

  const data = await response.json();
  const refined = data.content?.[0]?.text?.trim();
  return refined || rawTranscript;
}
