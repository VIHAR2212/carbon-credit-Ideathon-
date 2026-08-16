import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "CarbonChain — Trusted Infrastructure for India's Carbon Market",
  description:
    "Prototype MRV, carbon-credit registry, provenance, and marketplace platform designed around India's emerging carbon market and CCTS-compatible workflows.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Runs before paint to avoid a flash of the wrong theme on load —
            reads the same localStorage key theme-toggle.tsx writes to. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
              var t = localStorage.getItem("carbonchain-theme");
              if (t === "light") document.documentElement.setAttribute("data-theme", "light");
            } catch (e) {}`,
          }}
        />
      </head>
      <body className="text-slate-100 selection:bg-brand-500 selection:text-black font-sans">
        {/* The animated ambient gradient is a pure-CSS layer (body::before
            in globals.css) rather than the earlier WebGL canvas — this
            keeps it in sync with the light/dark theme toggle, since the
            CSS gradient reads the same carbon-* custom properties that
            flip under html[data-theme="light"]. A WebGL canvas with
            hardcoded colors could not react to that toggle. */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
