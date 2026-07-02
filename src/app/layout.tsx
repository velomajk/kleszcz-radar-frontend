import type { Metadata, Viewport } from "next";
import { Public_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const sans = Public_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Radar Kleszczy — anonimowe zgłoszenia i mapa ryzyka",
  description:
    "Anonimowo zgłoś ukłucie kleszcza i sprawdź zagregowaną mapę ryzyka w Polsce. Bez konta, bez publikowania dokładnej lokalizacji.",
  // Never leak the private symptom token via the Referer header (static-export
  // friendly replacement for a server-set Referrer-Policy header).
  referrer: "no-referrer",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#14584A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className={`${sans.variable} ${serif.variable}`}>
      <body className="font-sans text-ink">{children}</body>
    </html>
  );
}
