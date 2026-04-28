import type { SkillMapNode, SkillMapEdge } from './schema';

export const SAMPLE_NODES: SkillMapNode[] = [
  { id: 'n_sk_reading',   type: 'skill', x:  60, y:  60, w: 220, h: 120, text: 'Reading',   color: 'skill-indigo' },
  { id: 'n_sk_listening', type: 'skill', x: 360, y:  60, w: 220, h: 120, text: 'Listening', color: 'skill-teal'   },
  { id: 'n_sk_writing',   type: 'skill', x:  60, y: 240, w: 220, h: 120, text: 'Writing',   color: 'skill-rose'   },
  { id: 'n_sk_speaking',  type: 'skill', x: 360, y: 240, w: 220, h: 120, text: 'Speaking',  color: 'skill-amber'  },

  { id: 'n_ss_meetings',  type: 'subskill', x: 360, y: 420, w: 180, h: 90, text: 'Work meetings',         parentId: 'n_sk_speaking' },
  { id: 'n_ex_standup',   type: 'exercise', x: 360, y: 560, w: 180, h: 72, text: 'Lead a 10-min standup', parentId: 'n_ss_meetings' },
];

export const SAMPLE_EDGES: SkillMapEdge[] = [];

export const SAMPLE_TITLE = 'My Language Skill Map';
