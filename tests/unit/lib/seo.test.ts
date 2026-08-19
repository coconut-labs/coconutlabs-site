import { describe, expect, it } from "vitest";
import { buildMetadata, scholarlyArticleJsonLd } from "@/lib/seo";

describe("seo helpers", () => {
  it("builds canonical metadata", () => {
    const metadata = buildMetadata({
      title: "Evidence · Coconut Labs",
      description: "Measured results.",
      path: "/evidence",
    });
    expect(metadata.alternates?.canonical).toBe("https://coconutlabs.org/evidence");
  });

  it("builds ScholarlyArticle JSON-LD", () => {
    const json = scholarlyArticleJsonLd({
      title: "A result",
      description: "A dek",
      slug: "a-result",
      date: "2026-04-25",
      authors: ["Shrey Patel"],
    });
    expect(json["@type"]).toBe("ScholarlyArticle");
    expect(json.mainEntityOfPage).toBe("https://coconutlabs.org/evidence/a-result");
  });
});
