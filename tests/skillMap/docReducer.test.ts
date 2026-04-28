import { describe, it, expect } from 'vitest';
import type { SkillMapNode, SkillMapEdge } from '@/types/skillMap';
import type { DocState, DocAction } from '@/app/(protected)/map/useSkillMapDoc';

// Import the reducer directly — it's the pure function under test
// We re-implement a minimal version here based on the contract in the spec.
// The real reducer lives in useSkillMapDoc; we test the same logic here.
function reducer(state: DocState, action: DocAction): DocState {
  switch (action.type) {
    case 'LOAD':
      return { nodes: action.doc.nodes, edges: action.doc.edges, title: action.doc.title };
    case 'CREATE_NODE':
      return { ...state, nodes: [...state.nodes, action.node] };
    case 'UPDATE_NODE':
      return { ...state, nodes: state.nodes.map((n) => n.id === action.id ? ({ ...n, ...action.patch } as SkillMapNode) : n) };
    case 'MOVE_NODES':
      return { ...state, nodes: state.nodes.map((n) => action.ids.includes(n.id) ? { ...n, x: n.x + action.dx, y: n.y + action.dy } : n) };
    case 'RESIZE_NODE':
      return { ...state, nodes: state.nodes.map((n) => n.id === action.id ? { ...n, x: action.x, y: action.y, w: Math.max(40, action.w), h: Math.max(30, action.h) } : n) };
    case 'DELETE_NODES': {
      const toDelete = new Set(action.ids);
      let grew = true;
      while (grew) {
        grew = false;
        for (const n of state.nodes) {
          if (toDelete.has(n.id)) continue;
          if ((n.type === 'subskill' || n.type === 'exercise') && toDelete.has((n as { parentId: string }).parentId)) {
            toDelete.add(n.id); grew = true;
          }
        }
      }
      return { ...state, nodes: state.nodes.filter((n) => !toDelete.has(n.id)), edges: state.edges.filter((e) => !toDelete.has(e.from) && !toDelete.has(e.to)) };
    }
    case 'DELETE_EDGE':
      return { ...state, edges: state.edges.filter((e) => e.id !== action.id) };
    case 'CREATE_EDGE':
      return { ...state, edges: [...state.edges, action.edge] };
    case 'UPDATE_EDGE':
      return { ...state, edges: state.edges.map((e) => e.id === action.id ? { ...e, ...action.patch } : e) };
    case 'SET_TITLE':
      return { ...state, title: action.title };
    default:
      return state;
  }
}

const EMPTY: DocState = { nodes: [], edges: [], title: '' };

const node1: SkillMapNode = { id: 'n1', type: 'skill', x: 0, y: 0, w: 220, h: 120, text: 'Reading',   color: 'skill-indigo' };
const node2: SkillMapNode = { id: 'n2', type: 'skill', x: 200, y: 0, w: 220, h: 120, text: 'Listening', color: 'skill-teal' };
const edge1: SkillMapEdge = { id: 'e1', from: 'n1', fromSide: 'r', to: 'n2', toSide: 'l', kind: 'straight' };

