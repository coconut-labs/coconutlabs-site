"use client";

import { useState } from "react";

export function buildMailtoHref(email: string, subject?: string): string {
  const params = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return `mailto:${email}${params}`;
}

export function EmailLink({
  email,
  subject,
  label,
  className = "",
}: {
  email: string;
  subject?: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const href = buildMailtoHref(email, subject);

  async function copyEmail() {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(email);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = email;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <span className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      <a
        className="focus-ring inline-flex items-center gap-2 rounded-sm text-accent transition hover:underline"
        data-cta="mailto"
        href={href}
      >
        {label ?? email}
      </a>
      <button
        aria-label={`Copy ${email}`}
        className={`focus-ring inline-flex h-9 items-center gap-2 rounded border px-3 font-mono text-[0.7rem] uppercase tracking-wide transition ${
          copied
            ? "border-success/40 bg-success/10 text-success"
            : "border-rule bg-bg-1 text-ink-1 hover:border-accent hover:text-accent"
        }`}
        data-cta="copy-email"
        onClick={copyEmail}
        title={copied ? "Copied" : `Copy ${email}`}
        type="button"
      >
        {copied ? (
          <>
            <span aria-hidden="true">✓</span>
            Copied
          </>
        ) : (
          "Copy"
        )}
      </button>
    </span>
  );
}
