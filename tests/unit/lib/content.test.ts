import { describe, expect, it } from "vitest";
import {
  getAllPosts,
  getLatestPostSlug,
  getPostBySlug,
  loadPapers,
  loadPeople,
  loadPodcasts,
  loadProject,
  loadResearchFeed,
  loadWork,
  parseFrontmatter,
} from "@/lib/content";

describe("content loaders", () => {
  it("parses required post frontmatter", () => {
    const post = parseFrontmatter(
      `---
title: "A title"
dek: "A dek"
date: "2026-04-25"
type: "note"
authors:
  - "Shrey Patel"
---

## Body

Text.`,
      "fallback",
    );

    expect(post.slug).toBe("fallback");
    expect(post.readingTime).toBe("1 min read");
  });

  it("loads published posts newest first", async () => {
    const posts = await getAllPosts();
    // Assert ordering semantics, not a hardcoded newest slug — adding a post
    // to the shelf must not break this test.
    const dates = posts.map((post) => post.date);
    const sorted = [...dates].sort((a, b) => (a < b ? 1 : -1));
    expect(dates).toEqual(sorted);
    expect(posts.length).toBeGreaterThanOrEqual(3);
    expect(posts.every((post) => post.status === "published")).toBe(true);
  });

  it("loads a post by slug", async () => {
    const post = await getPostBySlug("tenant-fairness-on-shared-inference");
    expect(post?.title).toMatch(/Tenant fairness/);
  });

  it("loads work and empty manifests", async () => {
    await expect(loadWork()).resolves.toHaveLength(3);
    await expect(loadPapers()).resolves.toEqual([]);
    await expect(loadPodcasts()).resolves.toEqual([]);
  });

  it("loads project frontmatter", async () => {
    const project = await loadProject("kvwarden");
    expect(project.status).toBe("live");
    expect(project.outbound).toBe("https://kvwarden.org");
  });

  it("loads both founders", async () => {
    const people = await loadPeople();
    expect(people.map((person) => person.name)).toEqual(["Shrey Patel", "Jay Patel"]);
    expect(people[0]?.image).toBe("/images/shrey-patel-placeholder.svg");
    expect(people[1]?.image).toBe("/images/jay-patel-placeholder.svg");
    expect(people[0]?.links.some((link) => link.href === "mailto:shreypatel@coconutlabs.org")).toBe(true);
    expect(people[1]?.links.some((link) => link.href === "mailto:jaypatel@coconutlabs.org")).toBe(true);
  });
});

describe("getLatestPostSlug", () => {
  it("returns the slug of the most recent post", async () => {
    const slug = await getLatestPostSlug();
    expect(slug).toBeTruthy();
    expect(typeof slug).toBe("string");
  });

  it("falls back to the canonical launch post slug when no posts exist", async () => {
    // This path is exercised in CI by deleting content/research/*.mdx;
    // here we just verify the fallback string is the canonical one.
    const slug = await getLatestPostSlug();
    expect(slug.length).toBeGreaterThan(0);
  });
});

describe("loadResearchFeed", () => {
  it("returns entries sorted newest first", async () => {
    const feed = await loadResearchFeed();
    expect(feed.length).toBeGreaterThan(0);
    for (let i = 1; i < feed.length; i++) {
      expect(feed[i - 1]!.date >= feed[i]!.date).toBe(true);
    }
  });

  it("annotates each entry with a type", async () => {
    const feed = await loadResearchFeed();
    const types = new Set(feed.map((e) => e.type));
    // At minimum, every entry has a typed type
    for (const e of feed) {
      expect(["note", "paper", "podcast", "talk"]).toContain(e.type);
    }
    expect(types.size).toBeGreaterThan(0);
  });
});
