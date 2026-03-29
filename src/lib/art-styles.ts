import { ArtStyle } from "@/types/character";

export const ART_STYLES: ArtStyle[] = [
  {
    id: "watercolor",
    name: "Watercolor",
    description: "Soft, dreamy, gentle washes of color",
    emoji: "\uD83C\uDFA8",
    promptModifier:
      "watercolor illustration style, soft edges, gentle washes of color, dreamy atmosphere, delicate brushstrokes",
  },
  {
    id: "pencil-sketch",
    name: "Pencil Sketch",
    description: "Classic, hand-drawn, detailed lines",
    emoji: "\u270F\uFE0F",
    promptModifier:
      "pencil sketch illustration, hand-drawn style, detailed linework, crosshatching, classic illustration",
  },
  {
    id: "crayon",
    name: "Crayon Drawing",
    description: "Playful, colorful, childlike charm",
    emoji: "\uD83D\uDD8D\uFE0F",
    promptModifier:
      "crayon drawing style, bold waxy colors, childlike charm, playful illustration, textured paper",
  },
  {
    id: "3d-render",
    name: "3D Render",
    description: "Modern, Pixar-like, polished",
    emoji: "\uD83C\uDFAD",
    promptModifier:
      "3D rendered illustration, Pixar-like style, smooth surfaces, volumetric lighting, polished CGI look",
  },
  {
    id: "claymation",
    name: "Claymation",
    description: "Tactile, handmade, Wallace & Gromit",
    emoji: "\uD83C\uDFFA",
    promptModifier:
      "claymation style illustration, stop-motion look, sculpted clay figures, tactile texture, handmade feel",
  },
  {
    id: "geometric",
    name: "Geometric",
    description: "Clean, minimalist, modern shapes",
    emoji: "\uD83D\uDCD0",
    promptModifier:
      "geometric minimalist illustration, clean shapes, flat design, modern graphic style, bold simple forms",
  },
  {
    id: "pop-art",
    name: "Pop Art",
    description: "Bold, colorful, high-energy",
    emoji: "\uD83C\uDF08",
    promptModifier:
      "pop art style illustration, bold outlines, vibrant saturated colors, comic book influence, high energy",
  },
  {
    id: "classic-storybook",
    name: "Classic Storybook",
    description: "Traditional, warm, timeless",
    emoji: "\uD83D\uDCDA",
    promptModifier:
      "classic storybook illustration, traditional children's book art, warm colors, detailed backgrounds, timeless style",
  },
];
