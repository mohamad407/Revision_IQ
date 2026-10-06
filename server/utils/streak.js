import { addDays } from './day.js';

/**
 * activeDays: array of "YYYY-MM-DD" keys on which the student did something.
 * Returns { current, longest }. A streak stays alive if the student was active
 * yesterday (they still have today to continue it).
 */
export function computeStreak(activeDays, todayKey) {
  const set = new Set(activeDays);

  let current = 0;
  let cursor = set.has(todayKey) ? todayKey : addDays(todayKey, -1);
  while (set.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  let longest = 0;
  let run = 0;
  let prev = null;
  for (const day of [...set].sort()) {
    run = prev && addDays(prev, 1) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = day;
  }

  return { current, longest: Math.max(longest, current) };
}
