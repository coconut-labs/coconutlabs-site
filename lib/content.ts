import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, "content");

export type Frontmatter = {
  title: string;
  dek: string;
  date: string;
  type: string;
  authors: string[];
  slug: string;
  status?: "draft" | "published";
  doi?: string;
  externalUrl?: string;
};

export type Post = Frontmatter & {
  content: string;
  readingTime: string;
};

export type WorkEntry = {
  name: string;
  description: string;
  language: string;
  repo_url: string;
  last_updated: string;
  stars?: number;
  status?: "live" | "research" | "archived";
};

export type ListEntry = {
  title: string;
  dek: string;
  date: string;
  type: string;
  authors?: string[];
  href?: string;
};

export type ProjectStatus = "live" | "research" | "archived";

export type Project = {
  slug: string;
  name: string;
  tagline: string;
  status: ProjectStatus;
  result: string;
  outbound: string;
  probeWindow?: string;
  content: string;
};

export type Person = {
  slug: string;
  name: string;
  role: string;
  bio: string;
  image?: string;
  links: Array<{ label: string; href: string }>;
};

export type Principle = {
  title: string;
  body: string;
};

function assertString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Expected ${field} to be a non-empty string`);
  }
  return value;
}

function assertStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Expected ${field} to be a string array`);
  }
  return value;
}

async function readFile(relativePath: string): Promise<string> {
  return fs.readFile(path.join(ROOT, relativePath), "utf8");
}

async function readJson<T>(relativePath: string): Promise<T> {
  const raw = await readFile(relativePath);
  return JSON.parse(raw) as T;
}

async function publicAssetExists(src: string | undefined): Promise<boolean> {
  if (!src?.startsWith("/")) {
    return false;
  }

  try {
    await fs.access(path.join(ROOT, "public", src));
    return true;
  } catch {
    return false;
  }
}

function readingTime(content: string): string {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 220));
  return `${minutes} min read`;
}

export function parseFrontmatter(raw: string, fallbackSlug: string): Post {
  const parsed = matter(raw);
  const data = parsed.data;
  const title = assertString(data.title, "title");
  const dek = assertString(data.dek, "dek");
  const date = assertString(data.date, "date");
  const type = assertString(data.type, "type");
  const authors = assertStringArray(data.authors, "authors");
  const slug = typeof data.slug === "string" ? data.slug : fallbackSlug;

  return {
    title,
    dek,
    date,
    type,
    authors,
    slug,
    status: data.status === "draft" ? "draft" : "published",
    doi: typeof data.doi === "string" ? data.doi : undefined,
    externalUrl: typeof data.externalUrl === "string" ? data.externalUrl : undefined,
    content: parsed.content.trim(),
    readingTime: readingTime(parsed.content),
  };
}

