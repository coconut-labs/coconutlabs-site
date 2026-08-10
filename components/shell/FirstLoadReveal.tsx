"use client";

import { useEffect, useState } from "react";

const KEY = "coconutlabs.first-reveal";

export function FirstLoadReveal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    if (window.sessionStorage.getItem(KEY)) {
      return;
    }

    window.sessionStorage.setItem(KEY, "1");
    setShow(true);
    const timeout = window.setTimeout(() => setShow(false), 1050);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!show) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[200] grid place-items-center bg-bg-0 text-ink-0"
      style={{ animation: "first-reveal 720ms var(--ease-paper-tear) 180ms forwards" }}
    >
      <span className="text-5xl">Coconut Labs</span>
    </div>
  );
}
