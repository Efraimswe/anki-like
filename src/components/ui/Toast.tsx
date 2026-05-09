'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { Check, X, AlertTriangle, Info, AlertCircle, type LucideIcon } from 'lucide-react';

gsap.registerPlugin(Flip);

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
}

interface ToastInput {
  type?: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

const ICONS: Record<ToastType, LucideIcon> = {
  success: Check,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const ACCENT: Record<ToastType, string> = {
  success: 'var(--color-success)',
  error: 'var(--color-danger)',
  warning: '#f59e0b',
  info: 'var(--color-accent)',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [mounted, setMounted] = useState(false);
  const elementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const pendingFlipRef = useRef<ReturnType<typeof Flip.getState> | null>(null);

  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: string) => {
    const el = elementsRef.current.get(id);
    if (!el) {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      return;
    }

    const remaining = Array.from(elementsRef.current.entries())
      .filter(([k]) => k !== id)
      .map(([, v]) => v);
    pendingFlipRef.current = Flip.getState(remaining);

    gsap.to(el, {
      x: 120,
      opacity: 0,
      duration: 0.35,
      ease: 'power3.in',
      overwrite: true,
      onComplete: () => {
        elementsRef.current.delete(id);
        setToasts((prev) => prev.filter((t) => t.id !== id));
      },
    });
  }, []);

  useLayoutEffect(() => {
    if (!pendingFlipRef.current) return;
    Flip.from(pendingFlipRef.current, {
      duration: 0.45,
      ease: 'power3.out',
    });
    pendingFlipRef.current = null;
  }, [toasts]);

  const toast = useCallback((input: ToastInput) => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [
      ...prev,
      {
        id,
        type: input.type ?? 'success',
        title: input.title,
        description: input.description,
        duration: input.duration ?? 4000,
      },
    ]);
    return id;
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {mounted &&
        createPortal(
          <div
            aria-live="polite"
            aria-atomic="true"
            className="fixed top-4 right-4 z-[1000] flex flex-col gap-3 pointer-events-none"
            style={{ width: 'min(380px, calc(100vw - 2rem))' }}
          >
            {toasts.map((t) => (
              <ToastItem
                key={t.id}
                data={t}
                onDismiss={() => dismiss(t.id)}
                registerEl={(el) => {
                  if (el) elementsRef.current.set(t.id, el);
                  else elementsRef.current.delete(t.id);
                }}
              />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

interface ToastItemProps {
  data: ToastData;
  onDismiss: () => void;
  registerEl: (el: HTMLDivElement | null) => void;
}

function ToastItem({ data, onDismiss, registerEl }: ToastItemProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const progressTweenRef = useRef<gsap.core.Tween | null>(null);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    registerEl(el);

    gsap.fromTo(
      el,
      { x: 120, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out', overwrite: true },
    );

    const progressEl = progressRef.current;
    if (progressEl) {
      progressTweenRef.current = gsap.fromTo(
        progressEl,
        { scaleX: 1 },
        {
          scaleX: 0,
          duration: data.duration / 1000,
          ease: 'none',
          overwrite: true,
          onComplete: onDismiss,
        },
      );
    }

    return () => {
      progressTweenRef.current?.kill();
      registerEl(null);
    };
    // onDismiss/registerEl/data captured at mount on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleHoverIn = () => {
    if (progressTweenRef.current) progressTweenRef.current.pause();
  };
  const handleHoverOut = () => {
    if (progressTweenRef.current) progressTweenRef.current.resume();
  };

  const Icon = ICONS[data.type];
  const accent = ACCENT[data.type];

  return (
    <div
      ref={rootRef}
      role="status"
      onMouseEnter={handleHoverIn}
      onMouseLeave={handleHoverOut}
      className="pointer-events-auto relative overflow-hidden rounded-2xl"
      style={{
        background: 'color-mix(in srgb, var(--color-bg-surface) 72%, transparent)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid var(--color-border)',
        boxShadow:
          '0 10px 30px -10px rgba(0,0,0,0.18), 0 4px 12px -4px rgba(0,0,0,0.08)',
        willChange: 'transform, opacity',
      }}
    >
      <div className="flex items-start gap-3 px-4 py-3 pr-3">
        <span
          className="flex-shrink-0 mt-0.5 inline-flex items-center justify-center rounded-full"
          style={{
            width: 22,
            height: 22,
            color: accent,
            border: `1.8px solid ${accent}`,
          }}
        >
          <Icon size={13} strokeWidth={3} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-(--color-text-primary) leading-snug truncate">
            {data.title}
          </div>
          {data.description && (
            <div className="text-xs text-(--color-text-tertiary) mt-0.5 leading-snug">
              {data.description}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="flex-shrink-0 -mr-1 -mt-1 p-1 rounded-md text-(--color-text-tertiary) hover:text-(--color-text-primary) hover:bg-(--color-bg-surface-hover) transition-colors"
        >
          <X size={14} />
        </button>
      </div>
      <div
        ref={progressRef}
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[2.5px] w-full"
        style={{
          background: accent,
          transformOrigin: 'left center',
          willChange: 'transform',
        }}
      />
    </div>
  );
}
