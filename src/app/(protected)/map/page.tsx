'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useSkillMap, useSaveSkillMap, useUpdateSkillLevels } from '@/lib/queries/skillMap';
import type { SkillLevels } from '@/lib/onboarding/skillLevels';
import type { Level } from '@/lib/onboarding/levels';
import { useSkillMapDoc } from './useSkillMapDoc';
import NodeView from './NodeView';
import NodeToolbar from './NodeToolbar';
import EdgeLayer from './EdgeLayer';
import Toolbar, { type Tool } from './Toolbar';
import SkillPicker from './SkillPicker';
import ChildTypePicker, { type ChildType } from './ChildTypePicker';
import ZoomControls from './ZoomControls';
import { toCanvasCoords, intersectsRect, resolveOverlaps } from './geometry';
import type { SkillMapNode, SkillName, Side } from '@/types/skillMap';

interface Viewport { x: number; y: number; z: number }
const DEFAULT_VP: Viewport = { x: 300, y: 80, z: 1 };
const MIN_Z = 0.15, MAX_Z = 4;

const SKILL_NAME_TO_COLOR: Record<SkillName, 'skill-indigo' | 'skill-teal' | 'skill-rose' | 'skill-amber'> = {
  Reading:   'skill-indigo',
  Listening: 'skill-teal',
  Writing:   'skill-rose',
  Speaking:  'skill-amber',
};

function clampZ(z: number) { return Math.max(MIN_Z, Math.min(MAX_Z, z)); }
function uid() { return Math.random().toString(36).slice(2, 10); }
function isTyping() {
  const el = document.activeElement;
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable);
}

// Debounce hook
function useDebounce<T>(value: T, ms: number) {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return deb;
}

