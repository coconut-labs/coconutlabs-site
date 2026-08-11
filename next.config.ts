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
    optimizePackageImports: ["motion"],
  },
  async redirects() {
    return [
      { source: "/work",          destination: "/projects#tools",          permanent: true },
      { source: "/papers",        destination: "/research?type=papers",    permanent: true },
      { source: "/podcasts",      destination: "/research?type=podcasts",  permanent: true },
      { source: "/projects/weft", destination: "/projects/mlxd",           permanent: true },
      // coconutos.org is the standalone Coconut OS landing; these catch
      // on-site guesses at it.
      { source: "/coconut-os",         destination: "/projects/coconut-os", permanent: true },
      { source: "/coconutos",          destination: "/projects/coconut-os", permanent: true },
      { source: "/projects/coconutos", destination: "/projects/coconut-os", permanent: true },
      // Umbrella affordances: memorable paths on the main domain that hand
      // off to the gated library and the masterclass subdomains.
      { source: "/waterline",     destination: "https://waterline.coconutlabs.org",   permanent: false },
      { source: "/library/enter", destination: "https://library.coconutlabs.org",     permanent: false },
      { source: "/masterclass",   destination: "https://masterclass.coconutlabs.org", permanent: false },
    ];
  },
};

export default withBundleAnalyzer(withMDX(nextConfig));
