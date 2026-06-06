/** Truncate a date to the start of its UTC day (used as the per-deck counter key). */
export function startOfUtcDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
