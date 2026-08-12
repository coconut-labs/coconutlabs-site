import fs from "node:fs/promises";
import path from "node:path";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Cadence · Coconut Labs",
  description:
    "The nightly record: what shipped across the lab in the last day, written by the engine from the public record. No hands involved.",
  path: "/cadence",
});

// Digests are written nightly by scripts/cadence-digest.mjs (zero AI,
// template over the public GitHub record). This page just reads the
// directory; publishing a day means committing a file.
type Digest = { day: string; title: string; body: string };

async function loadDigests(): Promise<Digest[]> {
  const dir = path.join(process.cwd(), "content", "cadence");
  let files: string[] = [];
  try {
    files = (await fs.readdir(dir)).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
  const out: Digest[] = [];
  for (const f of files) {
    const raw = await fs.readFile(path.join(dir, f), "utf8");
    const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
    const front = m?.[1] ?? "";
    const title = front.match(/title:\s*"?([^"\n]+)"?/)?.[1] ?? f;
    const day = front.match(/date:\s*"?([^"\n]+)"?/)?.[1] ?? f.replace(".md", "");
    out.push({ day, title, body: raw.slice(m?.[0].length ?? 0).trim() });
  }
  return out.sort((a, b) => (a.day < b.day ? 1 : -1));
}

function renderBody(body: string) {
  // Tiny deterministic renderer for the digest's known shape:
  // paragraphs, ### headings, - bullets, *italic* footer.
  const blocks = body.split(/\n\n+/);
  return blocks.map((block, i) => {
    if (block.startsWith("### ")) {
      return (
        <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2" key={i}>
          {block.slice(4)}
        </h3>
      );
    }
    if (block.startsWith("- ")) {
      return (
        <ul className="mt-2 space-y-1.5" key={i}>
          {block.split("\n").map((line, j) => (
            <li className="font-mono text-[13px] leading-6 text-ink-1" key={j}>
              {line.replace(/^- /, "")}
            </li>
          ))}
        </ul>
      );
    }
    if (block.startsWith("*") && block.endsWith("*")) {
      return (
        <p className="mt-6 border-t border-[var(--hair)] pt-3 font-mono text-[10.5px] text-ink-2" key={i}>
          {block.replaceAll("*", "")}
        </p>
      );
    }
    return (
      <p className="mt-3 text-sm leading-6 text-ink-1" key={i}>
        {block}
      </p>
    );
  });
}

export default async function CadencePage() {
  const digests = await loadDigests();
  return (
    <section className="content-band">
      <div className="content-inner">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">steady cadence</p>
        <h1 className="mt-3 text-[clamp(30px,4vw,46px)] leading-[1.05] tracking-[-0.03em]">The nightly record</h1>
        <p className="mt-6 max-w-[68ch] text-base leading-7 text-ink-1">
          Every night an engine reads the lab&rsquo;s public record and writes down what moved:
          commits, releases, new content. No hands involved, no model involved, no quiet-day
          filler. The weekly letter is assembled from these entries.
        </p>

        {digests.length === 0 ? (
          <p className="mt-12 font-mono text-sm text-ink-2">
            The engine starts tonight. First entry lands after the first active day.
          </p>
        ) : (
          <div className="mt-12 space-y-8">
            {digests.map((d) => (
              <article className="rounded-sm border border-rule bg-bg-1 p-6" key={d.day}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-[19px] font-semibold tracking-[-0.01em]">{d.title}</h2>
                  <p className="font-mono text-[11px] text-ink-2">{d.day}</p>
                </div>
                {renderBody(d.body)}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