export default function MapPage() {
  const { data: serverMap, isLoading } = useSkillMap();
  const { mutate: save, isPending, isError } = useSaveSkillMap();
  const { mutate: saveSkillLevels } = useUpdateSkillLevels();

  const { doc, dispatch, dispatchWithSnapshot, undo, redo } = useSkillMapDoc();
  const [loaded, setLoaded] = useState(false);
  const [skillLevels, setSkillLevels] = useState<SkillLevels | null>(null);
  const docRef = useRef(doc);
  useEffect(() => { docRef.current = doc; }, [doc]);

  // Load from server once — silently drop stale node types from Phase 1/2
  // and skills whose name isn't one of the four canonical language skills.
  useEffect(() => {
    if (serverMap && !loaded) {
      const CANONICAL = new Set<string>(['Reading', 'Listening', 'Writing', 'Speaking']);
      // 1. drop unknown node types
      const step1 = serverMap.nodes.filter(
        (n) => n.type === 'skill' || n.type === 'subskill' || n.type === 'exercise'
      );
      // 2. drop skills with non-canonical text
      const step2 = step1.filter((n) => n.type !== 'skill' || CANONICAL.has(n.text));
      // 3. cascade: drop subskills whose parent skill is gone
      const aliveAfterStep2 = new Set(step2.map((n) => n.id));
      const step3 = step2.filter((n) =>
        n.type !== 'subskill' || aliveAfterStep2.has((n as { parentId: string }).parentId)
      );
      // 4. cascade: drop exercises whose parent subskill is gone
      const aliveAfterStep3 = new Set(step3.map((n) => n.id));
      const cleanNodes = step3.filter((n) =>
        n.type !== 'exercise' || aliveAfterStep3.has((n as { parentId: string }).parentId)
      );
      // 5. drop edges referencing dropped nodes
      const finalIds = new Set(cleanNodes.map((n) => n.id));
      const cleanEdges = serverMap.edges.filter((e) => finalIds.has(e.from) && finalIds.has(e.to));

      dispatch({ type: 'LOAD', doc: { ...serverMap, nodes: cleanNodes, edges: cleanEdges } });
      if (cleanNodes.length !== serverMap.nodes.length || cleanEdges.length !== serverMap.edges.length) {
        isDirtyRef.current = true;
      }
      setSkillLevels(serverMap.skillLevels);
      setLoaded(true);
    }
  }, [serverMap, loaded, dispatch]);

  // Autosave — only after the user makes an edit (not on initial LOAD)
  const debouncedDoc = useDebounce(doc, 500);
  const isDirtyRef = useRef(false);
  useEffect(() => {
    if (!loaded || !isDirtyRef.current) return;
    save(debouncedDoc);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDoc, loaded]);

  // Wrapper: marks the doc dirty before delegating to dispatchWithSnapshot
  const editDispatch = useCallback(
    (...args: Parameters<typeof dispatchWithSnapshot>) => {
      isDirtyRef.current = true;
      dispatchWithSnapshot(...args);
    },
    [dispatchWithSnapshot],
  );

  // Viewport
  const [vp, setVp] = useState<Viewport>(DEFAULT_VP);
  const vpRef = useRef(vp);
  useEffect(() => { vpRef.current = vp; }, [vp]);

  // Tool state
  const [tool, setTool] = useState<Tool>('select');
  const connectorKind = 'straight' as const;
  const prevToolRef = useRef<Tool>('select');
  const spaceHeld = useRef(false);

  // Skill picker — opens at click position when tool === 'skill'.
  const [skillPicker, setSkillPicker] = useState<
    { screenX: number; screenY: number; canvasX: number; canvasY: number } | null
  >(null);

  // Child-type picker — opens when "+" is clicked on a subskill.
  const [childTypePicker, setChildTypePicker] = useState<
    { parentId: string; side: Side; screenX: number; screenY: number; exerciseDisabled: boolean } | null
  >(null);

  // Selection
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const suppressNextSelect = useRef(false);

  // Drag state
  const drag = useRef<{
    type: 'pan' | 'move' | 'resize' | 'marquee' | 'bend' | 'waypoint';
    startX: number; startY: number;
    // pan
    vpStart?: Viewport;
    // move
    nodeStart?: Map<string, { x: number; y: number }>;
    // resize
    resizeId?: string; resizeCorner?: string;
    nodeStartRect?: { x: number; y: number; w: number; h: number };
    // marquee
    marqueeStart?: { cx: number; cy: number };
    // bend
    bendEdgeId?: string; bendSegIdx?: number; bendAxis?: 'h' | 'v';
    // waypoint (straight connector midpoint drag)
    waypointEdgeId?: string;
  } | null>(null);

  const [marqueeRect, setMarqueeRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTyping()) {
        e.preventDefault();
        if (!spaceHeld.current) {
          spaceHeld.current = true;
          prevToolRef.current = tool;
          setTool('hand');
        }
        return;
      }
      if (isTyping()) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo(docRef.current);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo(docRef.current);
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isTyping()) {
        e.preventDefault();
        if (selectedEdgeId) {
          dispatch({ type: 'DELETE_EDGE', id: selectedEdgeId });
          setSelectedEdgeId(null);
        } else if (selectedNodes.size > 0) {
          editDispatch({ type: 'DELETE_NODES', ids: [...selectedNodes] }, true, docRef.current);
          setSelectedNodes(new Set());
        }
        return;
      }
      if (e.key === 'Escape') {
        setSelectedNodes(new Set());
        setSelectedEdgeId(null);
        setEditingNodeId(null);
        return;
      }
      switch (e.key) {
        case 'v': case 'V': setTool('select'); break;
        case 'h': case 'H': setTool('hand'); break;
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceHeld.current = false;
        setTool(prevToolRef.current);
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodes, selectedEdgeId]);

  // ─── Wheel zoom/pan (non-passive so preventDefault works) ───
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const rect = el.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        setVp((v) => {
          // Normalize across deltaMode (pixel / line / page)
          const pixels = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * 800 : e.deltaY;
          const newZ = clampZ(v.z * Math.pow(2, -pixels / 105));
          const f = newZ / v.z;
          return { x: cx - (cx - v.x) * f, y: cy - (cy - v.y) * f, z: newZ };
        });
      } else {
        setVp((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
      }
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [loaded]);

  // ─── Mouse down on canvas wrapper ───
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || tool === 'hand') {
      drag.current = { type: 'pan', startX: e.clientX, startY: e.clientY, vpStart: { ...vpRef.current } };
      return;
    }
    if (e.button !== 0) return;

    const cv = toCanvasCoords(e.clientX, e.clientY, wrapRef.current!, vpRef.current);

    if (tool === 'select') {
      // start marquee on empty canvas
      setSelectedNodes(new Set());
      setSelectedEdgeId(null);
      drag.current = {
        type: 'marquee',
        startX: e.clientX, startY: e.clientY,
        marqueeStart: { cx: cv.x, cy: cv.y },
      };
    } else if (tool === 'skill') {
      setSkillPicker({ screenX: e.clientX, screenY: e.clientY, canvasX: cv.x, canvasY: cv.y });
    }
  }, [tool]);

  const handlePickSkill = useCallback((name: SkillName) => {
    if (!skillPicker) return;
    const id = `n_${uid()}`;
    const node: SkillMapNode = {
      id, type: 'skill',
      x: skillPicker.canvasX - 110, y: skillPicker.canvasY - 60,
      w: 220, h: 120,
      text: name,
      color: SKILL_NAME_TO_COLOR[name],
    };
    editDispatch({ type: 'CREATE_NODE', node }, true, docRef.current);
    setSelectedNodes(new Set([id]));
    setSkillPicker(null);
    setTool('select');
  }, [skillPicker, editDispatch]);

  // ─── Mouse move ───
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const d = drag.current;
    if (!d) return;

    if (d.type === 'pan') {
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      setVp({ ...d.vpStart!, x: d.vpStart!.x + dx, y: d.vpStart!.y + dy });
      return;
    }

    if (d.type === 'move' && d.nodeStart) {
      const dx = (e.clientX - d.startX) / vpRef.current.z;
      const dy = (e.clientY - d.startY) / vpRef.current.z;
      // apply delta relative to snapshot
      const ids = [...d.nodeStart.keys()];
      ids.forEach((id) => {
        const start = d.nodeStart!.get(id)!;
        dispatch({ type: 'UPDATE_NODE', id, patch: { x: start.x + dx, y: start.y + dy } as Partial<SkillMapNode> });
      });
      return;
    }

    if (d.type === 'resize' && d.resizeId && d.nodeStartRect && d.resizeCorner) {
      const dx = (e.clientX - d.startX) / vpRef.current.z;
      const dy = (e.clientY - d.startY) / vpRef.current.z;
      const r = d.nodeStartRect;
      let { x, y, w, h } = r;
      const c = d.resizeCorner;
      if (c.includes('e')) w = Math.max(40, r.w + dx);
      if (c.includes('s')) h = Math.max(30, r.h + dy);
      if (c.includes('w')) { x = r.x + dx; w = Math.max(40, r.w - dx); }
      if (c.includes('n')) { y = r.y + dy; h = Math.max(30, r.h - dy); }
      dispatch({ type: 'RESIZE_NODE', id: d.resizeId, x, y, w, h });
      return;
    }

    if (d.type === 'marquee' && d.marqueeStart) {
      const cv = toCanvasCoords(e.clientX, e.clientY, wrapRef.current!, vpRef.current);
      const rx = Math.min(d.marqueeStart.cx, cv.x);
      const ry = Math.min(d.marqueeStart.cy, cv.y);
      const rw = Math.abs(cv.x - d.marqueeStart.cx);
      const rh = Math.abs(cv.y - d.marqueeStart.cy);
      setMarqueeRect({ x: rx, y: ry, w: rw, h: rh });
      return;
    }

    if (d.type === 'bend' && d.bendEdgeId != null && d.bendAxis) {
      const cv = toCanvasCoords(e.clientX, e.clientY, wrapRef.current!, vpRef.current);
      const val = d.bendAxis === 'h' ? cv.x : cv.y;
      const edge = docRef.current.edges.find((e2) => e2.id === d.bendEdgeId);
      if (edge) {
        const overrides = [...(edge.segOverrides ?? Array(4).fill(null))];
        overrides[d.bendSegIdx!] = val;
        dispatch({ type: 'UPDATE_EDGE', id: d.bendEdgeId, patch: { segOverrides: overrides } });
      }
      return;
    }

    if (d.type === 'waypoint' && d.waypointEdgeId) {
      const cv = toCanvasCoords(e.clientX, e.clientY, wrapRef.current!, vpRef.current);
      dispatch({ type: 'UPDATE_EDGE', id: d.waypointEdgeId, patch: { waypoint: { x: cv.x, y: cv.y } } });
      return;
    }

  }, [dispatch]);

  // ─── Mouse up ───
  const onMouseUp = useCallback((e: React.MouseEvent) => {
    const d = drag.current;
    drag.current = null;

    if (!d) return;

    if (d.type === 'move') {
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) suppressNextSelect.current = true;
      return;
    }

    if (d.type === 'marquee' && marqueeRect) {
      const hits = docRef.current.nodes.filter((n) =>
        intersectsRect(n, marqueeRect.x, marqueeRect.y, marqueeRect.w, marqueeRect.h)
      );
      if (e.shiftKey) {
        setSelectedNodes((prev) => new Set([...prev, ...hits.map((n) => n.id)]));
      } else {
        setSelectedNodes(new Set(hits.map((n) => n.id)));
      }
      setMarqueeRect(null);
      return;
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marqueeRect, connectorKind, editDispatch, dispatch]);

  // Node handlers
  const handleNodeMouseDown = useCallback((node: SkillMapNode, e: React.MouseEvent) => {
    if (editingNodeId === node.id) return;
    e.stopPropagation();
    if (!selectedNodes.has(node.id)) {
      if (!e.shiftKey) setSelectedNodes(new Set([node.id]));
      else setSelectedNodes((prev) => new Set([...prev, node.id]));
    }
    // start move
    const ids = selectedNodes.has(node.id) ? [...selectedNodes] : [node.id];
    const nodeStart = new Map(
      docRef.current.nodes
        .filter((n) => ids.includes(n.id))
        .map((n) => [n.id, { x: n.x, y: n.y }])
    );
    // snapshot before move
    const snapshot = { nodes: docRef.current.nodes, edges: docRef.current.edges, title: docRef.current.title };
    // store snapshot via undo
    editDispatch({ type: 'MOVE_NODES', ids, dx: 0, dy: 0 }, true, docRef.current);
    drag.current = { type: 'move', startX: e.clientX, startY: e.clientY, nodeStart };
    void snapshot;
  }, [editingNodeId, selectedNodes, editDispatch]);

  const handleNodeSelect = useCallback((node: SkillMapNode, e: React.MouseEvent) => {
    if (suppressNextSelect.current) { suppressNextSelect.current = false; return; }
    e.stopPropagation();
    setSelectedEdgeId(null);
    if (e.shiftKey) {
      setSelectedNodes((prev) => {
        const next = new Set(prev);
        if (next.has(node.id)) next.delete(node.id); else next.add(node.id);
        return next;
      });
    } else {
      setSelectedNodes(new Set([node.id]));
    }
  }, []);

  const handleNodeDoubleClick = useCallback((node: SkillMapNode) => {
    setEditingNodeId(node.id);
  }, []);

  const handleTextCommit = useCallback((node: SkillMapNode, text: string) => {
    isDirtyRef.current = true;
    dispatch({ type: 'UPDATE_NODE', id: node.id, patch: { text } as Partial<SkillMapNode> });
    setEditingNodeId(null);
  }, [dispatch]);

  const handleResizeStart = useCallback((nodeId: string, corner: string, e: React.MouseEvent) => {
    const node = docRef.current.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    editDispatch({ type: 'RESIZE_NODE', id: nodeId, x: node.x, y: node.y, w: node.w, h: node.h }, true, docRef.current);
    drag.current = {
      type: 'resize',
      startX: e.clientX, startY: e.clientY,
      resizeId: nodeId, resizeCorner: corner,
      nodeStartRect: { x: node.x, y: node.y, w: node.w, h: node.h },
    };
  }, [editDispatch]);

