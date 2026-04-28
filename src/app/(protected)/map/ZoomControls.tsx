'use client';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export default function ZoomControls({ zoom, onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
  const btn = 'w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300';
  return (
    <div
      className="fixed bottom-6 right-6 z-10000 flex items-center gap-1 px-2 py-1 rounded-[14px] shadow-lg"
      style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}
    >
      <button className={btn} onClick={onZoomOut} title="Zoom out">–</button>
      <button
        className="px-2 h-8 text-xs font-bold tracking-tight rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-gray-600 dark:text-gray-300"
        style={{ fontFamily: "'JetBrains Mono', monospace", minWidth: 48 }}
        onClick={onReset}
        title="Reset zoom"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button className={btn} onClick={onZoomIn} title="Zoom in">+</button>
    </div>
  );
}
