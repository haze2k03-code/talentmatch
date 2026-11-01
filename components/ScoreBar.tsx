import type { MatchRow } from "@/lib/types";

export const SCORE_PARTS = [
  { key: "skills_pts", label: "Skills", max: 40, color: "var(--series-1)" },
  { key: "level_pts", label: "Level", max: 25, color: "var(--series-2)" },
  { key: "pay_pts", label: "Pay", max: 20, color: "var(--series-3)" },
  { key: "context_pts", label: "Domain & location", max: 15, color: "var(--series-4)" },
] as const;

type Parts = Pick<MatchRow, "skills_pts" | "level_pts" | "pay_pts" | "context_pts">;

// Stacked bar out of 100: each segment is one part of the score.
// Hovering a segment shows its points; the total is printed next to the bar.
export function ScoreBar({ match, height = 10 }: { match: Parts; height?: number }) {
  return (
    <div
      className="flex w-full overflow-hidden rounded bg-surface-2"
      style={{ height, gap: 2 }}
      role="img"
      aria-label={SCORE_PARTS.map((p) => `${p.label} ${match[p.key]} of ${p.max}`).join(", ")}
    >
      {SCORE_PARTS.map((p) =>
        match[p.key] > 0 ? (
          <div
            key={p.key}
            title={`${p.label}: ${match[p.key]} / ${p.max}`}
            style={{ width: `${match[p.key]}%`, background: p.color }}
            className="first:rounded-l last:rounded-r"
          />
        ) : null
      )}
    </div>
  );
}

export function ScoreLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
      {SCORE_PARTS.map((p) => (
        <span key={p.key} className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />
          {p.label} <span className="text-ink-3">/{p.max}</span>
        </span>
      ))}
    </div>
  );
}

// Plain-language reasons behind a score, for the "why this match" line.
export function matchReasons(m: MatchRow): { good: string[]; gaps: string[] } {
  const good: string[] = [];
  const gaps: string[] = [];
  const total = m.matched_skills.length + m.missing_skills.length;

  good.push(`${m.matched_skills.length}/${total} required skills`);
  if (m.level_gap === 0) good.push("same level");
  else if (m.level_gap === 1) good.push("one step up (promotion)");
  else if (m.level_gap === -1) gaps.push("one level below current");
  else gaps.push(`${Math.abs(m.level_gap)} levels ${m.level_gap > 0 ? "above" : "below"} current`);

  if (m.pay_pts === 20) good.push(m.pay_uplift_pct > 0 ? `pay +${m.pay_uplift_pct}% vs current` : "meets expected pay");
  else gaps.push("top of band below expected pay");

  if (m.same_domain) good.push("same domain");
  if (!m.location_ok) gaps.push("location doesn't work");
  if (m.skills_gated) gaps.push("score capped: under 40% of required skills");
  return { good, gaps };
}
