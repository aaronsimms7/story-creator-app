import { TextToSpeechClient } from "@google-cloud/text-to-speech";

let client: TextToSpeechClient | null = null;

function getClient(): TextToSpeechClient {
  if (!client) {
    client = new TextToSpeechClient();
  }
  return client;
}

export async function synthesizeSpeech(
  text: string,
  voiceName: string = "en-US-Studio-O"
): Promise<Buffer> {
  const ttsClient = getClient();

  const [response] = await ttsClient.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode: "en-US",
      name: voiceName,
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: 0.9,
      pitch: 0,
    },
  });

  if (!response.audioContent) {
    throw new Error("No audio content returned from Google TTS");
  }

  return Buffer.from(response.audioContent as Uint8Array);
}
