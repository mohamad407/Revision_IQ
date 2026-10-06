// Day keys ("YYYY-MM-DD") in the STUDENT's local time, so streaks roll over at
// their midnight, not at UTC midnight (which is 5:30 AM in India).
// The client sends Date#getTimezoneOffset() (minutes, e.g. -330 for IST) in the
// X-TZ-Offset header.
export function parseTzOffset(value) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return 0;
  return Math.max(-840, Math.min(840, n));
}

export function dayKey(tzOffsetMin = 0, date = new Date()) {
  return new Date(date.getTime() - tzOffsetMin * 60000).toISOString().slice(0, 10);
}

export function addDays(key, delta) {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}
