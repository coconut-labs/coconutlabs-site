import bundleAnalyzer from "@next/bundle-analyzer";
import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "wrap",
          properties: {
            className: ["anchor-heading"],
          },
        },
      ],
    ],
  },
});

const nextConfig: NextConfig = {
  /* /live is a Cloudflare Worker (the operations surface: uptime, gap
     ledger, the nightly loop). The coconutlabs.org zone is DNS-only and
     Vercel serves it, so a Worker route would never fire; a rewrite is the
     correct mount. Both entries are required: the bare /live silently
     drops the index otherwise. */
  async rewrites() {
    return [
      { source: "/live", destination: "https://coconutlabs-live.shrey77-wrk.workers.dev/live" },
      { source: "/live/:path*", destination: "https://coconutlabs-live.shrey77-wrk.workers.dev/live/:path*" },
    ];
  },

  pageExtensions: ["ts", "tsx", "md", "mdx"],
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
  /* Order matters: Next takes the first match. The two moved essays must sit
     above /research/:slug or the wildcard swallows them. */
  async redirects() {
    return [
      { source: "/work",          destination: "/projects#tools",          permanent: true },
      // /joinus is retired. It advertised hiring, and there is no hiring:
      // this is one engineer. Contact still takes anything real.
      { source: "/joinus",        destination: "/contact",                 permanent: true },
      { source: "/projects/weft", destination: "/projects/mlxd",           permanent: true },

      /* The rename. /research was pretending to be four things (notes,
         papers, podcasts, talks) and three of them were empty arrays, so the
         section is now /evidence and carries one kind of thing.
         /papers and /podcasts were already permanent:true pointing at the two
         empty filter views, which browsers have cached; they are repointed at
         the source rather than chained through /research. */
      { source: "/papers",        destination: "/evidence",                permanent: true },
      { source: "/podcasts",      destination: "/evidence",                permanent: true },
      { source: "/notes",         destination: "/evidence",                permanent: true },
      { source: "/research",      destination: "/evidence",                permanent: true },
      { source: "/benchmarks",    destination: "/evidence/benchmarks",     permanent: true },

      /* Two pieces left the lab. They are essays: first person, craft, no
         bench, and the personal site already carried the longer version.
         The lab is no longer their home, so these cross-domain 301s are
         intentional and the personal site is now canonical for both. */
      {
        source: "/research/a-model-in-the-room",
        destination: "/evidence/a-model-in-the-room",
        permanent: true,
      },
      {
        source: "/research/mixing-and-evals",
        destination: "/evidence/mixing-and-evals",
        permanent: true,
      },
      { source: "/research/:slug", destination: "/evidence/:slug",         permanent: true },

      /* /library the page collided by name with library.coconutlabs.org the
         host, and described two wings of a four-wing shelf. The surviving
         paragraph lives on /about under the-library anchor. */
      /* library.coconutlabs.org's origin (a tunnel to lab hardware) was
         retired 2026-08-22, so the enter door lands on the explanation. */
      { source: "/library/enter", destination: "/about#the-library",       permanent: false },
      { source: "/library",       destination: "/about#the-library",       permanent: true },

      // Memorable doors: short paths on the main domain that hand off to the
      // surfaces that live on their own hosts. The waterline host died with
      // the same tunnel; both atlas doors land on the in-house atlas.
      { source: "/atlas",         destination: "/projects/agentic-mlops",  permanent: false },
      { source: "/waterline",     destination: "/projects/agentic-mlops",  permanent: false },
      { source: "/masterclass",   destination: "https://masterclass.coconutlabs.org", permanent: false },
      // Swap this to https://learn.coconutos.org when the CNAME resolves. It
      // does not today, so the door points at the Pages host that serves it.
      { source: "/learn",         destination: "https://coconutos-learn.pages.dev",   permanent: false },

      // Steady Cadence: the signup lives in the footer band on every page,
      // anchored at #cadence. Non-permanent in case the letter ever gets a
      // page of its own.
      // /newsletter -> the signup band; /cadence is a real page (the nightly
      // record) and must NOT be redirected: two agents built these in
      // parallel and the redirect would have shadowed the route.
      { source: "/newsletter",    destination: "/#cadence",  permanent: false },
    ];
  },
};

export default withBundleAnalyzer(withMDX(nextConfig));
