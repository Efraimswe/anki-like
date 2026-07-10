interface Props {
  text: string;
  completed: boolean;
  className?: string;
}

export default function GoalLabel({ text, completed, className = '' }: Props) {
  return (
    <span className={`goal-label ${className}`} data-done={completed || undefined}>
      {text}
    </span>
  );
}
