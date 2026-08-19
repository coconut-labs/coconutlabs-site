import Link from "next/link";

/* The estate map on the home page. Eight hairline rows, not cards and not a
   grid: mono hostname left, one real sentence in the middle, a mono status
   word right. Eight rows carrying sentences is a map; eight rows carrying
   bare hostnames is a link dump. The status column does the grouping, so
   the rows are not banded into categories.

   Row order is deliberate and not alphabetical: the two surfaces with a
   measured claim behind them lead, teaching surfaces follow, the operations
   readout and the gated shelf close. */

type Surface = {
  host: string;
  href: string;
  copy: string;
  status: "LIVE" | "NEW" | "GATED";
  /** Off-domain: rendered as a plain anchor with the ↗ glyph. */
  external?: boolean;
};

const SURFACES: Surface[] = [
  {
    host: "kvwarden.org",
    href: "https://kvwarden.org",
    copy: "The scheduler that keeps a quiet tenant quiet. v0.1.6 on PyPI, harness public.",
    status: "LIVE",
    external: true,
  },
  {
    host: "waterline.coconutlabs.org",
    href: "https://waterline.coconutlabs.org",
    copy: "Below the Waterline. Six systems taken apart, business problem down to the metal.",
    status: "NEW",
    external: true,
  },
  {
    host: "masterclass.coconutlabs.org",
    href: "https://masterclass.coconutlabs.org",
    copy: "Five chapters on forward-deployed engineering, start to finish.",
    status: "LIVE",
    external: true,
  },
  {
    host: "coconutos.org",
    href: "https://coconutos.org",
    copy: "An operating system where an agent is a first-class citizen. Five specs, all public.",
    status: "LIVE",
    external: true,
  },
  {
    // Display and href both point at the Pages host until the
    // learn.coconutos.org CNAME resolves. Swap both together.
    host: "coconutos-learn.pages.dev",
    href: "https://coconutos-learn.pages.dev",
    copy: "Nineteen pages from the transistor to the scheduler. The book under Coconut OS.",
    status: "LIVE",
    external: true,
  },
  {
    host: "shreypatel.coconutlabs.org",
    href: "https://shreypatel.coconutlabs.org/essays",
    copy: "Shrey's essays. Fifteen pieces on data systems, AI craft, and learning one level down.",
    status: "LIVE",
    external: true,
  },
  {
    host: "coconutlabs.org/live",
    href: "/live",
    copy: "Uptime, the gap ledger, and what the nightly loop did last night.",
    status: "LIVE",
  },
  {
    host: "library.coconutlabs.org",
    href: "https://library.coconutlabs.org",
    copy: "The private study shelf. Two of us have keys, and that is the point.",
    status: "GATED",
    external: true,
  },
];

const rowClass =
  "focus-ring grid items-baseline gap-x-6 gap-y-1 py-[14px] transition hover:bg-bg-1 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)_4.5rem]";

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
            Eight doors. Here is what is behind each one.
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
        {surface.external ? <span aria-hidden="true"> ↗</span> : null}
      </p>
      <p className="max-w-[68ch] text-sm leading-6 text-ink-1">{surface.copy}</p>
      <p
        className={`font-mono text-[10.5px] uppercase tracking-[0.1em] md:text-right ${
          surface.status === "GATED" ? "text-ink-2" : "text-success"
        }`}
      >
        {surface.status}
      </p>
    </>
  );
}
