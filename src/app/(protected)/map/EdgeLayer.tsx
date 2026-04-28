'use client';

import { useRef } from 'react';
import type { SkillMapEdge, SkillMapNode } from '@/types/skillMap';
import { portPoint, nearestSideToPoint, orthoPoints } from './geometry';
import type { Point } from './geometry';
import type { Side } from '@/types/skillMap';

interface EdgeLayerProps {
  edges: SkillMapEdge[];
  nodes: SkillMapNode[];
  structuralLinks: Array<{ from: string; to: string }>;
  selectedEdgeId: string | null;
  onSelectEdge: (id: string) => void;
  onWaypointDragStart: (edgeId: string, e: React.MouseEvent) => void;
  width: number;
  height: number;
}

const ARROW_ID = 'skillmap-arrow';

// Returns one handle per segment, all sharing the single free variable (overrideIdx 0).
// For H-V-H: all handles drag horizontally (moves the V segment left/right).
// For V-H-V: all handles drag vertically (moves the H segment up/down).
// For L-bends: both handles drag along the free axis of the corner point.
function orthoHandles(points: Point[]): Array<{ x: number; y: number; axis: 'h' | 'v'; overrideIdx: number }> {
  if (points.length < 3) return [];

  // Determine the single free axis from the path shape
  let freeAxis: 'h' | 'v';
  if (points.length >= 4) {
    // Middle segment (points[1]→points[2]): V → drag h; H → drag v
    freeAxis = points[1].x === points[2].x ? 'h' : 'v';
  } else {
    // L-bend: first segment H → drag h; first segment V → drag v
    freeAxis = points[0].y === points[1].y ? 'h' : 'v';
  }

  const handles: Array<{ x: number; y: number; axis: 'h' | 'v'; overrideIdx: number }> = [];
  for (let i = 0; i + 1 < points.length; i++) {
    handles.push({
      x: (points[i].x + points[i + 1].x) / 2,
      y: (points[i].y + points[i + 1].y) / 2,
      axis: freeAxis,
      overrideIdx: 0,
    });
  }
  return handles;
}

