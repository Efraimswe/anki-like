interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className="rounded-lg bg-(--color-danger-bg) border border-(--color-danger-border) p-4 text-center">
      <p className="text-(--color-danger-text) text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-sm text-(--color-danger) underline hover:text-(--color-danger-text-hover)"
        >
          Try again
        </button>
      )}
    </div>
  );
}
