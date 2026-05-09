'use client';

import { useRef, useState, useEffect } from 'react';
import type { SkillMapNode, Side } from '@/types/skillMap';
import { type SubskillStatus } from '@/lib/skillMap/schema';

const STATUS_LABEL: Record<SubskillStatus, string> = {
  'pending':     '○ Pending',
  'in-progress': '◑ In progress',
  'completed':   '✓ Done',
};
const STATUS_COLOR: Record<SubskillStatus, string> = {
  'pending':     '#94a3b8',
  'in-progress': '#f59e0b',
  'completed':   '#22c55e',
};

const SKILL_FILLS: Record<string, string> = {
  'skill-indigo': 'var(--skill-indigo)',
  'skill-teal':   'var(--skill-teal)',
  'skill-rose':   'var(--skill-rose)',
  'skill-amber':  'var(--skill-amber)',
};

const SIDES: Side[] = ['t', 'r', 'b', 'l'];

interface NodeViewProps {
  node: SkillMapNode;
  selected: boolean;
  editing: boolean;
  showSpawnArrows: boolean;
  skillLevel: string | null;
  onSelect: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onTextCommit: (text: string) => void;
  onResizeStart: (corner: string, e: React.MouseEvent) => void;
  onSpawnChild: (side: Side, e: React.MouseEvent) => void;
  zoom: number;
}

