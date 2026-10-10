// Lightweight retrieval for "chat with your document": split the text into chunks,
// score each chunk by how many of the question's words it contains, return the best.
// Avoids sending 30,000 characters to the AI for every question.
const STOP = new Set(
  'the and for are but not you all can had her was one our out has have this that with from they will what when where which who how why does did into than then them these those been being would could should about there their your also such only any its is it of to in on at as by or an a be do if so'.split(
    ' '
  )
);

const tokens = (s) =>
  String(s)
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 3 && !STOP.has(w));

export function chunkText(text, size = 1400) {
  const chunks = [];
  const paras = String(text).split(/\n{2,}|\r\n{2,}/);
  let cur = '';
  for (const p of paras) {
    if ((cur + '\n' + p).length > size && cur) {
      chunks.push(cur.trim());
      cur = p;
    } else {
      cur = cur ? `${cur}\n${p}` : p;
    }
    while (cur.length > size * 1.5) {
      chunks.push(cur.slice(0, size));
      cur = cur.slice(size);
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

export function retrieveChunks(text, question, { top = 6, size = 1400 } = {}) {
  const chunks = chunkText(text, size);
  const q = [...new Set(tokens(question))];
  if (chunks.length <= top || q.length === 0) return chunks.slice(0, top).join('\n\n---\n\n');

  const df = new Map(); // in how many chunks does each term appear?
  const toks = chunks.map((c) => new Set(tokens(c)));
  for (const t of q) df.set(t, toks.filter((set) => set.has(t)).length);

  const scored = chunks.map((c, i) => {
    const lower = c.toLowerCase();
    let score = 0;
    for (const t of q) {
      if (!toks[i].has(t)) continue;
      const idf = Math.log(1 + chunks.length / (1 + df.get(t)));
      const tf = lower.split(t).length - 1;
      score += idf * (1 + Math.log(tf));
    }
    return { i, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, top)
    .sort((a, b) => a.i - b.i) // keep original reading order
    .map((s) => chunks[s.i])
    .join('\n\n---\n\n');
}
