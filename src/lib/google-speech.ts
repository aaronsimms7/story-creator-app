export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }

  // Build multipart form data manually for Node.js fetch
  const formData = new FormData();
  const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: "audio/webm" });
  formData.append("file", audioBlob, "recording.webm");
  formData.append("model", "whisper-1");
  formData.append("language", "en");

  const response = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Whisper API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.text?.trim() ?? "";
}
