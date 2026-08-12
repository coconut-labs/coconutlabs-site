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
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
  async redirects() {
    return [
      { source: "/work",          destination: "/projects#tools",          permanent: true },
      { source: "/papers",        destination: "/research?type=papers",    permanent: true },
      { source: "/podcasts",      destination: "/research?type=podcasts",  permanent: true },
      { source: "/projects/weft", destination: "/projects/mlxd",           permanent: true },
      // Umbrella affordances: memorable paths on the main domain that hand
      // off to the gated library and the masterclass subdomains.
      { source: "/waterline",     destination: "https://waterline.coconutlabs.org",   permanent: false },
      { source: "/library/enter", destination: "https://library.coconutlabs.org",     permanent: false },
      { source: "/masterclass",   destination: "https://masterclass.coconutlabs.org", permanent: false },
      // Steady Cadence: the signup lives in the footer band on every page,
      // anchored at #cadence. Non-permanent in case the letter ever gets a
      // page of its own.
      // /newsletter -> the signup band; /cadence is a real page (the nightly
      // record) and must NOT be redirected — two agents built these in
      // parallel and the redirect would have shadowed the route.
      { source: "/newsletter",    destination: "/#cadence",  permanent: false },
    ];
  },
};

export default withBundleAnalyzer(withMDX(nextConfig));
