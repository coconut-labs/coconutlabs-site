import type { ReactNode } from "react";
import { INK, INK_DIM } from "./inks";

/* Shared draughting vocabulary for the three working drawings. Coordinates
 * are viewBox units; each SVG renders at natural size or larger inside a
 * horizontally scrolling plate, so no label ever drops below its set size
 * (10.5px mono floor). SVG text carries the mono face via the font-mono
 * utility, which resolves to the token. */

type TextProps = {
  x: number;
  y: number;
  children: ReactNode;
  fill?: string;
  size?: number;
  anchor?: "start" | "middle" | "end";
  tracking?: string;
};

export function T({ x, y, children, fill = INK, size = 10.5, anchor = "middle", tracking }: TextProps) {
  return (
    <text
      className="font-mono"
      fill={fill}
      fontSize={size}
      letterSpacing={tracking}
      textAnchor={anchor}
      x={x}
      y={y}
    >
      {children}
    </text>
  );
}

/* Arrowhead markers, id-prefixed per drawing so three SVGs can share a page
 * without marker-id collisions. */
export function Defs({ id, accent }: { id: string; accent: string }) {
  const head = "M0,0 L7,3.5 L0,7 Z";
  const common = {
    markerHeight: 7,
    markerWidth: 7,
    orient: "auto",
    refX: 6.5,
    refY: 3.5,
    viewBox: "0 0 8 8",
  } as const;
  return (
    <defs>
      <marker id={`${id}-a-ink`} {...common}>
        <path d={head} fill={INK} />
      </marker>
      <marker id={`${id}-a-dim`} {...common}>
        <path d={head} fill={INK_DIM} />
      </marker>
      <marker id={`${id}-a-accent`} {...common}>
        <path d={head} fill={accent} />
      </marker>
    </defs>
  );
}

type NodeBoxProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  lines?: string[];
  stroke?: string;
};

/* A station on the drawing: 1.25 ink outline, mono title, dim detail lines. */
export function NodeBox({ x, y, w, h, title, lines = [], stroke = INK }: NodeBoxProps) {
  const cx = x + w / 2;
  return (
    <g>
      <rect fill="none" height={h} stroke={stroke} strokeWidth={1.25} width={w} x={x} y={y} />
      <T size={11} tracking="0.08em" x={cx} y={y + 20}>
        {title}
      </T>
      {lines.map((line, i) => (
        <T key={line} fill={INK_DIM} x={cx} y={y + 38 + i * 16}>
          {line}
        </T>
      ))}
    </g>
  );
}

/* The sheet border every working drawing carries. */
export function SheetFrame({ w, h }: { w: number; h: number }) {
  return (
    <rect
      fill="none"
      height={h - 16}
      stroke={INK_DIM}
      strokeOpacity={0.45}
      strokeWidth={1}
      width={w - 16}
      x={8}
      y={8}
    />
  );
}

/* Title block, bottom-right, like a real drawing: title / scale NTS /
 * date / drawn by / rev / sheet. 316 x 66 viewBox units. */
export function TitleBlock({ x, y, title, sheet }: { x: number; y: number; title: string; sheet: string }) {
  const w = 316;
  const h = 66;
  return (
    <g>
      <rect fill="none" height={h} stroke={INK} strokeWidth={1.25} width={w} x={x} y={y} />
      <line stroke={INK_DIM} strokeWidth={1} x1={x} x2={x + w} y1={y + 22} y2={y + 22} />
      <line stroke={INK_DIM} strokeWidth={1} x1={x} x2={x + w} y1={y + 44} y2={y + 44} />
      <T anchor="start" fill={INK_DIM} x={x + 10} y={y + 15}>
        TITLE <tspan fill={INK}>{title}</tspan>
      </T>
      <T anchor="start" fill={INK_DIM} x={x + 10} y={y + 37}>
        SCALE <tspan fill={INK}>NTS</tspan> · DATE <tspan fill={INK}>2026-08</tspan> · REV{" "}
        <tspan fill={INK}>A</tspan>
      </T>
      <T anchor="start" fill={INK_DIM} x={x + 10} y={y + 59}>
        DRAWN <tspan fill={INK}>coconut labs</tspan> · SHEET <tspan fill={INK}>{sheet}</tspan>
      </T>
    </g>
  );
}
