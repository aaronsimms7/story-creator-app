import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/google-speech";
import { refineTranscript } from "@/lib/refine-transcript";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio");

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Convert to Buffer for Google Speech-to-Text
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Reject files over 10MB
    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Audio file too large (max 10MB)" },
        { status: 400 }
      );
    }

    const rawTranscript = await transcribeAudio(buffer);

    if (!rawTranscript) {
      return NextResponse.json(
        { error: "Could not understand the audio. Please try again." },
        { status: 422 }
      );
    }

    const transcript = await refineTranscript(rawTranscript);

    return NextResponse.json({ transcript, rawTranscript });
  } catch (err) {
    console.error("Transcription error:", err);
    return NextResponse.json(
      { error: "Transcription failed. Please try again." },
      { status: 500 }
    );
  }
}
