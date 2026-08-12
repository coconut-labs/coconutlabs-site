"use client";

import { useEffect, useState } from "react";

/* Three-state theme control, header chrome. Cycles system → light → dark on
   one 44px button: glyph + visible mono label, styled to sit beside MENU.
   "light"/"dark" set data-theme on <html> (tokens.css overrides key off it)
   and persist to localStorage("theme"); "system" removes both so the
   prefers-color-scheme media block takes over again. The inline script in
   app/layout.tsx replays the stored choice before first paint, so this
   component only has to keep the attribute and the label in sync after
   hydration. First render always says SYSTEM; the mount effect adopts the
   stored value, which matches what the no-flash script already painted. */

type Theme = "system" | "light" | "dark";

const ORDER: Theme[] = ["system", "light", "dark"];

const GLYPH: Record<Theme, string> = { system: "◐", light: "○", dark: "●" };

const LABEL: Record<Theme, string> = { system: "SYSTEM", light: "LIGHT", dark: "DARK" };

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  // Adopt the persisted choice after hydration. Reading localStorage during
  // render would mismatch the server markup.
  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") setTheme(stored);
    } catch {
      /* storage unavailable: stay on system */
    }
  }, []);

  const cycle = () => {
    const next: Theme = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length] ?? "system";
    setTheme(next);
    apply(next);
    try {
      if (next === "system") {
        localStorage.removeItem("theme");
      } else {
        localStorage.setItem("theme", next);
      }
    } catch {
      /* storage unavailable: attribute still applied for this page view */
    }
  };

  return (
    <button
      aria-label={`Theme: ${LABEL[theme].toLowerCase()}. Switch theme`}
      className="focus-ring flex min-h-[44px] cursor-pointer items-center gap-[8px] rounded-sm px-[2px] py-[6px] font-mono text-[11px] tracking-[0.14em] text-ink-1"
      data-testid="theme-toggle"
      onClick={cycle}
      type="button"
    >
      <span aria-hidden="true">{GLYPH[theme]}</span>
      {LABEL[theme]}
    </button>
  );
}
