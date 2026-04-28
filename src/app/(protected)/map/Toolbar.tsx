'use client';

import type { SkillName } from '@/types/skillMap';

export type Tool = 'select' | 'hand' | 'skill';

const SKILL_NAMES: SkillName[] = ['Reading', 'Listening', 'Writing', 'Speaking'];

const SKILL_NAME_TO_HEX: Record<SkillName, string> = {
  Reading:   '#C7D2FE',
  Listening: '#99F6E4',
  Writing:   '#FECDD3',
  Speaking:  '#FDE68A',
};

interface ToolbarProps {
  tool: Tool;
  skillName: SkillName;
  onTool: (t: Tool) => void;
  onSkillName: (n: SkillName) => void;
}

export default function Toolbar({ tool, skillName, onTool, onSkillName }: ToolbarProps) {
  const iconBtn = (active: boolean) =>
    `w-10 h-10 rounded-xl flex items-center justify-center transition-all text-sm
    ${active
      ? 'bg-orange-100 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400'
      : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10'}`;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-3 py-2 rounded-[14px] shadow-xl"
      style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}
    >
      {/* Select */}
      <button title="Select (V)" className={iconBtn(tool === 'select')} onClick={() => onTool('select')}>
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4l7 18 3-7 7-3L4 4z"/>
        </svg>
      </button>

      {/* Hand */}
      <button title="Hand (H)" className={iconBtn(tool === 'hand')} onClick={() => onTool('hand')}>
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a2 2 0 0 1 4 0v4m0-4V5a2 2 0 0 1 4 0v6m0-4a2 2 0 0 1 4 0v7a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6v-3a2 2 0 0 1 2-2h1"/>
        </svg>
      </button>

      <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1" />

      {/* Skill buttons — one per canonical name */}
      {SKILL_NAMES.map((name) => (
        <button
          key={name}
          title={name}
          className={`flex items-center gap-1.5 h-10 px-3 rounded-xl transition-all text-sm font-medium
            ${tool === 'skill' && skillName === name
              ? 'bg-orange-100 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400'
              : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10'}`}
          onClick={() => { onTool('skill'); onSkillName(name); }}
        >
          <span
            className="w-3 h-3 rounded-full shrink-0 border border-black/10"
            style={{ background: SKILL_NAME_TO_HEX[name] }}
          />
          {name}
        </button>
      ))}
    </div>
  );
}