export default function EdgeLayer({
  edges, nodes, structuralLinks, selectedEdgeId,
  onSelectEdge, onWaypointDragStart,
  width, height,
}: EdgeLayerProps) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const pathRefs = useRef<Map<string, SVGPathElement | null>>(new Map());

  return (
    <svg
      style={{ position: 'absolute', inset: 0, width, height, overflow: 'visible', pointerEvents: 'none' }}
    >
      <defs>
        <style>{`
          .ae {
            stroke: #4ade80;
            stroke-dasharray: 8 5;
            animation: dash-flow 0.8s linear infinite;
          }
          .ae-sel {
            stroke: #4ade80;
            stroke-dasharray: 8 5;
            animation: dash-flow 0.8s linear infinite;
            filter: drop-shadow(0 0 3px #4ade80);
          }
          @keyframes dash-flow {
            from { stroke-dashoffset: 13; }
            to   { stroke-dashoffset: 0; }
          }
        `}</style>
      </defs>

      {/* Structural hierarchy lines (Skill→Subskill, Subskill→Exercise) */}
      {structuralLinks.map((link) => {
        const fromNode = nodeMap.get(link.from);
        const toNode   = nodeMap.get(link.to);
        if (!fromNode || !toNode) return null;
        const toCenter   = { x: toNode.x   + toNode.w   / 2, y: toNode.y   + toNode.h   / 2 };
        const fromCenter = { x: fromNode.x + fromNode.w / 2, y: fromNode.y + fromNode.h / 2 };
        const fromSide = nearestSideToPoint(fromNode, toCenter.x, toCenter.y);
        const toSide   = nearestSideToPoint(toNode, fromCenter.x, fromCenter.y);
        const p1 = portPoint(fromNode, fromSide);
        const p2 = portPoint(toNode, toSide);
        return (
          <line
            key={`sl-${link.from}-${link.to}`}
            x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke="var(--structural-stroke)"
            strokeWidth={2}
            strokeLinecap="round"
            style={{ pointerEvents: 'none' }}
          />
        );
      })}

      {edges.map((edge) => {
        const fromNode = nodeMap.get(edge.from);
        const toNode   = nodeMap.get(edge.to);
        if (!fromNode || !toNode) return null;

        const toCenter   = { x: toNode.x   + toNode.w   / 2, y: toNode.y   + toNode.h   / 2 };
        const fromCenter = { x: fromNode.x + fromNode.w / 2, y: fromNode.y + fromNode.h / 2 };
        const fromSide = nearestSideToPoint(fromNode, toCenter.x, toCenter.y);
        const toSide   = nearestSideToPoint(toNode, fromCenter.x, fromCenter.y);
        const p1 = portPoint(fromNode, fromSide);
        const p2 = portPoint(toNode, toSide);
        const isSelected = edge.id === selectedEdgeId;
        const wp = edge.waypoint;

        // When a waypoint exists:
        // - straight connectors: two diagonal segments through wp
        // - ortho connectors: orthogonal route using wp.x (H-V-H) or wp.y (V-H-V) or both (L-bend)
        if (wp) {
          const horiz = (s: Side) => s === 'l' || s === 'r';
          const fH = horiz(fromSide), tH = horiz(toSide);

          let pts: string;
          let wpHandleX = wp.x, wpHandleY = wp.y;

          if (edge.kind === 'ortho') {
            // Derive ortho overrides from waypoint to keep right angles
            let wpOverrides: (number | null)[];
            if (fH && tH) {
              wpOverrides = [wp.x, null, null];
              wpHandleX = wp.x; wpHandleY = (p1.y + p2.y) / 2;
            } else if (!fH && !tH) {
              wpOverrides = [wp.y, null, null];
              wpHandleX = (p1.x + p2.x) / 2; wpHandleY = wp.y;
            } else {
              wpOverrides = fH ? [wp.x, wp.y] : [wp.y, wp.x];
            }
            const wPoints = orthoPoints(p1, fromSide, p2, toSide, wpOverrides);
            pts = wPoints.map((p) => `${p.x},${p.y}`).join(' ');
            // Place handle at the midpoint of the middle segment for visual clarity
            const mid = wPoints[Math.floor(wPoints.length / 2)];
            const midPrev = wPoints[Math.floor(wPoints.length / 2) - 1];
            if (mid && midPrev) { wpHandleX = (mid.x + midPrev.x) / 2; wpHandleY = (mid.y + midPrev.y) / 2; }
          } else {
            pts = `${p1.x},${p1.y} ${wp.x},${wp.y} ${p2.x},${p2.y}`;
          }

          const PolyEl = edge.kind === 'ortho' ? 'polyline' : 'polyline';
          return (
            <g key={edge.id} style={{ pointerEvents: 'all' }}>
              <polyline points={pts} stroke="transparent" strokeWidth={12} fill="none"
                style={{ cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); onSelectEdge(edge.id); }}
              />
              <polyline points={pts}
                className={isSelected ? 'ae-sel' : 'ae'}
                strokeWidth={isSelected ? 4 : 3}
                fill="none"
                style={{ pointerEvents: 'none' }}
              />
            </g>
          );
        }

        if (edge.kind === 'straight') {
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          return (
            <g key={edge.id} style={{ pointerEvents: 'all' }}>
              <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke="transparent" strokeWidth={12}
                style={{ cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); onSelectEdge(edge.id); }}
              />
              <line
                ref={(el) => { pathRefs.current.set(edge.id, el as unknown as SVGPathElement | null); }}
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                className={isSelected ? 'ae-sel' : 'ae'}
                strokeWidth={isSelected ? 4 : 3}
                style={{ pointerEvents: 'none' }}
              />
            </g>
          );
        }

        // ortho — no waypoint: right-angle path with per-segment handles
        const points = orthoPoints(p1, fromSide, p2, toSide, edge.segOverrides);
        const poly = points.map((p) => `${p.x},${p.y}`).join(' ');
        const handles = isSelected ? orthoHandles(points) : [];

        return (
          <g key={edge.id} style={{ pointerEvents: 'all' }}>
            <polyline points={poly} stroke="transparent" strokeWidth={12} fill="none"
              style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); onSelectEdge(edge.id); }}
            />
            <polyline
              points={poly}
              className={isSelected ? 'ae-sel' : 'ae'}
              strokeWidth={isSelected ? 4 : 3}
              fill="none"
              style={{ pointerEvents: 'none' }}
            />
          </g>
        );
      })}
    </svg>
  );
}
