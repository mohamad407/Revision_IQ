// Bars showing how many of the uploaded past papers cover each topic.
export default function TopicHeatmap({ rows }) {
  if (!rows?.length) return null;
  return (
    <ul className="mt-4 space-y-2" aria-label="Topic frequency across past papers">
      {rows.map((r) => {
        const ratio = r.total ? r.count / r.total : 0;
        const hot = ratio >= 0.75 ? 'bg-flag' : ratio >= 0.4 ? 'bg-highlighter-deep' : 'bg-correct';
        return (
          <li key={r.topic}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-ink">{r.topic}</span>
              <span className="flex-shrink-0 font-mono text-[11px] text-ink-faint">
                {r.count} of {r.total} paper{r.total === 1 ? '' : 's'}
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-paper-line">
              <div className={`h-full ${hot}`} style={{ width: `${Math.max(6, Math.round(ratio * 100))}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
