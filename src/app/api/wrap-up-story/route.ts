import { NextResponse } from "next/server";
import { wrapUpStory } from "@/lib/wrap-up-story";
import { WrapUpRequest } from "@/types/story";

export async function POST(request: Request) {
  try {
    const body: WrapUpRequest = await request.json();

    if (!body.storyContext || !body.characterData || !body.artStyle) {
      return NextResponse.json(
        { error: "Missing storyContext, characterData, or artStyle" },
        { status: 400 }
      );
    }

    const result = await wrapUpStory(body);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Story wrap-up error:", err);
    return NextResponse.json(
      { error: "Failed to wrap up story. Please try again." },
      { status: 500 }
    );
  }
}
