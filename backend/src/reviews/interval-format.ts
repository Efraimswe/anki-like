/**
 * Format an interval in minutes to a human-readable string like Anki.
 * Examples: "1m", "10m", "1h", "1d", "4d", "1mo", "1y"
 */
export function formatInterval(minutes: number): string {
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) {
    const hours = minutes / 60;
    return `${Math.round(hours)}h`;
  }
  const days = minutes / 1440;
  if (days < 31) return `${Math.round(days)}d`;
  const months = days / 30;
  if (months < 12) return `${Math.round(months)}mo`;
  const years = days / 365;
  return `${Math.round(years * 10) / 10}y`;
}
