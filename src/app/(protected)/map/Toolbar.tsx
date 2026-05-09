'use client';

export type Tool = 'select' | 'hand' | 'skill';

interface ToolbarProps {
  tool: Tool;
  onTool: (t: Tool) => void;
}

export default function Toolbar({ tool, onTool }: ToolbarProps) {
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

      {/* Add skill */}
      <button title="Add skill (S)" className={iconBtn(tool === 'skill')} onClick={() => onTool('skill')}>
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14"/>
        </svg>
      </button>
    </div>
  );
}
