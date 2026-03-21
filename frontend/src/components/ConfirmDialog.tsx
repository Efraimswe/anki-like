interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 p-6">
      <div className="premium-card p-10 max-w-md w-full shadow-2xl border-none animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 rounded-3xl flex items-center justify-center mb-6">
           <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
           </svg>
        </div>
        <h3 className="text-2xl font-bold text-(--color-text-primary) heading tracking-tight">{title}</h3>
        <p className="mt-4 text-sm font-medium text-(--color-text-tertiary) leading-relaxed">{message}</p>
        <div className="mt-10 flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 text-sm font-bold text-(--color-text-secondary) hover:text-(--color-text-primary) bg-(--color-bg-page) rounded-2xl transition-all"
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 text-sm font-bold text-white bg-red-500 rounded-2xl hover:bg-red-600 shadow-lg shadow-red-500/20 active:scale-95 transition-all"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
