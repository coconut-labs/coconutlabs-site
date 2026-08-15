export type RouteEntry = {
  href: string;
  label: string;
  nav?: boolean;
};

export const ROUTES: RouteEntry[] = [
  { href: "/", label: "Home" },

  // Top nav (primary)
  { href: "/research", label: "Research", nav: true },
  { href: "/library",  label: "Library",  nav: true },
  { href: "/projects", label: "Projects", nav: true },
  { href: "/joinus",   label: "Join us",  nav: true },
  { href: "/about",    label: "About",    nav: true },
  { href: "/contact",  label: "Contact",  nav: true },

  // Hub-internal (URL-stable, not in top nav)
  { href: "/research/[slug]",   label: "Research post" },
  { href: "/projects/kvwarden", label: "KVWarden" },
  { href: "/projects/mlxd",     label: "mlxd" },
  { href: "/projects/gallery",  label: "Hall of demos" },
  { href: "/projects/agentic-mlops", label: "Agentic MLOps atlas" },
  { href: "/projects/silent-data-regression-guardrail", label: "Silent data-regression guardrail" },
  { href: "/projects/point-in-time-correctness", label: "Point-in-time correctness guardrail" },
  { href: "/projects/silent-cache-miss", label: "Silent cache-miss guardrail" },
  { href: "/projects/columnar-scan-bytes-guardrail", label: "Columnar-scan bytes guardrail" },
  { href: "/projects/ingestion-data-contract", label: "Ingestion data-contract guardrail" },
  { href: "/projects/risk-hotpath", label: "Pre-trade risk gate" },
  { href: "/projects/latent-diffusion", label: "Latent diffusion mechanics" },
  { href: "/projects/coconut-os", label: "Coconut OS" },
  { href: "/benchmarks", label: "Benchmarks" },
  { href: "/drawings", label: "Working drawings" },
  { href: "/cadence", label: "The nightly record" },

  // Footer-only
  { href: "/colophon", label: "Colophon" },
];

export const STATIC_ROUTES = ROUTES.map((route) => route.href);

export function routeIndex(pathname: string): { page: number; total: number } {
  const normalized = pathname === "" ? "/" : pathname;
  const index = STATIC_ROUTES.findIndex((route) => route === normalized);
  return {
    page: index === -1 ? STATIC_ROUTES.length + 1 : index + 1,
    total: STATIC_ROUTES.length + 1,
  };
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://coconutlabs.org";
}
