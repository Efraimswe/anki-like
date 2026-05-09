'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/hooks/use-auth';
import { getLanguageByCode } from '@/lib/onboarding/languages';
import { useTranslations } from 'next-intl';

type ButtonPosition = {
  top: number;
  left: number;
};

type Translation = { text: string; match: number };

type TranslationModalState = {
  originalText: string;
  main: Translation | null;
  alternatives: Translation[];
  loading: boolean;
  error: string;
} | null;

function getSelectionText() {
  return window.getSelection()?.toString().trim() ?? '';
}

function isSelectableTextActive() {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return false;
  }

  return getSelectionText().length > 0;
}

export default function SelectionTranslateOverlay() {
  const [mounted, setMounted] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [buttonPosition, setButtonPosition] = useState<ButtonPosition | null>(null);
  const [modalState, setModalState] = useState<TranslationModalState>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { user } = useAuth();
  const nativeCode = user?.nativeLanguage ?? null;
  const nativeLabel = nativeCode ? (getLanguageByCode(nativeCode)?.name ?? nativeCode) : '';
  const t = useTranslations('translate');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return undefined;
    }

    const updateSelection = () => {
      if (modalState) {
        return;
      }

      const selection = window.getSelection();
      const nextText = getSelectionText();

      if (!selection || selection.rangeCount === 0 || selection.isCollapsed || !nextText) {
        setSelectedText('');
        setButtonPosition(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width === 0 && rect.height === 0) {
        setSelectedText('');
        setButtonPosition(null);
        return;
      }

      setSelectedText(nextText);
      setButtonPosition({
        top: Math.max(12, rect.top - 52),
        left: Math.min(window.innerWidth - 132, Math.max(12, rect.left + rect.width / 2 - 56)),
      });
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (buttonRef.current?.contains(event.target as Node)) {
        return;
      }

      if (modalState) {
        return;
      }

      window.requestAnimationFrame(() => {
        if (!isSelectableTextActive()) {
          setSelectedText('');
          setButtonPosition(null);
        }
      });
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      setModalState(null);
      setSelectedText('');
      setButtonPosition(null);
      window.getSelection()?.removeAllRanges();
    };

    document.addEventListener('selectionchange', updateSelection);
    document.addEventListener('pointerup', updateSelection);
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('scroll', updateSelection, true);
    window.addEventListener('resize', updateSelection);
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('selectionchange', updateSelection);
      document.removeEventListener('pointerup', updateSelection);
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('scroll', updateSelection, true);
      window.removeEventListener('resize', updateSelection);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [modalState, mounted]);

  if (!mounted) {
    return null;
  }

  const openModal = async () => {
    if (!selectedText || !nativeCode) return;

    const today = new Date().toISOString().slice(0, 10);
    let quota = { date: today, chars: 0 };
    try {
      const raw = localStorage.getItem('mm_translate_quota');
      if (raw) {
        const parsed = JSON.parse(raw) as { date: string; chars: number };
        if (parsed.date === today) quota = parsed;
      }
    } catch { /* ignore malformed json */ }

    if (quota.chars + selectedText.length > 5000) {
      setModalState({
        originalText: selectedText,
        main: null,
        alternatives: [],
        loading: false,
        error: t('limitReached'),
      });
      setButtonPosition(null);
      return;
    }

    setModalState({ originalText: selectedText, main: null, alternatives: [], loading: true, error: '' });
    setButtonPosition(null);

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(selectedText)}&langpair=en|${nativeCode}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`MyMemory ${res.status}`);
      const data = await res.json() as {
        responseData?: { translatedText?: string; match?: number | string };
        matches?: Array<{ translation?: string; match?: number | string }> | null;
        responseStatus?: number;
        quotaFinished?: boolean;
      };

      if (data.quotaFinished || data.responseStatus === 429) {
        throw new Error(t('limitReached'));
      }

      const mainText: string = data?.responseData?.translatedText ?? '';
      const mainMatch: number =
        typeof data?.responseData?.match === 'number'
          ? data.responseData.match
          : parseFloat(String(data?.responseData?.match ?? '0')) || 0;
      if (!mainText) throw new Error('No translation returned');

      const alternatives: Translation[] = (Array.isArray(data?.matches) ? data.matches : [])
        .map((m) => ({
          text: typeof m.translation === 'string' ? m.translation.trim() : '',
          match: typeof m.match === 'number' ? m.match : parseFloat(String(m.match ?? '0')) || 0,
        }))
        .filter((m) => m.text && m.text.toLowerCase() !== mainText.trim().toLowerCase())
        .filter((m, i, arr) => arr.findIndex((x) => x.text.toLowerCase() === m.text.toLowerCase()) === i)
        .sort((a, b) => b.match - a.match)
        .slice(0, 3);

      quota = { date: today, chars: quota.chars + selectedText.length };
      try { localStorage.setItem('mm_translate_quota', JSON.stringify(quota)); } catch { /* ignore */ }

      setModalState((current) => {
        if (!current || current.originalText !== selectedText) return current;
        return {
          originalText: current.originalText,
          main: { text: mainText.trim(), match: mainMatch },
          alternatives,
          loading: false,
          error: '',
        };
      });
    } catch (error) {
      setModalState((current) => {
        if (!current || current.originalText !== selectedText) return current;
        return {
          originalText: current.originalText,
          main: null,
          alternatives: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Translation failed',
        };
      });
    }
  };

  const closeModal = () => {
    setModalState(null);
    setSelectedText('');
    setButtonPosition(null);
    window.getSelection()?.removeAllRanges();
  };

  return createPortal(
    <>
      {buttonPosition && nativeCode ? (
        <button
          ref={buttonRef}
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={openModal}
          className="fixed z-[80] rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-transform hover:scale-[1.03] hover:bg-orange-600"
          style={{ top: buttonPosition.top, left: buttonPosition.left }}
        >
          {t('buttonLabel')}
        </button>
      ) : null}

      {modalState ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/20 p-6" onClick={closeModal}>
          <div
            className="w-full max-w-xl rounded-[28px] bg-white px-8 py-7 text-center shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-(--color-text-muted)">Selected text</p>
            <p className="mt-4 text-2xl font-semibold leading-snug text-black">{modalState.originalText}</p>
            <div className="mt-6 rounded-3xl bg-neutral-100 px-6 py-5 text-left">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">{nativeLabel}</p>
              {modalState.loading ? (
                <p className="mt-3 text-base font-medium text-neutral-500">{t('translating')}</p>
              ) : modalState.error ? (
                <p className="mt-3 text-base font-medium text-red-500">{modalState.error}</p>
              ) : modalState.main ? (
                <div className="mt-3 space-y-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-xl font-semibold leading-relaxed text-black">{modalState.main.text}</p>
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                      {Math.round(modalState.main.match * 100)}%
                    </span>
                  </div>
                  {modalState.alternatives.length > 0 && (
                    <ul className="space-y-2 border-t border-neutral-200 pt-3">
                      {modalState.alternatives.map((alt, i) => (
                        <li key={`${alt.text}-${i}`} className="flex items-baseline justify-between gap-3">
                          <span className="text-base font-medium text-neutral-700">{alt.text}</span>
                          <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                            {Math.round(alt.match * 100)}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
              <p className="mt-5 text-[11px] font-medium text-neutral-400">{t('disclosure')}</p>
            </div>
          </div>
        </div>
      ) : null}
    </>,
    document.body,
  );
}
