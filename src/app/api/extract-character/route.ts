import { NextResponse } from "next/server";
import { extractCharacter } from "@/lib/extract-character";

export async function POST(request: Request) {
  try {
    const { transcript } = await request.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { error: "No transcript provided" },
        { status: 400 }
      );
    }

    const character = await extractCharacter(transcript);

    return NextResponse.json({ character });
  } catch (err) {
    console.error("Character extraction error:", err);
    return NextResponse.json(
      { error: "Failed to extract character. Please try again." },
      { status: 500 }
    );
  }
}
