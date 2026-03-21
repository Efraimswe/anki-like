interface Props {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ title, description, action }: Props) {
  return (
    <div className="premium-card p-16 text-center shadow-sm border-dashed border-2 bg-linear-to-b from-white to-gray-50 dark:from-white/5 dark:to-transparent">
      <div className="w-20 h-20 bg-linear-to-br from-orange-100 to-orange-50 dark:from-white/5 dark:to-white/0 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
         <svg className="w-10 h-10 text-(--color-accent) opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
         </svg>
      </div>
      <h3 className="text-2xl font-bold text-(--color-text-primary) heading tracking-tight">{title}</h3>
      {description && <p className="mt-3 text-sm font-medium text-(--color-text-tertiary) max-w-xs mx-auto leading-relaxed">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="button-primary mt-8 px-10 py-3 shadow-xl shadow-orange-500/10 active:scale-95 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
