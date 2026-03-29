import { NextResponse } from "next/server";
import { analyzeBeat } from "@/lib/analyze-beat";
import { BeatAnalysisRequest } from "@/types/story";

export async function POST(request: Request) {
  try {
    const body: BeatAnalysisRequest = await request.json();

    if (!body.transcript || typeof body.transcript !== "string") {
      return NextResponse.json(
        { error: "No transcript provided" },
        { status: 400 }
      );
    }

    if (!body.characterData || !body.artStyle) {
      return NextResponse.json(
        { error: "Missing characterData or artStyle" },
        { status: 400 }
      );
    }

    const result = await analyzeBeat(body);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Beat analysis error:", err);
    return NextResponse.json(
      { error: "Failed to analyze story beat. Please try again." },
      { status: 500 }
    );
  }
}
