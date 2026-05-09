'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onCancel();
  };

  const dialog = (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: open ? 'blur(8px)' : 'blur(0px)',
        WebkitBackdropFilter: open ? 'blur(8px)' : 'blur(0px)',
        opacity: open ? 1 : 0,
        transition: 'opacity 300ms ease-out, backdrop-filter 300ms ease-out, -webkit-backdrop-filter 300ms ease-out',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="premium-card p-10 max-w-md w-full shadow-2xl border-none"
        style={{
          transform: open ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(8px)',
          opacity: open ? 1 : 0,
          transition:
            'transform 400ms cubic-bezier(.7, 0, .2, 1), opacity 400ms cubic-bezier(.7, 0, .2, 1)',
          willChange: 'transform, opacity',
        }}
      >
        <h3
          id="confirm-dialog-title"
          className="text-2xl font-bold text-(--color-text-primary) heading tracking-tight"
        >
          {title}
        </h3>
        <p className="mt-4 text-sm font-medium text-(--color-text-tertiary) leading-relaxed">
          {message}
        </p>
        <div className="mt-10 flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 text-sm font-bold text-(--color-text-secondary) hover:text-(--color-text-primary) bg-(--color-bg-page) rounded-2xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 text-sm font-bold text-white bg-(--color-accent) hover:bg-(--color-accent-hover) rounded-2xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
