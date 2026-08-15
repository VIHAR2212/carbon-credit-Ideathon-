import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Velaris from "@/components/ui/velaris";

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
        {/* Fixed, full-viewport ambient gradient — sits behind every page.
            Positioned outside the scrolling content flow so it never
            affects layout or scroll behavior of the app shell below. */}
        <div className="fixed inset-0 z-0">
          <Velaris height="100vh" grain={0.08} speed={0.8} />
        </div>

        <div className="relative z-10">
          <AuthProvider>{children}</AuthProvider>
        </div>
      </body>
    </html>
  );
}
