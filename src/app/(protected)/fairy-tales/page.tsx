'use client';

import { useState, useRef } from 'react';

interface Character {
  id: string;
  name: string;
  description: string;
}

interface TaleBrief {
  setting: string;
  premise: string;
  conflict: string;
  tone: string;
}

const MAX_CHARACTERS = 15;

const inputCls =
  'w-full px-4 py-3 bg-(--color-bg-page) border border-(--color-border) rounded-2xl text-sm font-medium text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:ring-2 focus:ring-(--color-accent-ring) outline-none transition-all';

const textareaCls =
  'w-full px-4 py-3 bg-(--color-bg-page) border border-(--color-border) rounded-2xl text-sm font-medium text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:ring-2 focus:ring-(--color-accent-ring) outline-none transition-all resize-none';

const labelCls =
  'block text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted) mb-2';

export default function FairyTalesPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [brief, setBrief] = useState<TaleBrief>({ setting: '', premise: '', conflict: '', tone: '' });
  const [output, setOutput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [charactersOpen, setCharactersOpen] = useState(true);
  const [briefOpen, setBriefOpen] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const addCharacter = () => {
    if (characters.length >= MAX_CHARACTERS) return;
    setCharacters((prev) => [...prev, { id: crypto.randomUUID(), name: '', description: '' }]);
  };

  const removeCharacter = (id: string) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCharacter = (id: string, field: 'name' | 'description', value: string) => {
    setCharacters((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handleAutofill = async () => {
    setIsAutofilling(true);
    try {
      const res = await fetch('/api/fairy-tales/autofill', { method: 'POST' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.characters) {
        setCharacters(
          (data.characters as { name: string; description: string }[]).map((c) => ({
            id: crypto.randomUUID(),
            name: c.name ?? '',
            description: c.description ?? '',
          })),
        );
      }
      if (data.brief) {
        setBrief({
          setting: data.brief.setting ?? '',
          premise: data.brief.premise ?? '',
          conflict: data.brief.conflict ?? '',
          tone: data.brief.tone ?? '',
        });
      }
    } finally {
      setIsAutofilling(false);
    }
  };

  const validCharacters = characters.filter((c) => c.name.trim());
  const canGenerate = validCharacters.length > 0 && brief.premise.trim().length > 0 && !isStreaming;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setOutput('');
    setError(null);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/fairy-tales/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characters: validCharacters.map((c) => ({ name: c.name.trim(), description: c.description.trim() })),
          brief: { setting: brief.setting.trim(), premise: brief.premise.trim(), conflict: brief.conflict.trim(), tone: brief.tone.trim() },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        setError((await res.text()) || `Error ${res.status}`);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((prev) => {
          const next = prev + decoder.decode(value);
          setTimeout(() => outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: 'smooth' }), 0);
          return next;
        });
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') setError(err.message || 'Something went wrong');
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => abortRef.current?.abort();

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-(--color-text-primary) tracking-tight heading">
            Fairy Tales
          </h1>
          <p className="text-sm text-(--color-text-secondary) mt-1 font-medium">
            Build your cast and story brief — Gemini writes the rest.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAutofill}
          disabled={isAutofilling || isStreaming}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border border-(--color-accent) text-(--color-accent) text-sm font-semibold hover:bg-(--color-accent-muted) disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {isAutofilling ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-(--color-accent) border-t-transparent animate-spin" />
              Filling…
            </>
          ) : (
            <>✦ Autofill with AI</>
          )}
        </button>
      </div>

      {/* Characters */}
      <div className="premium-card overflow-hidden">
        <button
          type="button"
          onClick={() => setCharactersOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 md:px-6 py-4 hover:bg-(--color-bg-surface-hover) transition-colors"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-(--color-text-primary) heading">Characters</h2>
            <span className="text-xs font-semibold text-(--color-text-muted) tabular-nums">
              {characters.length} / {MAX_CHARACTERS}
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-(--color-text-muted) transition-transform duration-200 ${charactersOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {charactersOpen && (
          <div className="px-5 md:px-6 pb-5 md:pb-6 space-y-4 border-t border-(--color-border)">
            <div className="pt-4 space-y-3">
              {characters.length === 0 && (
                <p className="text-sm text-(--color-text-muted)">No characters yet. Add one to get started.</p>
              )}
              {characters.map((char, idx) => (
                <div key={char.id} className="group relative rounded-2xl bg-(--color-bg-page) border border-(--color-border) p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted)">
                      Character {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCharacter(char.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl text-(--color-text-muted) hover:text-(--color-danger) hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                      aria-label="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div>
                    <label className={labelCls}>Name <span className="text-(--color-accent)">*</span></label>
                    <input
                      type="text"
                      value={char.name}
                      onChange={(e) => updateCharacter(char.id, 'name', e.target.value)}
                      placeholder="e.g. Princess Elara"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea
                      rows={2}
                      value={char.description}
                      onChange={(e) => updateCharacter(char.id, 'description', e.target.value)}
                      placeholder="e.g. A brave young princess who speaks to animals"
                      className={textareaCls}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addCharacter}
              disabled={characters.length >= MAX_CHARACTERS}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-(--color-border) text-sm font-semibold text-(--color-text-primary) hover:border-(--color-border-strong) hover:bg-(--color-bg-surface-hover) disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add character
            </button>
          </div>
        )}
      </div>

      {/* Tale Brief */}
      <div className="premium-card overflow-hidden">
        <button
          type="button"
          onClick={() => setBriefOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 md:px-6 py-4 hover:bg-(--color-bg-surface-hover) transition-colors"
        >
          <h2 className="text-sm font-bold text-(--color-text-primary) heading">Tale Brief</h2>
          <svg
            className={`w-4 h-4 text-(--color-text-muted) transition-transform duration-200 ${briefOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {briefOpen && (
          <div className="px-5 md:px-6 pb-5 md:pb-6 space-y-4 border-t border-(--color-border)">
            <div className="pt-4">
              <label className={labelCls}>Premise / Gist <span className="text-(--color-accent)">*</span></label>
              <textarea
                rows={3}
                value={brief.premise}
                onChange={(e) => setBrief((b) => ({ ...b, premise: e.target.value }))}
                placeholder="What is your story about? e.g. A girl discovers a hidden portal in the old library that leads to a land made entirely of books."
                className={textareaCls}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Setting</label>
                <textarea
                  rows={2}
                  value={brief.setting}
                  onChange={(e) => setBrief((b) => ({ ...b, setting: e.target.value }))}
                  placeholder="Where & when? e.g. A foggy seaside kingdom in the middle ages"
                  className={textareaCls}
                />
              </div>
              <div>
                <label className={labelCls}>Main conflict</label>
                <textarea
                  rows={2}
                  value={brief.conflict}
                  onChange={(e) => setBrief((b) => ({ ...b, conflict: e.target.value }))}
                  placeholder="Central challenge? e.g. The kingdom's magic is fading"
                  className={textareaCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Tone / Vibe</label>
              <input
                type="text"
                value={brief.tone}
                onChange={(e) => setBrief((b) => ({ ...b, tone: e.target.value }))}
                placeholder="e.g. whimsical, dark fairy tale, adventurous, comedic"
                className={inputCls}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="button-primary px-8 py-3 shadow-xl shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
        >
          {isStreaming ? 'Generating…' : 'Generate story'}
        </button>

        {isStreaming && (
          <button
            type="button"
            onClick={handleStop}
            className="px-5 py-3 rounded-full border border-(--color-border) text-sm font-semibold text-(--color-text-secondary) hover:border-(--color-border-strong) hover:bg-(--color-bg-surface-hover) transition-all"
          >
            Stop
          </button>
        )}

        {!canGenerate && !isStreaming && (
          <p className="text-xs text-(--color-text-muted) font-medium">
            {characters.length === 0
              ? 'Add at least one character first.'
              : validCharacters.length === 0
                ? 'Give at least one character a name.'
                : 'Fill in the premise to continue.'}
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-4 py-3 text-sm font-medium text-(--color-danger)">
          {error}
        </div>
      )}

      {/* Output */}
      {(output || isStreaming) && (
        <div className="premium-card p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-(--color-text-primary) heading">Story</h2>
            {isStreaming && (
              <span className="w-2 h-2 rounded-full bg-(--color-accent) animate-pulse" />
            )}
          </div>
          <div
            ref={outputRef}
            className="max-h-[520px] overflow-y-auto text-[0.93rem] leading-[1.85] text-(--color-text-primary) whitespace-pre-wrap"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {output}
            {isStreaming && !output && (
              <span className="text-(--color-text-muted)">Writing your story…</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
