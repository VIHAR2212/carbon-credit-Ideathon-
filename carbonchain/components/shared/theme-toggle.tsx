"use client";

import { useEffect, useState } from "react";
import { Icons } from "./icons";

type Theme = "dark" | "light";

const STORAGE_KEY = "carbonchain-theme";

function applyTheme(theme: Theme) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

export function ThemeToggle() {
  // Start as dark on the server and on first client render so markup
  // matches (avoids a hydration mismatch); the real persisted preference
  // is applied in the effect below, after mount.
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial = stored === "light" || stored === "dark" ? stored : "dark";
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : "Toggle theme"}
      className="p-2 rounded-xl text-carbon-300 hover:text-slate-100 hover:bg-carbon-850 border border-carbon-750 transition-colors"
    >
      {theme === "dark" ? <Icons.Sun /> : <Icons.Moon />}
    </button>
  );
}
