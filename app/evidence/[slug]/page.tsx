import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostBody } from "@/components/post/PostBody";
import { PostHeader } from "@/components/post/PostHeader";
import { ProgressBar } from "@/components/post/ProgressBar";
import { ShareRow } from "@/components/post/ShareRow";
import { getAllPosts, getPostBySlug } from "@/lib/content";
import { buildMetadata, scholarlyArticleJsonLd } from "@/lib/seo";

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return {};
  }
  return buildMetadata({
    title: `${post.title} · Coconut Labs`,
    description: post.dek,
    path: `/evidence/${post.slug}`,
    image: `/api/og?title=${encodeURIComponent(post.title)}`,
    type: "article",
  });
}

export default async function ResearchPostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.status === "draft") {
    notFound();
  }

  const jsonLd = scholarlyArticleJsonLd({
    title: post.title,
    description: post.dek,
    slug: post.slug,
    date: post.date,
    authors: post.authors,
    doi: post.doi,
  });

  return (
    <>
      <ProgressBar />
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
      <PostHeader post={post} />
      <PostBody content={post.content} />
      <ShareRow doi={post.doi} title={post.title} />
    </>
  );
}