const handleWaypointDragStart = useCallback((edgeId: string, e: React.MouseEvent) => {
    editDispatch({ type: 'UPDATE_EDGE', id: edgeId, patch: {} }, true, docRef.current);
    drag.current = { type: 'waypoint', startX: e.clientX, startY: e.clientY, waypointEdgeId: edgeId };
  }, [editDispatch]);

  const createChild = useCallback((parentId: string, side: Side, childType: 'subskill' | 'exercise') => {
    const parent = docRef.current.nodes.find((n) => n.id === parentId);
    if (!parent) return;

    const GAP = 80;
    const id = `n_${uid()}`;
    const childW = childType === 'subskill' ? 180 : 160;
    const childH = childType === 'subskill' ? 90  : 72;

    const parentCx = parent.x + parent.w / 2;
    const parentCy = parent.y + parent.h / 2;
    let cx: number, cy: number;
    if (side === 'r') { cx = parent.x + parent.w + GAP + childW / 2; cy = parentCy; }
    else if (side === 'l') { cx = parent.x - GAP - childW / 2; cy = parentCy; }
    else if (side === 'b') { cx = parentCx; cy = parent.y + parent.h + GAP + childH / 2; }
    else { cx = parentCx; cy = parent.y - GAP - childH / 2; }

    const node: SkillMapNode = {
      id, type: childType,
      x: cx - childW / 2, y: cy - childH / 2,
      w: childW, h: childH,
      text: '',
      parentId,
    } as SkillMapNode;

    // Physics: keep the parent anchored, let the new node and any
    // existing nodes shift to clear overlaps.
    const all = [...docRef.current.nodes, node];
    const resolved = resolveOverlaps(all, { lockedIds: new Set([parent.id]) });
    const resolvedNew = resolved.find((n) => n.id === id) ?? node;

    for (const n of resolved) {
      if (n.id === id) continue;
      const orig = docRef.current.nodes.find((o) => o.id === n.id);
      if (orig && (orig.x !== n.x || orig.y !== n.y)) {
        dispatch({ type: 'UPDATE_NODE', id: n.id, patch: { x: n.x, y: n.y } });
      }
    }

    editDispatch({ type: 'CREATE_NODE', node: resolvedNew }, true, docRef.current);
    setSelectedNodes(new Set([id]));
    setEditingNodeId(id);
  }, [editDispatch, dispatch]);

  const handleSpawnChild = useCallback((parentId: string, side: Side, e: React.MouseEvent) => {
    const parent = docRef.current.nodes.find((n) => n.id === parentId);
    if (!parent) return;

    if (parent.type === 'skill') {
      createChild(parentId, side, 'subskill');
      return;
    }

    if (parent.type === 'subskill') {
      const hasExercise = docRef.current.nodes.some(
        (n) => n.type === 'exercise' && (n as { parentId: string }).parentId === parentId
      );
      setChildTypePicker({
        parentId, side,
        screenX: e.clientX, screenY: e.clientY,
        exerciseDisabled: hasExercise,
      });
    }
  }, [createChild]);

  const handlePickChildType = useCallback((type: ChildType) => {
    if (!childTypePicker) return;
    createChild(childTypePicker.parentId, childTypePicker.side, type);
    setChildTypePicker(null);
  }, [childTypePicker, createChild]);

  const structuralLinks = useMemo(() =>
    doc.nodes
      .filter((n) => n.type === 'subskill' || n.type === 'exercise')
      .map((n) => ({ from: (n as { parentId: string }).parentId, to: n.id })),
    [doc.nodes]);

  // During a marquee drag show live highlights before mouse-up
  const liveSelected = marqueeRect
    ? new Set(doc.nodes.filter((n) => intersectsRect(n, marqueeRect.x, marqueeRect.y, marqueeRect.w, marqueeRect.h)).map((n) => n.id))
    : selectedNodes;

  const cursorStyle = tool === 'hand' ? (drag.current?.type === 'pan' ? 'grabbing' : 'grab')
    : tool === 'skill' ? 'crosshair'
    : 'default';

  if (isLoading || !loaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--canvas-bg)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-(--color-accent) border-t-transparent animate-spin" />
      </div>
    );
  }

  const CANVAS_SIZE = 20000;

  return (
    <>
      <div
        ref={wrapRef}
        className="fixed inset-0"
        style={(() => {
          let gridWorld = 24;
          while (gridWorld * vp.z < 8) gridWorld *= 4;
          while (gridWorld * vp.z > 96) gridWorld /= 4;
          const gridPx = gridWorld * vp.z;
          return {
            background: 'var(--canvas-bg)',
            backgroundImage: 'radial-gradient(circle, var(--canvas-dot) 1px, transparent 1.2px)',
            backgroundSize: `${gridPx}px ${gridPx}px`,
            backgroundPosition: `${vp.x % gridPx}px ${vp.y % gridPx}px`,
            cursor: cursorStyle,
            userSelect: 'none' as const,
          };
        })()}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}

      >
        {/* Transformed canvas */}
        <div
          ref={canvasRef}
          style={{ position: 'absolute', transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.z})`, transformOrigin: '0 0', width: CANVAS_SIZE, height: CANVAS_SIZE }}
        >
          {/* Nodes */}
          {doc.nodes.map((node) => {
            const isSelected = liveSelected.has(node.id);
            const showSpawnArrows = isSelected &&
              (node.type === 'skill' ||
                (node.type === 'subskill' && !doc.nodes.some(
                  (n) => n.type === 'exercise' && (n as { parentId: string }).parentId === node.id
                )));
            const skillLevel = node.type === 'skill'
              ? (skillLevels?.[node.text.toLowerCase() as keyof SkillLevels] ?? null)
              : null;
            return (
              <NodeView
                key={node.id}
                node={node}
                selected={isSelected}
                editing={editingNodeId === node.id}
                showSpawnArrows={showSpawnArrows}
                zoom={vp.z}
                skillLevel={skillLevel}
                onSelect={(e) => handleNodeSelect(node, e)}
                onMouseDown={(e) => handleNodeMouseDown(node, e)}
                onDoubleClick={() => handleNodeDoubleClick(node)}
                onTextCommit={(text) => handleTextCommit(node, text)}
                onResizeStart={(corner, e) => handleResizeStart(node.id, corner, e)}
                onSpawnChild={(side, e) => handleSpawnChild(node.id, side, e)}
              />
            );
          })}

          {/* Edges */}
          <EdgeLayer
            edges={doc.edges}
            nodes={doc.nodes}
            structuralLinks={structuralLinks}
            selectedEdgeId={selectedEdgeId}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            onSelectEdge={(id) => { setSelectedEdgeId(id); setSelectedNodes(new Set()); }}
            onWaypointDragStart={handleWaypointDragStart}
          />

          {/* Marquee */}
          {marqueeRect && (
            <div style={{
              position: 'absolute',
              left: marqueeRect.x, top: marqueeRect.y,
              width: marqueeRect.w, height: marqueeRect.h,
              border: '1.5px solid var(--color-accent)',
              background: 'rgba(242,91,57,0.08)',
              pointerEvents: 'none',
              borderRadius: 2,
            }} />
          )}
        </div>

        {/* Floating node toolbar */}
        {(() => {
          if (selectedNodes.size !== 1) return null;
          const nodeId = [...selectedNodes][0];
          if (editingNodeId === nodeId) return null;
          if (drag.current?.type === 'resize') return null;
          const node = doc.nodes.find((n) => n.id === nodeId);
          if (!node) return null;
          const skillLevel = node.type === 'skill'
            ? (skillLevels?.[node.text.toLowerCase() as keyof SkillLevels] ?? null)
            : null;
          return (
            <NodeToolbar
              node={node}
              vp={vp}
              skillLevel={skillLevel}
              onPatchNode={(patch) => {
                isDirtyRef.current = true;
                dispatch({ type: 'UPDATE_NODE', id: node.id, patch: patch as Partial<typeof node> });
              }}
              onChangeSkillLevel={(level: Level) => {
                const key = node.text.toLowerCase() as keyof SkillLevels;
                const prev = skillLevels;
                const next = { ...(skillLevels ?? {} as SkillLevels), [key]: level } as SkillLevels;
                setSkillLevels(next);
                saveSkillLevels(next, { onError: () => setSkillLevels(prev) });
              }}
            />
          );
        })()}
      </div>

      {/* Save status */}
      <div className="fixed top-4 right-4 z-50 text-xs font-medium" style={{ color: 'var(--color-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
        {isPending ? 'Saving…' : isError ? 'Save failed' : ''}
      </div>

      <Toolbar tool={tool} onTool={setTool} />

      {skillPicker && (
        <SkillPicker
          screenX={skillPicker.screenX}
          screenY={skillPicker.screenY}
          onPick={handlePickSkill}
          onClose={() => { setSkillPicker(null); setTool('select'); }}
        />
      )}

      {childTypePicker && (
        <ChildTypePicker
          screenX={childTypePicker.screenX}
          screenY={childTypePicker.screenY}
          exerciseDisabled={childTypePicker.exerciseDisabled}
          onPick={handlePickChildType}
          onClose={() => setChildTypePicker(null)}
        />
      )}

      <ZoomControls
        zoom={vp.z}
        onZoomIn={() => setVp((v) => ({ ...v, z: clampZ(v.z * 1.5) }))}
        onZoomOut={() => setVp((v) => ({ ...v, z: clampZ(v.z / 1.5) }))}
        onReset={() => setVp(DEFAULT_VP)}
      />

    </>
  );
}
