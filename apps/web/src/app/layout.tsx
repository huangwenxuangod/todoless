import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "todoless — Tasks from Voice",
  description:
    "Voice-first, AI-powered task manager. Hold a shortcut, speak, and watch structured tasks appear.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
