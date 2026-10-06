// Spaced repetition (SM-2 variant). rating: 0 Again, 1 Hard, 2 Good, 3 Easy.
// Returns the new scheduling fields for a card.
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;

export function schedule(card, rating, now = new Date()) {
  let { ease = 2.5, interval = 0, repetitions = 0 } = card;

  if (rating === 0) {
    // Forgot: relearn soon, make it a bit "harder" for next time.
    return {
      ease: clamp(ease - 0.2, 1.3, 3.0),
      interval: 0,
      repetitions: 0,
      lapses: (card.lapses || 0) + 1,
      dueAt: new Date(now.getTime() + 10 * MIN),
    };
  }

  repetitions += 1;
  if (rating === 1) {
    interval = repetitions === 1 ? 1 : Math.max(1, Math.round(interval * 1.2));
    ease -= 0.15;
  } else if (rating === 2) {
    interval = repetitions === 1 ? 1 : repetitions === 2 ? 3 : Math.round(interval * ease);
  } else {
    interval = repetitions === 1 ? 3 : Math.round(Math.max(interval, 1) * ease * 1.3);
    ease += 0.15;
  }

  interval = clamp(interval, 1, 365);
  return {
    ease: clamp(ease, 1.3, 3.0),
    interval,
    repetitions,
    lapses: card.lapses || 0,
    dueAt: new Date(now.getTime() + interval * DAY),
  };
}
