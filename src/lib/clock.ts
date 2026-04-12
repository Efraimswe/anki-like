const ENABLE_TEST_CLOCK = false;
const REAL_START_MS = Date.now();
const TEST_START_MS = REAL_START_MS + 5 * 24 * 60 * 60 * 1000;

export function isTestClockEnabled() {
  return ENABLE_TEST_CLOCK && process.env.NODE_ENV === 'development';
}

export function getNowMs() {
  if (!isTestClockEnabled()) return Date.now();
  return TEST_START_MS + (Date.now() - REAL_START_MS);
}

export function getNow() {
  return new Date(getNowMs());
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function getTestClockStartIso() {
  return new Date(TEST_START_MS).toISOString();
}
