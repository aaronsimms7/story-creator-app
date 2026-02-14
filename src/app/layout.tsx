import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Story Creator - Create Magical Picture Books",
  description:
    "Create personalized picture books with your child through voice-powered storytelling and AI illustration.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
