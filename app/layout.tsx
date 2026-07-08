import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Accessible Alt Text Generator",
  description:
    "Generate WCAG-friendly alt text, long image descriptions, and embedded text transcriptions for nonprofit images.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