export default function NodeView({
  node, selected, editing, showSpawnArrows, skillLevel,
  onSelect, onMouseDown, onDoubleClick, onTextCommit,
  onResizeStart, onSpawnChild, zoom,
}: NodeViewProps) {
  const textRef = useRef<HTMLDivElement>(null);
  const [localText, setLocalText] = useState(node.text);

  useEffect(() => { setLocalText(node.text); }, [node.text]);

  const isSkill    = node.type === 'skill';
  const isSubskill = node.type === 'subskill';
  const isExercise = node.type === 'exercise'; // used for bg and badge

  useEffect(() => {
    if (editing && !isSkill && textRef.current) {
      if (textRef.current.innerText !== node.text) {
        textRef.current.innerText = node.text;
      }
      textRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(textRef.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  // node.text intentionally excluded — we only want this on editing toggle
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, isSkill]);

  const commit = () => {
    const text = textRef.current?.innerText ?? localText;
    onTextCommit(text);
  };

  const nodeColor = (node as { color?: string }).color;
  const nodeStatus = (node as { status?: SubskillStatus }).status;

  const SUBSKILL_STATUS_BG: Record<SubskillStatus, string> = {
    'pending':     '#f1f5f9',
    'in-progress': '#fef9c3',
    'completed':   '#dcfce7',
  };

  const bg = isSkill
    ? SKILL_FILLS[nodeColor ?? ''] ?? SKILL_FILLS['skill-indigo']
    : isSubskill
      ? (nodeStatus ? SUBSKILL_STATUS_BG[nodeStatus] : '#dbeafe')
      : nodeColor
        ? SKILL_FILLS[nodeColor] ?? '#ede9fe'
        : '#ede9fe';

  const arrowPos = (side: Side): React.CSSProperties => {
    const off = 14;
    switch (side) {
      case 't': return { top: -off, left: '50%', transform: 'translate(-50%, -50%)' };
      case 'b': return { bottom: -off, left: '50%', transform: 'translate(-50%, 50%)' };
      case 'l': return { left: -off, top: '50%', transform: 'translate(-50%, -50%)' };
      case 'r': return { right: -off, top: '50%', transform: 'translate(50%, -50%)' };
    }
  };

  const corners = ['nw', 'ne', 'se', 'sw'];
  const cornerPos = (c: string): React.CSSProperties => {
    switch (c) {
      case 'nw': return { top: -5, left: -5 };
      case 'ne': return { top: -5, right: -5 };
      case 'se': return { bottom: -5, right: -5 };
      case 'sw': return { bottom: -5, left: -5 };
    }
    return {};
  };
  const cornerCursor: Record<string, string> = {
    nw: 'nw-resize', ne: 'ne-resize', se: 'se-resize', sw: 'sw-resize'
  };

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: node.x,
    top: node.y,
    width: node.w,
    height: node.h,
    userSelect: editing ? 'text' : 'none',
    outline: selected ? '2px solid var(--color-accent)' : 'none',
    outlineOffset: -4,
    borderRadius: 12,
    background: bg,
    border: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'box-shadow 150ms',
    cursor: editing ? 'text' : 'default',
    zIndex: 1,
  };

  const badge = (label: string, color: string) => (
    <div style={{
      position: 'absolute',
      top: 6, left: 8,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
      color,
      background: 'rgba(0,0,0,0.08)',
      borderRadius: 3,
      padding: '1px 5px',
      pointerEvents: 'none' as const,
      userSelect: 'none' as const,
    }}>
      {label}
    </div>
  );

  const badgeLabel = isSkill ? 'skill' : isSubskill ? 'sub' : 'ex';
  const badgeColor = isSkill ? '#4f46e5' : isSubskill ? '#1d4ed8' : '#6d28d9';

  const renderContent = () => (
    <>
      {badge(badgeLabel, badgeColor)}
      {isSkill && (
        <div style={{
          position: 'absolute',
          top: 6, right: 8,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          color: '#1e293b',
          background: 'rgba(255,255,255,0.55)',
          borderRadius: 4,
          padding: '1px 6px',
          pointerEvents: 'none' as const,
          userSelect: 'none' as const,
        }}>
          {skillLevel ?? '—'}
        </div>
      )}
      {isSubskill && (node as { status?: SubskillStatus }).status && (() => {
        const s = (node as { status: SubskillStatus }).status;
        return (
          <div style={{
            position: 'absolute',
            bottom: 6, right: 8,
            fontSize: 9, fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.05em',
            color: STATUS_COLOR[s],
            background: 'rgba(255,255,255,0.7)',
            borderRadius: 3,
            padding: '1px 5px',
            pointerEvents: 'none' as const,
            userSelect: 'none' as const,
          }}>
            {STATUS_LABEL[s]}
          </div>
        );
      })()}
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 8, boxSizing: 'border-box',
      }}>
        <div
          ref={textRef}
          contentEditable={editing && !isSkill}
          suppressContentEditableWarning
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); commit(); } }}
          style={{
            width: '100%',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: node.fontSize ?? 16, fontWeight: 700,
            color: '#1e293b',
            outline: 'none', userSelect: editing ? 'text' : 'none',
            wordBreak: 'break-word', whiteSpace: 'pre-wrap',
            textAlign: 'center', minHeight: '1em',
          }}
        >
          {editing ? undefined : node.text}
        </div>
      </div>
    </>
  );

  return (
    <div
      style={containerStyle}
      onClick={onSelect}
      onMouseDown={(e) => {
        if (editing) return;
        onMouseDown(e);
      }}
      onDoubleClick={() => { if (!editing && !isSkill) onDoubleClick(); }}
    >
      {renderContent()}

      {/* Resize corners */}
      {selected && !editing && corners.map((c) => (
        <div
          key={c}
          style={{
            position: 'absolute',
            ...cornerPos(c),
            width: 12, height: 12,
            borderRadius: '50%',
            background: 'var(--color-accent)',
            border: '2px solid white',
            cursor: cornerCursor[c],
            zIndex: 21,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onResizeStart(c, e);
          }}
        />
      ))}

      {/* Spawn buttons (Skill → Subskill, Subskill → Exercise) */}
      {showSpawnArrows && !editing && SIDES.map((side) => (
        <button
          key={side}
          title="Add child"
          style={{
            position: 'absolute',
            ...arrowPos(side),
            width: 22, height: 22,
            borderRadius: '50%',
            background: '#dbeafe',
            border: '2px solid #3b82f6',
            color: '#3b82f6',
            cursor: 'pointer',
            zIndex: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onSpawnChild(side, e);
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      ))}
    </div>
  );
}
