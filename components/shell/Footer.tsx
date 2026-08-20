import Link from "next/link";
import { HOSTNAME_RAIL, NAV_COLUMNS } from "@/lib/nav";
import { CadenceSignup } from "./CadenceSignup";

/* Direction A footer, full sitemap edition. Four rows on the recessed
   --bg-2 ground:
   1. Steady Cadence: pitch line left, live signup right (id="cadence" stays
      the anchor target for /newsletter and /cadence-band links).
   2. The map: the same four columns the header menu renders, from the same
      lib/nav.ts export, in the same order. The old SURFACES column is gone;
      it duplicated LEARN.
   3. The hostname rail: every host in the estate, mono, one line.
   4. The mono baseline row: identity, GitHub, RSS, email.
   Only surfaces that exist today get a row. Surfaces we do not have yet get
   no row at all, rather than a promise of one. */

const footerLinkClass =
  "focus-ring rounded-sm transition hover:underline hover:underline-offset-[3px]";

export function Footer() {
  return (
    <footer
      className="border-t border-rule bg-bg-2 px-[var(--space-page-x)] pb-[34px] pt-[26px]"
      id="cadence"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
        <p className="max-w-[44ch] font-mono text-[11px] leading-[1.7] text-ink-2">
          Steady Cadence · one measured letter: what I shipped and what I got wrong
        </p>
        <CadenceSignup />
      </div>

      <nav
        aria-label="Site map"
        className="mt-[20px] grid grid-cols-2 gap-x-8 gap-y-7 border-t border-hair pt-[22px] sm:grid-cols-2 md:grid-cols-4"
      >
        {NAV_COLUMNS.map((col) => (
          <div key={col.label}>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-2">{col.label}</p>
            <ul className="mt-3 space-y-[7px]">
              {col.links.map((l) => (
                <li key={l.href}>
                  {l.external || l.plain ? (
                    <a className={`${footerLinkClass} text-[12.5px] text-ink-1`} href={l.href}>
                      {l.label}
                      
                    </a>
                  ) : (
                    <Link className={`${footerLinkClass} text-[12.5px] text-ink-1`} href={l.href}>
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <p className="mt-[24px] flex flex-wrap gap-x-3 gap-y-2 border-t border-hair pt-[18px] font-mono text-[11px] leading-[1.7] text-ink-2">
        {HOSTNAME_RAIL.map((host, i) => (
          <span key={host.href}>
            <a className={footerLinkClass} href={host.href}>
              {host.label}
            </a>
            {i < HOSTNAME_RAIL.length - 1 ? (
              <span aria-hidden="true" className="ml-3 text-ink-2/60">
                ·
              </span>
            ) : null}
          </span>
        ))}
      </p>

      <div className="mt-[18px] flex flex-wrap justify-between gap-x-8 gap-y-3 border-t border-hair pt-[18px] font-mono text-[11px] text-ink-2">
        <p>Coconut Labs · Shrey Patel · systems engineering and applied AI</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a className={footerLinkClass} href="https://github.com/coconut-labs">
            GitHub
          </a>
          <a className={footerLinkClass} href="/rss.xml">
            RSS
          </a>
          <a className={footerLinkClass} href="mailto:info@coconutlabs.org">
            info@coconutlabs.org
          </a>
        </div>
      </div>
    </footer>
  );
}
