#!/usr/bin/env node
/**
 * design-lint — mechanical enforcement of the locked design system (v1.0).
 * Fails (exit 1) on violations; prints file:line for each. Fast, no deps.
 *
 * Rules:
 *  1. No raw hex colors in app/ components/ (tokens.css owns color; the
 *     #0C0C0E / #14161B dark-plate values and #82828E plate-caption are the
 *     documented exceptions).
 *  2. No em dashes in user-facing strings (mdx prose + JSX text). Code
 *     comments exempt.
 *  3. No icon-library imports (lucide, react-icons, heroicons, tabler).
 *  4. No border-radius px literals other than the tokens file (use --rad or
 *     Tailwind rounded-* which resolve to it); rounded-full allowed only in
 *     files that draw genuine circles (status dots).
 *  5. No retired warm-paper values anywhere.
 *  6. No font-family literals outside tokens.css / next-font setup.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["app", "components", "content", "styles"];
// Dark-plate values, plus literals that ARE current token values (viewport
// themeColor and OG rendering cannot read CSS custom properties).
const PLATE_OK = new Set([
  "#0C0C0E", "#14161B", "#82828E", "#0c0c0e", "#14161b", "#82828e",
  "#F7F7F5", "#f7f7f5", "#FFFFFF", "#ffffff", "#F0F0EA", "#f0f0ea",
  "#0B0B0C", "#0b0b0c", "#2440CC", "#2440cc", "#7D93FF", "#7d93ff",
]);
const RETIRED = /#(ECE6D6|F7F3E8|DED5C2|D4D9C6|9B6B1F|C8BFAB|E7DECA|FBF7EC|F4EEDF|1A1611)/i;
const ICON_LIBS = /from\s+["'](lucide-react|react-icons|@heroicons|@tabler)/;
const FONT_LITERAL = /font-family:\s*["'](?!var\()/;

const failures = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (["node_modules", ".next", "test-results"].includes(name)) continue;
      walk(p);
    } else if (/\.(tsx|ts|css|mdx)$/.test(name)) {
      check(p);
    }
  }
}

function check(path) {
  const isTokens = path.endsWith("styles/tokens.css");
  // print.css targets paper, not the screen system; it owns its hexes.
  const isExemptSheet = isTokens || path.endsWith("styles/print.css");
  const isFonts = path.includes("app/fonts") || path.includes("api/og");
  const src = readFileSync(path, "utf8");
  const lines = src.split("\n");
  let inBlock = false; // tracks /* ... */ across lines, incl. CSS comments
  lines.forEach((line, i) => {
    const loc = `${path}:${i + 1}`;
    const trimmed = line.trim();
    const wasInBlock = inBlock;
    if (inBlock && line.includes("*/")) inBlock = false;
    else if (!inBlock && line.includes("/*") && !line.includes("*/")) inBlock = true;
    const isComment = wasInBlock || trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*");

    // 5. retired palette: absolute in code; comments may cite history
    if (RETIRED.test(line) && !isComment) failures.push(`${loc} retired warm-paper value`);

    if (isExemptSheet) return; // tokens.css + print.css own their contents

    // 1. raw hex (allow plate exceptions + og route which inlines by necessity)
    if (!isFonts && /#[0-9A-Fa-f]{6}\b/.test(line) && !isComment) {
      const hexes = line.match(/#[0-9A-Fa-f]{6}\b/g) || [];
      for (const h of hexes) {
        if (!PLATE_OK.has(h)) failures.push(`${loc} raw hex ${h} (use a token)`);
      }
    }
    // 2. em dash in prose (mdx any line; tsx non-comment lines)
    if (line.includes("—") && !isComment) failures.push(`${loc} em dash in prose`);
    // 3. icon libraries
    if (ICON_LIBS.test(line)) failures.push(`${loc} icon-library import`);
    // 4. border-radius literals
    if (/border-radius:\s*\d+px/.test(line) && !/var\(--rad\)/.test(line)) {
      failures.push(`${loc} border-radius literal (use var(--rad))`);
    }
    // 6. font-family literals
    if (!isFonts && FONT_LITERAL.test(line)) failures.push(`${loc} font-family literal (use token)`);
  });
}

for (const r of ROOTS) {
  try { walk(r); } catch { /* root may not exist in some repos */ }
}

/* 7. Figures.
 *
 * Rules 1 and 4 are textual and cannot see a figure: its colors and radii are
 * decided by lib/figures at build time, not written in a source file. So this
 * section runs the real renderer over every shipped spec and lints the output.
 * A figure that cannot state its claim, names a color, invents a radius, or
 * claims two accents fails the build here.
 */
async function lintFigures() {
  let examples;
  let render;
  let spec;
  try {
    examples = await import("../lib/figures/examples.mjs");
    render = await import("../lib/figures/render.mjs");
    spec = await import("../lib/figures/spec.mjs");
  } catch {
    return; // toolkit not present in this checkout
  }

  const specs = examples.CATALOG.map((c) => c.spec);

  // Any .fig.json authored anywhere in the linted roots joins the same gate.
  for (const root of ROOTS) {
    try {
      const stack = [root];
      while (stack.length) {
        const dir = stack.pop();
        for (const name of readdirSync(dir)) {
          const p = join(dir, name);
          const st = statSync(p);
          if (st.isDirectory()) {
            if (["node_modules", ".next", "test-results"].includes(name)) continue;
            stack.push(p);
          } else if (name.endsWith(".fig.json")) {
            specs.push(JSON.parse(readFileSync(p, "utf8")));
          }
        }
      }
    } catch { /* root may not exist */ }
  }

  for (const s of specs) {
    const where = `figure ${s && s.id ? s.id : "(no id)"}`;
    try {
      spec.validateSpec(s);
    } catch (err) {
      failures.push(`${where} ${err.message}`);
      continue;
    }
    const svg = render.renderFigure(s).svg;
    for (const hex of svg.match(/#[0-9A-Fa-f]{3,8}\b/g) || []) {
      failures.push(`${where} renders color literal ${hex} (ink is a named role)`);
    }
    for (const r of svg.match(/\br[xy]="([^"]+)"/g) || []) {
      const value = r.replace(/\br[xy]="|"/g, "");
      if (value !== "0" && value !== "2") {
        failures.push(`${where} renders radius ${value} (use var(--rad), 2px)`);
      }
    }
    if (svg.includes("font-family")) {
      failures.push(`${where} sets a font-family literal (the face is a token in CSS)`);
    }
  }
}

await lintFigures();

if (failures.length) {
  console.error(`design-lint: ${failures.length} violation(s)\n` + failures.join("\n"));
  process.exit(1);
}
console.log("design-lint: clean");
