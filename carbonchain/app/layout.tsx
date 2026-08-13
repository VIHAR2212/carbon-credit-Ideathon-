import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarbonChain — Trusted Infrastructure for India's Carbon Market",
  description:
    "Prototype MRV, carbon-credit registry, provenance, and marketplace platform designed around India's emerging carbon market and CCTS-compatible workflows.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-carbon-950 text-slate-100 selection:bg-brand-500 selection:text-black font-sans">
        {children}
      </body>
    </html>
  );
}
