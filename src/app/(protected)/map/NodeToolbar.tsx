'use client';

import { useState } from 'react';
import type { SkillMapNode } from '@/types/skillMap';
import { LEVELS, type Level } from '@/lib/onboarding/levels';
import { type SubskillStatus } from '@/lib/skillMap/schema';

const STATUS_OPTIONS: { value: SubskillStatus; label: string; color: string }[] = [
  { value: 'pending',     label: '○', color: '#94a3b8' },
  { value: 'in-progress', label: '◑', color: '#f59e0b' },
  { value: 'completed',   label: '✓', color: '#22c55e' },
];

const SKILL_COLORS = [
  { key: 'skill-indigo', fill: 'var(--skill-indigo)', label: 'Indigo' },
  { key: 'skill-teal',   fill: 'var(--skill-teal)',   label: 'Teal' },
  { key: 'skill-rose',   fill: 'var(--skill-rose)',   label: 'Rose' },
  { key: 'skill-amber',  fill: 'var(--skill-amber)',  label: 'Amber' },
] as const;

const FONT_SIZES = [
  { label: 'S', value: 12 },
  { label: 'M', value: 16 },
  { label: 'L', value: 22 },
] as const;

interface NodeToolbarProps {
  node: SkillMapNode;
  vp: { x: number; y: number; z: number };
  skillLevel: string | null;
  onPatchNode: (patch: Partial<SkillMapNode>) => void;
  onChangeSkillLevel: (level: Level) => void;
}

export default function NodeToolbar({ node, vp, skillLevel, onPatchNode, onChangeSkillLevel }: NodeToolbarProps) {
  const [levelOpen, setLevelOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const isSkill = node.type === 'skill';
  const currentColor = (node as { color?: string }).color ?? null;
  const currentFontSize = node.fontSize ?? 16;

  const left = vp.x + (node.x + node.w / 2) * vp.z;
  const top  = vp.y + node.y * vp.z;

  const stop = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const dividerStyle: React.CSSProperties = {
    width: 1,
    height: 20,
    background: 'var(--color-border)',
    flexShrink: 0,
  };

  const chipBase: React.CSSProperties = {
    padding: '3px 9px',
    borderRadius: 9999,
    border: '1.5px solid var(--color-border)',
    background: 'var(--color-bg-surface)',
    color: 'var(--color-text-primary)',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.12s ease',
    lineHeight: 1.4,
  };

  const chipActive: React.CSSProperties = {
    ...chipBase,
    background: 'var(--color-accent)',
    border: '1.5px solid var(--color-accent)',
    color: '#fff',
    boxShadow: 'var(--shadow-cta)',
  };

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        transform: 'translate(-50%, calc(-100% - 24px))',
        zIndex: 30,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--color-bg-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 9999,
        padding: '5px 10px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        whiteSpace: 'nowrap',
      }}
      onMouseDown={stop}
      onClick={stop}
    >
      {/* Color swatches — skill and exercise nodes only */}
      {node.type !== 'subskill' && (
        <>
          {SKILL_COLORS.map(({ key, fill, label }) => (
            <button
              key={key}
              title={label}
              type="button"
              onClick={(e) => { e.stopPropagation(); onPatchNode({ color: key } as Partial<SkillMapNode>); }}
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: fill,
                border: currentColor === key ? '2.5px solid var(--color-accent)' : '2px solid rgba(0,0,0,0.15)',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'border 0.12s ease',
              }}
            />
          ))}
          <div style={dividerStyle} />
        </>
      )}

      {/* Font size chips — all node types */}
      {FONT_SIZES.map(({ label, value }) => (
        <button
          key={value}
          type="button"
          onClick={(e) => { e.stopPropagation(); onPatchNode({ fontSize: value } as Partial<SkillMapNode>); }}
          style={currentFontSize === value ? chipActive : chipBase}
        >
          {label}
        </button>
      ))}

      {/* Status picker — subskill nodes only */}
      {node.type === 'subskill' && (
        <>
          <div style={dividerStyle} />
          <div style={{ position: 'relative' }}>
            {(() => {
              const current = STATUS_OPTIONS.find(o => o.value === (node as { status?: string }).status);
              return (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setStatusOpen((o) => !o); }}
                  style={{
                    ...chipBase,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: current ? current.color : 'var(--color-text-secondary)',
                    background: statusOpen ? 'var(--color-bg-muted)' : 'var(--color-bg-surface)',
                  }}
                >
                  {current ? current.label : '—'}
                  <span style={{ fontSize: 8, opacity: 0.6 }}>▼</span>
                </button>
              );
            })()}

            {statusOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 6px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--color-bg-surface)',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: 12,
                  padding: '6px 8px',
                  display: 'flex',
                  gap: 4,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  zIndex: 31,
                }}
                onMouseDown={stop}
                onClick={stop}
              >
                {STATUS_OPTIONS.map(({ value, label, color }) => {
                  const active = (node as { status?: string }).status === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      title={value}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPatchNode({ status: value } as Partial<SkillMapNode>);
                        setStatusOpen(false);
                      }}
                      style={{
                        ...chipBase,
                        color: active ? '#fff' : color,
                        background: active ? color : 'var(--color-bg-surface)',
                        border: `1.5px solid ${active ? color : 'var(--color-border)'}`,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Skill level — skill nodes only */}
      {isSkill && (
        <>
          <div style={dividerStyle} />
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLevelOpen((o) => !o); }}
              style={{
                ...chipBase,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: levelOpen ? 'var(--color-bg-muted)' : 'var(--color-bg-surface)',
              }}
            >
              {skillLevel ?? '—'}
              <span style={{ fontSize: 8, opacity: 0.6 }}>▼</span>
            </button>

            {levelOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 6px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--color-bg-surface)',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: 12,
                  padding: '6px 8px',
                  display: 'flex',
                  gap: 4,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  zIndex: 31,
                }}
                onMouseDown={stop}
                onClick={stop}
              >
                {LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeSkillLevel(level);
                      setLevelOpen(false);
                    }}
                    style={skillLevel === level ? chipActive : chipBase}
                  >
                    {level}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
