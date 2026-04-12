'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchApi } from '@/hooks/use-auth';

type ButtonPosition = {
  top: number;
  left: number;
};

type TranslationModalState = {
  originalText: string;
  translation: string;
  loading: boolean;
  error: string;
} | null;

const APP_NAME = 'Anki-Like';
const NATIVE_LANGUAGE = 'Russian';

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
    if (!selectedText) {
      return;
    }

    setModalState({
      originalText: selectedText,
      translation: '',
      loading: true,
      error: '',
    });
    setButtonPosition(null);

    try {
      const response = await fetchApi<{ translation: string }>('/api/translate', {
        method: 'POST',
        body: JSON.stringify({
          text: selectedText,
          appName: APP_NAME,
          nativeLanguage: NATIVE_LANGUAGE,
        }),
      });

      setModalState((current) => {
        if (!current || current.originalText !== selectedText) {
          return current;
        }

        return {
          originalText: current.originalText,
          translation: response.translation,
          loading: false,
          error: '',
        };
      });
    } catch (error) {
      setModalState((current) => {
        if (!current || current.originalText !== selectedText) {
          return current;
        }

        return {
          originalText: current.originalText,
          translation: '',
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
      {buttonPosition ? (
        <button
          ref={buttonRef}
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={openModal}
          className="fixed z-[80] rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-transform hover:scale-[1.03] hover:bg-orange-600"
          style={{ top: buttonPosition.top, left: buttonPosition.left }}
        >
          Translate
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
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">{NATIVE_LANGUAGE}</p>
              {modalState.loading ? (
                <p className="mt-3 text-base font-medium text-neutral-500">Translating...</p>
              ) : modalState.error ? (
                <p className="mt-3 text-base font-medium text-red-500">{modalState.error}</p>
              ) : (
                <p className="mt-3 text-xl font-semibold leading-relaxed text-black">{modalState.translation}</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>,
    document.body,
  );
}