export async function getAllPosts(options: { includeDrafts?: boolean } = {}): Promise<Post[]> {
  const directory = path.join(CONTENT, "research");
  const files = await fs.readdir(directory, { recursive: true });
  const posts = await Promise.all(
    files
      .filter((file) => typeof file === "string" && file.endsWith(".mdx") && !file.includes("_placeholder"))
      .map(async (file) => {
        const slug = path.basename(file, ".mdx").replace(/^\d{4}-\d{2}-\d{2}-/, "");
        return parseFrontmatter(await fs.readFile(path.join(directory, file), "utf8"), slug);
      }),
  );

  return posts
    .filter((post) => options.includeDrafts || post.status !== "draft")
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const posts = await getAllPosts({ includeDrafts: true });
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function loadWork(): Promise<WorkEntry[]> {
  const data = await readJson<WorkEntry[]>("content/work/work.json");
  return data.map((entry) => ({
    name: assertString(entry.name, "work.name"),
    description: assertString(entry.description, "work.description"),
    language: assertString(entry.language, "work.language"),
    repo_url: assertString(entry.repo_url, "work.repo_url"),
    last_updated: assertString(entry.last_updated, "work.last_updated"),
    stars: typeof entry.stars === "number" ? entry.stars : undefined,
    status: entry.status ?? "live",
  }));
}

export async function loadPapers(): Promise<ListEntry[]> {
  return readJson<ListEntry[]>("content/papers/papers.json");
}

export async function loadPodcasts(): Promise<ListEntry[]> {
  return readJson<ListEntry[]>("content/podcasts/podcasts.json");
}

export async function loadProject(slug: "kvwarden" | "mlxd" | "coconut-os"): Promise<Project> {
  const raw = await readFile(`content/projects/${slug}.mdx`);
  const parsed = matter(raw);
  const status = parsed.data.status;

  if (status !== "live" && status !== "research" && status !== "archived") {
    throw new Error(`Invalid project status for ${slug}`);
  }

  return {
    slug,
    name: assertString(parsed.data.name, "project.name"),
    tagline: assertString(parsed.data.tagline, "project.tagline"),
    status,
    result: assertString(parsed.data.result, "project.result"),
    outbound: assertString(parsed.data.outbound, "project.outbound"),
    probeWindow: typeof parsed.data.probeWindow === "string" ? parsed.data.probeWindow : undefined,
    content: parsed.content.trim(),
  };
}

export async function loadManifesto(): Promise<string> {
  const raw = await readFile("content/about/manifesto.mdx");
  return matter(raw).content.trim();
}

export async function loadPrinciples(): Promise<Principle[]> {
  const raw = await readFile("content/about/how-we-work.mdx");
  const parsed = matter(raw);
  const principles = parsed.data.principles;
  if (!Array.isArray(principles)) {
    throw new Error("Expected principles array");
  }
  return principles.map((principle) => ({
    title: assertString(principle.title, "principle.title"),
    body: assertString(principle.body, "principle.body"),
  }));
}

export type PersonSlug = "shrey-patel" | "jay-patel";

export async function loadPerson(slug: PersonSlug): Promise<Person> {
  const raw = await readFile(`content/people/${slug}.mdx`);
  const parsed = matter(raw);
  const links = parsed.data.socials ?? parsed.data.links;
  if (!Array.isArray(links)) {
    throw new Error("Expected person links array");
  }

  const requestedImage = typeof parsed.data.photo === "string"
    ? parsed.data.photo
    : typeof parsed.data.image === "string"
      ? parsed.data.image
      : undefined;
  const fallbackImage = slug === "jay-patel"
    ? "/images/jay-patel-placeholder.svg"
    : "/images/shrey-patel-placeholder.svg";
  const image = (await publicAssetExists(requestedImage)) ? requestedImage : fallbackImage;

  return {
    slug,
    name: assertString(parsed.data.name, "person.name"),
    role: assertString(parsed.data.role, "person.role"),
    bio: typeof parsed.data.bio === "string" ? parsed.data.bio : parsed.content.trim(),
    image,
    links: links.map((link) => ({
      label: assertString(link.label, "person.link.label"),
      href: assertString(link.href, "person.link.href"),
    })),
  };
}

export async function loadPeople(): Promise<Person[]> {
  return Promise.all([loadPerson("shrey-patel"), loadPerson("jay-patel")]);
}

export type FeedType = "note" | "paper" | "podcast" | "talk";

export type FeedEntry = {
  slug: string;
  date: string;          // YYYY-MM-DD
  type: FeedType;
  title: string;
  dek: string;
  authors: string[];
  href: string;          // canonical link to the artifact
};

/** Returns the slug of the most recent published post, used for build-time CTA resolution. */
export async function getLatestPostSlug(): Promise<string> {
  const posts = await getAllPosts();
  return posts[0]?.slug ?? "tenant-fairness-on-shared-inference";
}

function listEntryToFeed(entry: ListEntry, type: FeedType): FeedEntry {
  const slug = entry.title.toLowerCase().replace(/\s+/g, "-");
  return {
    slug,
    date: entry.date,
    type,
    title: entry.title,
    dek: entry.dek,
    authors: entry.authors ?? [],
    href: entry.href ?? "#",
  };
}

/** Combined chronological feed of research notes + papers + podcasts. Newest first. */
export async function loadResearchFeed(): Promise<FeedEntry[]> {
  const [posts, papers, podcasts] = await Promise.all([
    getAllPosts(),
    loadPapers(),
    loadPodcasts(),
  ]);

  const entries: FeedEntry[] = [
    ...posts.map<FeedEntry>((p) => ({
      slug: p.slug,
      date: p.date,
      type: "note",
      title: p.title,
      dek: p.dek,
      authors: p.authors,
      href: `/research/${p.slug}`,
    })),
    ...papers.map((p) => listEntryToFeed(p, "paper")),
    ...podcasts.map((p) => listEntryToFeed(p, "podcast")),
  ];

  return entries.sort((a, b) => (a.date < b.date ? 1 : -1));
}
