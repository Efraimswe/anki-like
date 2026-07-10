'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import GoalLabel from './GoalLabel';

const AUTOSAVE_MS = 500;

interface Props {
  value: string;
  completed: boolean;
  onSave: (title: string) => void;
  className?: string;
  ariaLabel: string;
}

export default function EditableGoalTitle({
  value,
  completed,
  onSave,
  className,
  ariaLabel,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const lastSavedRef = useRef(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (editing) {
      const el = inputRef.current;
      el?.focus();
      el?.setSelectionRange(el.value.length, el.value.length);
    } else {
      triggerRef.current?.focus();
    }
  }, [editing]);

  // Auto-grow: textarea height always matches the wrapped content,
  // so the edit field occupies exactly the same lines as the displayed text.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!editing || !el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [editing, draft]);

  const saveIfChanged = (text: string) => {
    const t = text.trim();
    if (t && t !== lastSavedRef.current) {
      lastSavedRef.current = t;
      onSave(t);
    }
  };

  // Debounced autosave: persist AUTOSAVE_MS after the last keystroke.
  useEffect(() => {
    if (!editing) return;
    timerRef.current = setTimeout(() => saveIfChanged(draft), AUTOSAVE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, editing]);

  const startEdit = () => {
    setDraft(value);
    lastSavedRef.current = value;
    setEditing(true);
  };

  const stopEdit = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    saveIfChanged(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className={`plan-edit-title${className ? ` ${className}` : ''}`}>
        <textarea
          ref={inputRef}
          rows={1}
          className="plan-input plan-edit-textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={stopEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              stopEdit();
            }
            if (e.key === 'Escape') stopEdit();
          }}
        />
      </div>
    );
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      className="goal-title-trigger"
      aria-label={`${ariaLabel}: ${value}`}
      onClick={startEdit}
    >
      <GoalLabel text={value} completed={completed} className={className} />
    </button>
  );
}
