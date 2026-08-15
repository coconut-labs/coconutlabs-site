import Link from "next/link";
import { CadenceSignup } from "./CadenceSignup";

/* Direction A footer, full sitemap edition. Three rows on the recessed
   --bg-2 ground:
   1. Steady Cadence: pitch line left, live signup right (id="cadence" stays
      the anchor target for /newsletter and /cadence-band links).
   2. The map: every header-menu destination plus the lab's other surfaces,
      in the same WORK / WRITING / LAB columns the menu uses, with a fourth
      SURFACES column for the subdomains and a fifth for contact.
   3. The mono baseline row: identity, GitHub, RSS, email.
   Only surfaces that exist today get hrefs. Surfaces we do not have yet get
   no row at all, rather than a promise of one. */

const footerLinkClass =
  "focus-ring rounded-sm transition hover:underline hover:underline-offset-[3px]";

const COLUMNS: { label: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    label: "WORK",
    links: [
      { label: "Projects", href: "/projects" },
      { label: "Hall of demos", href: "/projects/gallery" },
      { label: "KVWarden", href: "/projects/kvwarden" },
      { label: "mlxd", href: "/projects/mlxd" },
      { label: "Coconut OS", href: "/projects/coconut-os" },
      { label: "Benchmarks", href: "/benchmarks" },
    ],
  },
  {
    label: "WRITING",
    links: [
      { label: "Research", href: "/research" },
      { label: "Tenant fairness on shared inference", href: "/research/tenant-fairness-on-shared-inference" },
      { label: "A model in the room", href: "/research/a-model-in-the-room" },
      { label: "What mixing taught me about evals", href: "/research/mixing-and-evals" },
      { label: "The nightly record", href: "/cadence" },
    ],
  },
  {
    label: "LAB",
    links: [
      { label: "About", href: "/about" },
      { label: "Library", href: "/library" },
      { label: "Join us", href: "/joinus" },
      { label: "Working drawings", href: "/drawings" },
      { label: "Colophon", href: "/colophon" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    label: "SURFACES",
    links: [
      { label: "Masterclass", href: "https://masterclass.coconutlabs.org", external: true },
      { label: "Shrey Patel", href: "https://shreypatel.coconutlabs.org", external: true },
      { label: "coconutos.org", href: "https://coconutos.org", external: true },
      { label: "kvwarden.org", href: "https://kvwarden.org", external: true },
      { label: "The academic wing", href: "https://library.coconutlabs.org", external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer
      className="border-t border-rule bg-bg-2 px-[var(--space-page-x)] pb-[34px] pt-[26px]"
      id="cadence"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
        <p className="max-w-[44ch] font-mono text-[11px] leading-[1.7] text-ink-2">
          Steady Cadence · one measured letter: what we shipped and what we got wrong
        </p>
        <CadenceSignup />
      </div>

      <nav
        aria-label="Site map"
        className="mt-[20px] grid grid-cols-2 gap-x-8 gap-y-7 border-t border-hair pt-[22px] sm:grid-cols-2 md:grid-cols-4"
      >
        {COLUMNS.map((col) => (
          <div key={col.label}>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-2">{col.label}</p>
            <ul className="mt-3 space-y-[7px]">
              {col.links.map((l) => (
                <li key={l.href}>
                  {l.external ? (
                    <a className={`${footerLinkClass} text-[12.5px] text-ink-1`} href={l.href}>
                      {l.label} <span aria-hidden="true">↗</span>
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

      <div className="mt-[24px] flex flex-wrap justify-between gap-x-8 gap-y-3 border-t border-hair pt-[18px] font-mono text-[11px] text-ink-2">
        <p>Coconut Labs · one lab, several surfaces</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a className={footerLinkClass} href="https://github.com/coconut-labs">
            GitHub ↗
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
