/* One source for both navs.
   Header.tsx and Footer.tsx render NAV_COLUMNS and nothing else, in this
   order. Two rules, and the drift that made them necessary:

   1. Nav carries sections, never instances. The header and the footer each
      used to hardcode three article titles, so every new piece silently rotted
      both navs and the two lists disagreed within a week.
   2. Header and footer carry identical columns in identical order. /benchmarks
      was header-LAB and footer-WORK; /cadence was header-LAB and footer-WRITING.
      Same item, two columns, two navs.

   Adding a destination means adding it here once. If you find yourself
   editing a column inside a component, you are reintroducing the defect. */

export type NavLink = {
  label: string;
  href: string;
  /** Render a plain anchor instead of next/link (no prefetch, no client nav). */
  plain?: boolean;
  /** Off-domain. Appends the ↗ glyph and implies plain. */
  external?: boolean;
};

export type NavColumn = {
  label: string;
  links: NavLink[];
};

export const NAV_COLUMNS: NavColumn[] = [
  {
    label: "WORK",
    links: [
      { label: "Projects", href: "/projects" },
      { label: "Hall of demos", href: "/projects/gallery" },
      { label: "KVWarden", href: "/projects/kvwarden" },
      { label: "mlxd", href: "/projects/mlxd" },
      { label: "Coconut OS", href: "/projects/coconut-os" },
    ],
  },
  {
    label: "EVIDENCE",
    links: [
      { label: "All evidence", href: "/evidence" },
      { label: "Benchmarks", href: "/evidence/benchmarks" },
      { label: "The nightly record", href: "/cadence" },
      // /live is a rewrite onto the operations Worker, so it gets a plain
      // anchor: next/link would prefetch an RSC payload the Worker cannot serve.
      { label: "Live status", href: "/live", plain: true },
    ],
  },
  {
    label: "LEARN",
    links: [
      { label: "Below the Waterline", href: "https://waterline.coconutlabs.org", external: true },
      { label: "Masterclass", href: "https://masterclass.coconutlabs.org", external: true },
      // learn.coconutos.org does not resolve yet. Point at the Pages host that
      // does and swap both this href and the rail entry when the CNAME lands.
      { label: "The low-level book", href: "https://coconutos-learn.pages.dev", external: true },
      { label: "The Library, private", href: "https://library.coconutlabs.org", external: true },
    ],
  },
  {
    label: "LAB",
    links: [
      { label: "About", href: "/about" },
      { label: "Join us", href: "/joinus" },
      { label: "Working drawings", href: "/drawings" },
      { label: "Colophon", href: "/colophon" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

/** The footer rail: every hostname in the estate, in one mono line. */
export const HOSTNAME_RAIL: { label: string; href: string }[] = [
  { label: "coconutlabs.org", href: "/" },
  { label: "kvwarden.org", href: "https://kvwarden.org" },
  { label: "coconutos.org", href: "https://coconutos.org" },
  { label: "coconutos-learn.pages.dev", href: "https://coconutos-learn.pages.dev" },
  { label: "masterclass.coconutlabs.org", href: "https://masterclass.coconutlabs.org" },
  { label: "waterline.coconutlabs.org", href: "https://waterline.coconutlabs.org" },
  { label: "library.coconutlabs.org", href: "https://library.coconutlabs.org" },
];
