import Link from "next/link";

/* The estate map on the home page. Five hairline rows, not cards and not a
   grid: the surface name on the left, one real sentence beside it. Rows
   carrying sentences make a map; rows carrying bare hostnames make a link
   dump. There is no state column: every row here is reachable, and a door
   in an unusual state says so in its own sentence.

   Row order is deliberate and not alphabetical: the two surfaces with a
   measured claim behind them lead, teaching surfaces follow, the operations
   readout closes. The waterline atlas and the private library came off this
   map when their serving stack (a tunnel to lab hardware) was retired on
   2026-08-22; restore the rows only when an origin serves again. */

type Surface = {
  /** What the row is called. A real domain where we have one. */
  host: string;
  href: string;
  copy: string;
  /** Off-domain: rendered as a plain anchor, the visible host names it. */
  external?: boolean;
};

const SURFACES: Surface[] = [
  {
    host: "kvwarden.org",
    href: "https://kvwarden.org",
    copy: "The scheduler that keeps a quiet tenant quiet. v0.1.6 on PyPI, harness public.",
    external: true,
  },
  {
    host: "masterclass.coconutlabs.org",
    href: "https://masterclass.coconutlabs.org",
    copy: "Five chapters on forward-deployed engineering, start to finish.",
    external: true,
  },
  {
    host: "coconutos.org",
    href: "https://coconutos.org",
    copy: "Paused while the lab reworks what Coconut is. The page behind this door says so itself.",
    external: true,
  },
  {
    // The href points at the Pages host until the learn.coconutos.org CNAME
    // resolves. The reader gets a name, not a deploy target; swap the href
    // for learn.coconutos.org when it comes up.
    host: "The book under Coconut OS",
    href: "https://coconutos-learn.pages.dev",
    copy: "Nineteen pages from the transistor to the scheduler.",
    external: true,
  },
  {
    host: "coconutlabs.org/live",
    href: "/live",
    copy: "The operations record: a closed ingestion run's gap ledger, and the nightly loop.",
  },
];

const rowClass =
  "focus-ring grid items-baseline gap-x-6 gap-y-1 py-[14px] transition hover:bg-bg-1 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]";

export function SurfacesStrip() {
  return (
    <section className="content-band">
      <div className="content-inner">
        <div className="mb-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">the estate</p>
          <h2 className="mt-3 text-[clamp(1.6rem,3vw,2.4rem)] leading-tight tracking-[-0.03em]">
            One lab, several surfaces
          </h2>
          <p className="mt-3 max-w-[68ch] text-base leading-7 text-ink-1">
            Five doors. Here is what is behind each one.
          </p>
        </div>

        <div className="divide-y divide-[var(--hair)] border-y border-rule">
          {SURFACES.map((s) =>
            s.external ? (
              <a className={rowClass} href={s.href} key={s.host}>
                <SurfaceRow surface={s} />
              </a>
            ) : (
              <Link className={rowClass} href={s.href} key={s.host}>
                <SurfaceRow surface={s} />
              </Link>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

function SurfaceRow({ surface }: { surface: Surface }) {
  return (
    <>
      <p className="font-mono text-[12.5px] leading-6 text-ink-0">
        {surface.host}
        
      </p>
      <p className="max-w-[68ch] text-sm leading-6 text-ink-1">{surface.copy}</p>
    </>
  );
}