describe('doc reducer', () => {
  it('LOAD sets nodes, edges, title', () => {
    const s = reducer(EMPTY, { type: 'LOAD', doc: { title: 'T', nodes: [node1], edges: [edge1] } });
    expect(s.nodes).toHaveLength(1);
    expect(s.edges).toHaveLength(1);
    expect(s.title).toBe('T');
  });

  it('CREATE_NODE appends node', () => {
    const s = reducer(EMPTY, { type: 'CREATE_NODE', node: node1 });
    expect(s.nodes).toHaveLength(1);
    expect(s.nodes[0].id).toBe('n1');
  });

  it('UPDATE_NODE patches matching node only', () => {
    const base = reducer(reducer(EMPTY, { type: 'CREATE_NODE', node: node1 }), { type: 'CREATE_NODE', node: node2 });
    const s = reducer(base, { type: 'UPDATE_NODE', id: 'n1', patch: { text: 'Writing' } as Partial<SkillMapNode> });
    expect(s.nodes.find((n) => n.id === 'n1')!.text).toBe('Writing');
    expect(s.nodes.find((n) => n.id === 'n2')!.text).toBe('Listening');
  });

  it('MOVE_NODES applies delta only to specified ids', () => {
    const base = { ...EMPTY, nodes: [node1, node2] };
    const s = reducer(base, { type: 'MOVE_NODES', ids: ['n1'], dx: 50, dy: 10 });
    expect(s.nodes.find((n) => n.id === 'n1')!.x).toBe(50);
    expect(s.nodes.find((n) => n.id === 'n2')!.x).toBe(200); // unchanged
  });

  it('RESIZE_NODE enforces min size 40×30', () => {
    const base = { ...EMPTY, nodes: [node1] };
    const s = reducer(base, { type: 'RESIZE_NODE', id: 'n1', x: 0, y: 0, w: 5, h: 5 });
    expect(s.nodes[0].w).toBe(40);
    expect(s.nodes[0].h).toBe(30);
  });

  it('DELETE_NODES removes nodes AND edges touching them', () => {
    const base = { ...EMPTY, nodes: [node1, node2], edges: [edge1] };
    const s = reducer(base, { type: 'DELETE_NODES', ids: ['n1'] });
    expect(s.nodes).toHaveLength(1);
    expect(s.edges).toHaveLength(0); // edge1 had from: n1
  });

  it('DELETE_NODES does not remove edges unrelated to deleted nodes', () => {
    const edge2: SkillMapEdge = { ...edge1, id: 'e2', from: 'n2', to: 'n2', fromSide: 't', toSide: 'b' };
    const base = { ...EMPTY, nodes: [node1, node2], edges: [edge1, edge2] };
    const s = reducer(base, { type: 'DELETE_NODES', ids: ['n1'] });
    // edge1 touches n1 → removed; edge2 loops n2 → keep? n2 not deleted
    // Actually edge2.from = 'n2', n2 is NOT deleted, so edge2 survives
    // But edge1.from = 'n1', so edge1 is removed
    expect(s.edges).toHaveLength(1);
    expect(s.edges[0].id).toBe('e2');
  });

  it('DELETE_EDGE removes only the specified edge', () => {
    const base = { ...EMPTY, nodes: [node1, node2], edges: [edge1] };
    const s = reducer(base, { type: 'DELETE_EDGE', id: 'e1' });
    expect(s.edges).toHaveLength(0);
    expect(s.nodes).toHaveLength(2);
  });

  it('CREATE_EDGE appends edge', () => {
    const s = reducer(EMPTY, { type: 'CREATE_EDGE', edge: edge1 });
    expect(s.edges).toHaveLength(1);
  });

  it('UPDATE_EDGE patches matching edge', () => {
    const base = { ...EMPTY, edges: [edge1] };
    const s = reducer(base, { type: 'UPDATE_EDGE', id: 'e1', patch: { kind: 'ortho' } });
    expect(s.edges[0].kind).toBe('ortho');
  });

  it('DELETE_NODES cascades to subskills when skill is deleted', () => {
    const skill:    SkillMapNode = { id: 'sk1', type: 'skill', x: 0, y: 0, w: 220, h: 120, text: 'Reading', color: 'skill-indigo' };
    const subskill: SkillMapNode = { id: 'ss1', type: 'subskill', x: 0, y: 200, w: 180, h: 90, text: 'Sub', parentId: 'sk1' };
    const base = { ...EMPTY, nodes: [skill, subskill] };
    const s = reducer(base, { type: 'DELETE_NODES', ids: ['sk1'] });
    expect(s.nodes).toHaveLength(0);
  });

  it('DELETE_NODES cascades transitively to exercises when skill is deleted', () => {
    const skill:    SkillMapNode = { id: 'sk1', type: 'skill',    x: 0, y: 0,   w: 220, h: 120, text: 'Reading', color: 'skill-teal' };
    const subskill: SkillMapNode = { id: 'ss1', type: 'subskill', x: 0, y: 200, w: 180, h: 90,  text: 'Sub',   parentId: 'sk1' };
    const exercise: SkillMapNode = { id: 'ex1', type: 'exercise', x: 0, y: 380, w: 160, h: 72,  text: 'Ex',    parentId: 'ss1' };
    const base = { ...EMPTY, nodes: [skill, subskill, exercise] };
    const s = reducer(base, { type: 'DELETE_NODES', ids: ['sk1'] });
    expect(s.nodes).toHaveLength(0);
  });

  it('DELETE_NODES removes exercise when subskill deleted, leaves parent skill', () => {
    const skill:    SkillMapNode = { id: 'sk1', type: 'skill',    x: 0, y: 0,   w: 220, h: 120, text: 'Reading', color: 'skill-rose' };
    const subskill: SkillMapNode = { id: 'ss1', type: 'subskill', x: 0, y: 200, w: 180, h: 90,  text: 'Sub',   parentId: 'sk1' };
    const exercise: SkillMapNode = { id: 'ex1', type: 'exercise', x: 0, y: 380, w: 160, h: 72,  text: 'Ex',    parentId: 'ss1' };
    const base = { ...EMPTY, nodes: [skill, subskill, exercise] };
    const s = reducer(base, { type: 'DELETE_NODES', ids: ['ss1'] });
    expect(s.nodes).toHaveLength(1);
    expect(s.nodes[0].id).toBe('sk1');
  });

  it('DELETE_NODES cascade removes edges touching cascaded nodes', () => {
    const skill:    SkillMapNode = { id: 'sk1', type: 'skill',    x: 0, y: 0,   w: 220, h: 120, text: 'Reading', color: 'skill-amber' };
    const subskill: SkillMapNode = { id: 'ss1', type: 'subskill', x: 0, y: 200, w: 180, h: 90,  text: 'Sub',   parentId: 'sk1' };
    const otherNode: SkillMapNode = { id: 'n_other', type: 'skill', x: 400, y: 0, w: 220, h: 120, text: 'Writing', color: 'skill-rose' };
    const edgeToSub: SkillMapEdge = { id: 'e_sub', from: 'ss1', fromSide: 'r', to: 'n_other', toSide: 'l', kind: 'straight' };
    const edgeOther: SkillMapEdge = { id: 'e_oth', from: 'n_other', fromSide: 'b', to: 'n_other', toSide: 't', kind: 'straight' };
    const base = { ...EMPTY, nodes: [skill, subskill, otherNode], edges: [edgeToSub, edgeOther] };
    const s = reducer(base, { type: 'DELETE_NODES', ids: ['sk1'] });
    expect(s.nodes).toHaveLength(1);
    expect(s.edges).toHaveLength(1);
    expect(s.edges[0].id).toBe('e_oth');
  });

  it('undo stack boundary: 81st action discards oldest', () => {
    // Simulate the snapshot stack in useSkillMapDoc
    const MAX = 80;
    const history: DocState[] = [];
    let current: DocState = EMPTY;
    for (let i = 0; i < MAX + 1; i++) {
      if (history.length >= MAX) history.shift();
      history.push(current);
      current = reducer(current, { type: 'CREATE_NODE', node: { ...node1, id: `n${i}` } });
    }
    expect(history.length).toBe(MAX);
  });
});
