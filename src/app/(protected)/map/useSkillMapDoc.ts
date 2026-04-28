'use client';

import { useReducer, useCallback, useRef } from 'react';
import type { SkillMapNode, SkillMapEdge, SkillMapDoc } from '@/types/skillMap';

export interface DocState {
  nodes: SkillMapNode[];
  edges: SkillMapEdge[];
  title: string;
}

type Snapshot = { nodes: SkillMapNode[]; edges: SkillMapEdge[]; title: string };

const MAX_HISTORY = 80;

export type DocAction =
  | { type: 'LOAD'; doc: SkillMapDoc }
  | { type: 'CREATE_NODE'; node: SkillMapNode }
  | { type: 'UPDATE_NODE'; id: string; patch: Partial<SkillMapNode> }
  | { type: 'MOVE_NODES'; ids: string[]; dx: number; dy: number }
  | { type: 'RESIZE_NODE'; id: string; x: number; y: number; w: number; h: number }
  | { type: 'DELETE_NODES'; ids: string[] }
  | { type: 'DELETE_EDGE'; id: string }
  | { type: 'CREATE_EDGE'; edge: SkillMapEdge }
  | { type: 'UPDATE_EDGE'; id: string; patch: Partial<SkillMapEdge> }
  | { type: 'SET_TITLE'; title: string };

function reducer(state: DocState, action: DocAction): DocState {
  switch (action.type) {
    case 'LOAD':
      return { nodes: action.doc.nodes, edges: action.doc.edges, title: action.doc.title };
    case 'CREATE_NODE':
      return { ...state, nodes: [...state.nodes, action.node] };
    case 'UPDATE_NODE':
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.id ? ({ ...n, ...action.patch } as SkillMapNode) : n
        ),
      };
    case 'MOVE_NODES':
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          action.ids.includes(n.id) ? { ...n, x: n.x + action.dx, y: n.y + action.dy } : n
        ),
      };
    case 'RESIZE_NODE':
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.id
            ? { ...n, x: action.x, y: action.y, w: Math.max(40, action.w), h: Math.max(30, action.h) }
            : n
        ),
      };
    case 'DELETE_NODES': {
      const toDelete = new Set(action.ids);
      let grew = true;
      while (grew) {
        grew = false;
        for (const n of state.nodes) {
          if (toDelete.has(n.id)) continue;
          if (
            (n.type === 'subskill' || n.type === 'exercise') &&
            toDelete.has((n as { parentId: string }).parentId)
          ) {
            toDelete.add(n.id);
            grew = true;
          }
        }
      }
      return {
        ...state,
        nodes: state.nodes.filter((n) => !toDelete.has(n.id)),
        edges: state.edges.filter((e) => !toDelete.has(e.from) && !toDelete.has(e.to)),
      };
    }
    case 'DELETE_EDGE':
      return { ...state, edges: state.edges.filter((e) => e.id !== action.id) };
    case 'CREATE_EDGE':
      return { ...state, edges: [...state.edges, action.edge] };
    case 'UPDATE_EDGE':
      return {
        ...state,
        edges: state.edges.map((e) => (e.id === action.id ? { ...e, ...action.patch } : e)),
      };
    case 'SET_TITLE':
      return { ...state, title: action.title };
    default:
      return state;
  }
}

const INITIAL: DocState = { nodes: [], edges: [], title: 'My Skill Map' };

export function useSkillMapDoc() {
  const [doc, dispatch] = useReducer(reducer, INITIAL);
  const history = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);

  const snapshot = useCallback((current: DocState) => {
    history.current = [
      ...history.current.slice(-(MAX_HISTORY - 1)),
      { nodes: current.nodes, edges: current.edges, title: current.title },
    ];
    future.current = [];
  }, []);

  const dispatchWithSnapshot = useCallback(
    (action: DocAction, takeSnapshot: boolean, currentDoc: DocState) => {
      if (takeSnapshot) snapshot(currentDoc);
      dispatch(action);
    },
    [snapshot]
  );

  const undo = useCallback((currentDoc: DocState) => {
    if (history.current.length === 0) return null;
    const prev = history.current[history.current.length - 1];
    history.current = history.current.slice(0, -1);
    future.current = [
      { nodes: currentDoc.nodes, edges: currentDoc.edges, title: currentDoc.title },
      ...future.current.slice(0, MAX_HISTORY - 1),
    ];
    dispatch({ type: 'LOAD', doc: { ...prev, nodes: prev.nodes, edges: prev.edges } });
    return prev;
  }, []);

  const redo = useCallback((currentDoc: DocState) => {
    if (future.current.length === 0) return null;
    const next = future.current[0];
    future.current = future.current.slice(1);
    history.current = [
      ...history.current.slice(-(MAX_HISTORY - 1)),
      { nodes: currentDoc.nodes, edges: currentDoc.edges, title: currentDoc.title },
    ];
    dispatch({ type: 'LOAD', doc: { ...next, nodes: next.nodes, edges: next.edges } });
    return next;
  }, []);

  const canUndo = history.current.length > 0;
  const canRedo = future.current.length > 0;

  return { doc, dispatch, dispatchWithSnapshot, undo, redo, canUndo, canRedo };
}
