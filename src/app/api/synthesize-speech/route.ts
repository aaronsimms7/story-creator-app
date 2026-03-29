import { NextResponse } from "next/server";
import { synthesizeSpeech } from "@/lib/synthesize-speech";

export async function POST(request: Request) {
  try {
    const { text, voiceName } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      );
    }

    const audioBuffer = await synthesizeSpeech(text, voiceName);
    const audioBase64 = audioBuffer.toString("base64");

    return NextResponse.json({ audioBase64, contentType: "audio/mp3" });
  } catch (err) {
    console.error("Speech synthesis error:", err);
    return NextResponse.json(
      { error: "Failed to synthesize speech. Please try again." },
      { status: 500 }
    );
  }
}
