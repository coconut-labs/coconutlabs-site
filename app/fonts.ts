import { Geist, Geist_Mono } from "next/font/google";

// Direction A is Geist-only. Instrument Serif and Fraunces were removed when
// the token layer stopped referencing their variables — loading them was two
// font downloads for zero rendered glyphs.

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});


