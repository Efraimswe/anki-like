import type { SkillMapNode, SkillMapEdge, Side } from '@/types/skillMap';

export interface Point { x: number; y: number }
export interface Segment { axis: 'h' | 'v'; value: number }

export function portPoint(node: SkillMapNode, side: Side): Point {
  switch (side) {
    case 'l': return { x: node.x,           y: node.y + node.h / 2 };
    case 'r': return { x: node.x + node.w,  y: node.y + node.h / 2 };
    case 't': return { x: node.x + node.w / 2, y: node.y };
    case 'b': return { x: node.x + node.w / 2, y: node.y + node.h };
  }
}

export function nearestSideToPoint(node: SkillMapNode, px: number, py: number): Side {
  const cx = node.x + node.w / 2;
  const cy = node.y + node.h / 2;
  const dx = px - cx;
  const dy = py - cy;
  // scale by half-dimensions so we compare normalised distances
  const nx = (node.w / 2) > 0 ? dx / (node.w / 2) : dx;
  const ny = (node.h / 2) > 0 ? dy / (node.h / 2) : dy;
  if (Math.abs(nx) >= Math.abs(ny)) return nx >= 0 ? 'r' : 'l';
  return ny >= 0 ? 'b' : 't';
}

// Returns the stable axis-aligned segment descriptors for an ortho path.
// Axis is derived ONLY from port sides — never from current geometry.
export function orthoSegments(fromSide: Side, toSide: Side, p1: Point, p2: Point): Segment[] {
  const horiz = (s: Side) => s === 'l' || s === 'r';
  const f = horiz(fromSide);
  const t = horiz(toSide);

  if (f && t) {
    // both horizontal → H–V–H, midpoint at average x
    const mid = (p1.x + p2.x) / 2;
    return [
      { axis: 'h', value: mid },
      { axis: 'v', value: (p1.y + p2.y) / 2 }, // not a real segment but placeholder for 3-seg
      { axis: 'h', value: mid },
    ];
  }
  if (!f && !t) {
    // both vertical → V–H–V, midpoint at average y
    const mid = (p1.y + p2.y) / 2;
    return [
      { axis: 'v', value: mid },
      { axis: 'h', value: (p1.x + p2.x) / 2 },
      { axis: 'v', value: mid },
    ];
  }
  // mixed → single L-bend
  if (f) {
    // from is horizontal (l/r), to is vertical (t/b) → go H then V
    return [{ axis: 'h', value: p2.x }, { axis: 'v', value: p1.y }];
  }
  // from is vertical, to is horizontal → go V then H
  return [{ axis: 'v', value: p2.y }, { axis: 'h', value: p1.x }];
}

export function applySegOverrides(segs: Segment[], overrides?: (number | null)[]): Segment[] {
  if (!overrides) return segs;
  return segs.map((s, i) =>
    overrides[i] != null ? { ...s, value: overrides[i] as number } : s
  );
}

// Build SVG polyline points from an ortho path given two endpoints and segments.
export function orthoPoints(p1: Point, fromSide: Side, p2: Point, toSide: Side, overrides?: (number | null)[]): Point[] {
  const segs = applySegOverrides(orthoSegments(fromSide, toSide, p1, p2), overrides);
  const horiz = (s: Side) => s === 'l' || s === 'r';
  const f = horiz(fromSide);
  const t = horiz(toSide);

  if (f && t) {
    const mid = segs[0].value;
    return [p1, { x: mid, y: p1.y }, { x: mid, y: p2.y }, p2];
  }
  if (!f && !t) {
    const mid = segs[0].value;
    return [p1, { x: p1.x, y: mid }, { x: p2.x, y: mid }, p2];
  }
  if (f) {
    const bx = segs[0].value;
    const by = segs[1] ? segs[1].value : p1.y;
    return [p1, { x: bx, y: by }, p2];
  }
  const bx = segs[1] ? segs[1].value : p1.x;
  const by = segs[0].value;
  return [p1, { x: bx, y: by }, p2];
}

// Internal segment midpoints for bend handles (ortho only).
export function orthoMidpoints(points: Point[]): Point[] {
  const mids: Point[] = [];
  for (let i = 0; i + 1 < points.length; i++) {
    mids.push({
      x: (points[i].x + points[i + 1].x) / 2,
      y: (points[i].y + points[i + 1].y) / 2,
    });
  }
  return mids.slice(0, -1); // remove last (endpoint) — only internal midpoints
}

// Build a cubic bezier SVG path for a straight edge.
export function straightPath(p1: Point, fromSide: Side, p2: Point, toSide: Side): string {
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const ctrl = Math.min(80, dist * 0.35);

  const dir = (side: Side): Point => {
    switch (side) {
      case 'r': return { x: 1, y: 0 };
      case 'l': return { x: -1, y: 0 };
      case 'b': return { x: 0, y: 1 };
      case 't': return { x: 0, y: -1 };
    }
  };
  const d1 = dir(fromSide);
  const d2 = dir(toSide);
  const c1 = { x: p1.x + d1.x * ctrl, y: p1.y + d1.y * ctrl };
  const c2 = { x: p2.x + d2.x * ctrl, y: p2.y + d2.y * ctrl };

  return `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
}

// Hit-test a path element at a point (used for edge click detection).
// Returns true if (px, py) is within `tolerance` pixels of the SVG path.
export function hitTestPath(pathEl: SVGPathElement | null, px: number, py: number, tolerance = 8): boolean {
  if (!pathEl) return false;
  try {
    const len = pathEl.getTotalLength();
    const steps = Math.max(20, Math.floor(len / 4));
    for (let i = 0; i <= steps; i++) {
      const pt = pathEl.getPointAtLength((i / steps) * len);
      if (Math.hypot(pt.x - px, pt.y - py) <= tolerance) return true;
    }
  } catch { /* SVG not mounted */ }
  return false;
}

// Convert client (screen) coords to canvas coords given viewport transform.
export function toCanvasCoords(
  clientX: number,
  clientY: number,
  canvasEl: HTMLElement,
  vp: { x: number; y: number; z: number }
): Point {
  const rect = canvasEl.getBoundingClientRect();
  return {
    x: (clientX - rect.left - vp.x) / vp.z,
    y: (clientY - rect.top - vp.y) / vp.z,
  };
}

export function intersectsRect(
  node: SkillMapNode,
  rx: number, ry: number, rw: number, rh: number
): boolean {
  return (
    node.x < rx + rw &&
    node.x + node.w > rx &&
    node.y < ry + rh &&
    node.y + node.h > ry
  );
}

// Which ortho segment index corresponds to a given drag handle index.
// Axis is locked from the stable segment descriptor.
export function segAxis(fromSide: Side, toSide: Side, segIdx: number): 'h' | 'v' {
  const segs = orthoSegments(fromSide, toSide, { x: 0, y: 0 }, { x: 100, y: 100 });
  return segs[segIdx]?.axis ?? 'h';
}
