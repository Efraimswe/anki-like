'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.set(overlayRef.current, { opacity: 0 });
    gsap.set(panelRef.current, { opacity: 1, y: '100vh', force3D: true });
    gsap.to(overlayRef.current, { opacity: 1, duration: 0.025, ease: 'none' });
    gsap.to(panelRef.current, { y: 0, duration: 0.06, ease: 'none', force3D: true });
  });

  const dialog = (
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6" style={{ opacity: 0 }}>
      <div ref={panelRef} className="premium-card p-10 max-w-md w-full shadow-2xl border-none will-change-transform" style={{ transform: 'translateY(100vh)' }}>
        <h3 className="text-2xl font-bold text-(--color-text-primary) heading tracking-tight">{title}</h3>
        <p className="mt-4 text-sm font-medium text-(--color-text-tertiary) leading-relaxed">{message}</p>
        <div className="mt-10 flex gap-4">
          <button onClick={onCancel} className="flex-1 px-6 py-3 text-sm font-bold text-(--color-text-secondary) hover:text-(--color-text-primary) bg-(--color-bg-page) rounded-2xl transition-all">
            Go Back
          </button>
          <button onClick={onConfirm} className="flex-1 px-6 py-3 text-sm font-bold text-white bg-red-500 rounded-2xl hover:bg-red-600 shadow-lg shadow-red-500/20 active:scale-95 transition-all">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
