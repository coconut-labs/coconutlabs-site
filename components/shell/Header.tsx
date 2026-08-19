"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV_COLUMNS } from "@/lib/nav";
import { ThemeToggle } from "./ThemeToggle";

/* Direction A chrome. The five-item inline nav + CTA is gone; the header is
   a wordmark on the left and a MENU toggle on the right, with a full-width
   panel below carrying four mono-labelled columns and a status block. Menu
   link styling follows the handoff: 17px body links on 44px hit targets,
   10.5px/.14em column labels, panel on --bg-1 with a --rule bottom border.

   The columns come from lib/nav.ts and are the same object the footer
   renders. Do not add a link here. */

const menuLinkClass =
  "focus-ring flex min-h-[44px] items-center rounded-sm text-[17px] text-ink-0 transition hover:underline hover:underline-offset-[3px]";

export function Header() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  // Any navigation closes the panel.
  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      setOpen(false);
    }
  }, [pathname]);

  // Escape closes the panel and hands focus back to the toggle.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const closeMenu = () => setOpen(false);

  return (
    <header className="no-print sticky top-0 z-50 bg-bg-0">
      <div className="flex items-center justify-between gap-4 border-b border-hair px-[var(--space-page-x)] py-3">
        <Link
          className="focus-ring rounded-sm text-[17px] font-semibold lowercase tracking-[-0.02em] text-ink-0"
          href="/"
        >
          coconut<span className="text-accent">labs</span>
        </Link>

        <div className="flex items-center gap-[clamp(16px,3vw,28px)]">
          <button
            aria-controls="site-menu"
            aria-expanded={open}
            className="focus-ring flex min-h-[44px] cursor-pointer items-center justify-end gap-[10px] rounded-sm px-[2px] py-[6px] font-mono text-[11px] tracking-[0.14em] text-ink-1"
            onClick={() => setOpen((value) => !value)}
            ref={buttonRef}
            type="button"
          >
            {open ? "CLOSE" : "MENU"}
            <span aria-hidden="true" className="flex flex-col gap-[3px]">
              <span className="block h-px w-4 bg-ink-1" />
              <span className="block h-px w-4 bg-ink-1" />
            </span>
          </button>
          <ThemeToggle />
        </div>
      </div>

      <div className="menu-panel border-b border-rule bg-bg-1" hidden={!open} id="site-menu">
        <nav
          aria-label="Primary"
          className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-[clamp(22px,3vw,44px)] px-[var(--space-page-x)] pb-[clamp(28px,4vw,40px)] pt-[clamp(24px,3vw,36px)]"
        >
          {NAV_COLUMNS.map((column) => (
            <div className="flex flex-col gap-[2px]" key={column.label}>
              <p className="mb-[10px] font-mono text-[10.5px] tracking-[0.14em] text-ink-2">
                {column.label}
              </p>
              {column.links.map((link) =>
                link.external || link.plain ? (
                  <a className={menuLinkClass} href={link.href} key={link.href} onClick={closeMenu}>
                    {link.label}
                    {/* ml-1: the row is a flex container, so a leading space
                        inside the span would collapse and the glyph would sit
                        flush against the label. */}
                    {link.external ? <span aria-hidden="true" className="ml-1">↗</span> : null}
                  </a>
                ) : (
                  <Link className={menuLinkClass} href={link.href} key={link.href} onClick={closeMenu}>
                    {link.label}
                  </Link>
                ),
              )}
            </div>
          ))}

          <div className="flex flex-col gap-[10px] self-start">
            <p className="font-mono text-[10.5px] tracking-[0.14em] text-ink-2">STATUS</p>
            <p className="font-mono text-[12px] leading-[1.7] text-ink-1">
              <span className="text-success">● LIVE</span>
              <br />
              masterclass · live
              <br />
              <a
                className="focus-ring rounded-sm transition hover:underline hover:underline-offset-[3px]"
                href="mailto:info@coconutlabs.org"
                onClick={closeMenu}
              >
                info@coconutlabs.org
              </a>
            </p>
          </div>
        </nav>
      </div>
    </header>
  );
}
