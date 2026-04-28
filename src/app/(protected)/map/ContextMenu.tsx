'use client';

import { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onAddSticky: () => void;
  onAddText: () => void;
  onAddShape: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onResetView: () => void;
  onClose: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export default function ContextMenu({
  x, y,
  onAddSticky, onAddText, onAddShape, onUndo, onRedo, onResetView, onClose,
  canUndo, canRedo,
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [onClose]);

  const item = 'w-full text-left px-3 py-2 text-sm rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed';

  const act = (fn: () => void) => { fn(); onClose(); };

  return (
    <div
      ref={ref}
      className="fixed z-[100] rounded-xl shadow-xl py-1 min-w-40"
      style={{
        left: x, top: y,
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <button className={item} onClick={() => act(onAddSticky)}>Add sticky note</button>
      <button className={item} onClick={() => act(onAddText)}>Add text</button>
      <button className={item} onClick={() => act(onAddShape)}>Add shape</button>
      <div className="my-1 h-px mx-2" style={{ background: 'var(--color-border)' }} />
      <button className={item} onClick={() => act(onUndo)} disabled={!canUndo}>Undo</button>
      <button className={item} onClick={() => act(onRedo)} disabled={!canRedo}>Redo</button>
      <div className="my-1 h-px mx-2" style={{ background: 'var(--color-border)' }} />
      <button className={item} onClick={() => act(onResetView)}>Reset view</button>
    </div>
  );
}
