import { NextResponse } from "next/server";
import { generateImage } from "@/lib/generate-image";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "No prompt provided" },
        { status: 400 }
      );
    }

    const result = await generateImage(prompt);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Image generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate image. Please try again." },
      { status: 500 }
    );
  }
}
