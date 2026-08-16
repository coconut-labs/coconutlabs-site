import React from "react";

type MarkdownBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; lang: string; code: string }
  | { type: "table"; head: string[]; rows: string[][] };

function inline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let cursor = 0;

  for (const match of text.matchAll(pattern)) {
    const value = match[0];
    const index = match.index ?? 0;
    if (index > cursor) {
      nodes.push(text.slice(cursor, index));
    }

    if (value.startsWith("**")) {
      nodes.push(<strong key={`${index}-strong`}>{value.slice(2, -2)}</strong>);
    } else if (value.startsWith("`")) {
      nodes.push(<code key={`${index}-code`}>{value.slice(1, -1)}</code>);
    } else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(value);
      if (link) {
        nodes.push(
          <a key={`${index}-link`} href={link[2]}>
            {link[1]}
          </a>,
        );
      }
    }

    cursor = index + value.length;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
}

export function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let code: string[] | null = null;
  let codeLang = "";

  function flushParagraph(): void {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ").trim() });
      paragraph = [];
    }
  }

  function flushList(): void {
    if (list.length > 0) {
      blocks.push({ type: "list", items: list });
      list = [];
    }
  }

  /* GFM pipe tables. The research notes are rendered by this parser, not by
     the MDX pipeline, so remark-gfm never sees them: a table used to fall
     through to the paragraph branch and ship as literal pipes. Cells are
     split on unescaped pipes and the outer pair is dropped. */
  function tableCells(line: string): string[] {
    return line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split(/(?<!\\)\|/)
      .map((cell) => cell.trim().replace(/\\\|/g, "|"));
  }

  function isTableDivider(line: string): boolean {
    return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/.test(line.trim());
  }

  for (let li = 0; li < lines.length; li++) {
    const rawLine = lines[li] ?? "";
    const line = rawLine.trimEnd();

    // a header row followed by a divider row opens a table
    if (!code && line.trim().startsWith("|") && isTableDivider(lines[li + 1] ?? "")) {
      flushParagraph();
      flushList();
      const head = tableCells(line);
      const rows: string[][] = [];
      li += 2;
      while (li < lines.length && (lines[li] ?? "").trim().startsWith("|")) {
        rows.push(tableCells(lines[li] ?? ""));
        li += 1;
      }
      li -= 1;
      blocks.push({ type: "table", head, rows });
      continue;
    }

    if (line.startsWith("```")) {
      if (code) {
        blocks.push({ type: "code", lang: codeLang, code: code.join("\n") });
        code = null;
        codeLang = "";
      } else {
        flushParagraph();
        flushList();
        code = [];
        codeLang = line.slice(3).trim();
      }
      continue;
    }

    if (code) {
      code.push(rawLine);
      continue;
    }

    if (line.trim() === "" || line.trim() === "---") {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", level: 2, text: line.slice(3).trim() });
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", level: 3, text: line.slice(4).trim() });
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "quote", text: line.slice(2).trim() });
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      list.push(line.slice(2).trim());
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  return blocks;
}

export function Markdown({ content }: { content: string }): React.ReactElement {
  const blocks = parseMarkdown(content);

  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const Heading = `h${block.level}` as "h2" | "h3";
          return <Heading key={index}>{block.text}</Heading>;
        }

        if (block.type === "quote") {
          return <blockquote key={index}>{inline(block.text)}</blockquote>;
        }

        if (block.type === "list") {
          return (
            <ul key={index}>
              {block.items.map((item) => (
                <li key={item}>{inline(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "table") {
          return (
            <div className="post-table-wrap" key={index}>
              <table>
                <thead>
                  <tr>
                    {block.head.map((cell, i) => (
                      <th key={i}>{inline(cell)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td key={c}>{inline(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === "code") {
          return (
            <pre key={index}>
              <code data-lang={block.lang}>{block.code}</code>
            </pre>
          );
        }

        return <p key={index}>{inline(block.text)}</p>;
      })}
    </>
  );
}
