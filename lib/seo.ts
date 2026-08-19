import type { Metadata } from "next";
import { siteUrl } from "@/lib/routes";

export type MetadataInput = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
};

export function buildMetadata({
  title,
  description,
  path = "/",
  image = "/api/og",
  type = "website",
}: MetadataInput): Metadata {
  const url = new URL(path, siteUrl());
  const imageUrl = image.startsWith("http") ? image : new URL(image, siteUrl()).toString();

  return {
    title,
    description,
    alternates: {
      canonical: url.toString(),
    },
    openGraph: {
      title,
      description,
      url: url.toString(),
      siteName: "Coconut Labs",
      images: [{ url: imageUrl, width: 1200, height: 630 }],
      type,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export type ScholarlyArticleInput = {
  title: string;
  description: string;
  slug: string;
  date: string;
  authors: string[];
  doi?: string;
};

export function scholarlyArticleJsonLd(input: ScholarlyArticleInput): Record<string, unknown> {
  const url = new URL(`/evidence/${input.slug}`, siteUrl()).toString();

  return {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: input.title,
    description: input.description,
    datePublished: input.date,
    author: input.authors.map((name) => ({ "@type": "Person", name })),
    publisher: {
      "@type": "Organization",
      name: "Coconut Labs",
      url: siteUrl(),
    },
    mainEntityOfPage: url,
    url,
    ...(input.doi ? { identifier: input.doi } : {}),
  };
}
