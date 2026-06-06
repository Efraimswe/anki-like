'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  title: string;
  placeholder?: string;
  initialValue?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

export default function CreateDeckDialog({
  title,
  placeholder,
  initialValue = '',
  submitLabel = 'Create',
  cancelLabel = 'Cancel',
  onSubmit,
  onCancel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setOpen(true);
      inputRef.current?.focus();
    });
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
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
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-deck-title"
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
          id="create-deck-title"
          className="text-2xl font-bold text-(--color-text-primary) heading tracking-tight"
        >
          {title}
        </h3>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={placeholder}
          className="mt-6 w-full px-5 py-4 bg-(--color-bg-page) rounded-2xl font-medium focus:ring-2 focus:ring-(--color-accent-ring) outline-none transition-all placeholder:text-(--color-text-tertiary)/50"
        />
        <div className="mt-10 flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 text-sm font-bold text-(--color-text-secondary) hover:text-(--color-text-primary) bg-(--color-bg-page) rounded-2xl transition-all"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="btn-3d btn-green flex-1"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );

  return createPortal(dialog, document.body);
}
