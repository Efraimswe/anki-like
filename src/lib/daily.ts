/**
 * Day boundaries for daily limits / "today" counts are anchored to this
 * timezone (handles CET/CEST automatically), not UTC, so a day rolls over at
 * local Brussels midnight.
 */
export const TIME_ZONE = 'Europe/Brussels';

/** Wall-clock calendar/time components of `date` as seen in TIME_ZONE. */
function zonedParts(date: Date) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts: Record<string, number> = {};
  for (const p of dtf.formatToParts(date)) {
    if (p.type !== 'literal') parts[p.type] = Number(p.value);
  }
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour % 24, // en-US renders midnight as 24
    minute: parts.minute,
    second: parts.second,
  };
}

/** Offset in ms between Brussels wall-clock and UTC at the given instant. */
function zoneOffsetMs(date: Date): number {
  const p = zonedParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - (date.getTime() - date.getMilliseconds());
}

/**
 * The instant at which the Brussels day containing `date` begins (00:00 local).
 * Use for timestamp (`createdAt >= ...`) comparisons.
 */
export function startOfDay(date: Date): Date {
  const p = zonedParts(date);
  const wallMidnightAsUtc = Date.UTC(p.year, p.month - 1, p.day, 0, 0, 0);
  // Re-read the offset at (approximately) local midnight so DST-change days are exact.
  const approx = new Date(wallMidnightAsUtc - zoneOffsetMs(date));
  return new Date(wallMidnightAsUtc - zoneOffsetMs(approx));
}

/**
 * The instant at which the Brussels day containing `date` ends, i.e. the start
 * of the next local day (exclusive upper bound). A card whose due date is
 * before this is "due today or earlier".
 */
export function endOfDay(date: Date): Date {
  const start = startOfDay(date);
  // +36h lands safely inside the next day regardless of a 23h/25h DST day,
  // then snap back to that day's local midnight.
  return startOfDay(new Date(start.getTime() + 36 * 60 * 60 * 1000));
}

/**
 * The Brussels calendar date of `date`, as a UTC-midnight Date — the value to
 * use for the `@db.Date` daily-counter key so the stored date matches the
 * local calendar day.
 */
export function dayKey(date: Date): Date {
  const p = zonedParts(date);
  return new Date(Date.UTC(p.year, p.month - 1, p.day));
}
