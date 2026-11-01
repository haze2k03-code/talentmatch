import type { Stage } from "@/lib/types";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-border bg-surface p-5 ${className}`}>{children}</section>;
}

export function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold">{children}</h2>
      {hint && <p className="mt-0.5 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

export function StatTile({ label, value, note }: { label: string; value: number | string; note?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-xs text-ink-3">{label}</div>
      <div className="tabular mt-1 text-3xl font-semibold tracking-tight">{value}</div>
      {note && <div className="mt-1 text-xs text-ink-3">{note}</div>}
    </div>
  );
}

const STAGE_STYLE: Record<Stage, string> = {
  shortlisted: "border-border text-ink-2",
  applied: "border-border text-ink-2",
  outreach: "border-border text-ink",
  interview: "border-accent text-accent",
  offer: "border-good text-good",
  rejected: "border-border text-ink-3 line-through",
};

// Stage is always spelled out, so the colour is never the only signal.
export function StageBadge({ stage }: { stage: Stage }) {
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs capitalize ${STAGE_STYLE[stage]}`}>
      {stage}
    </span>
  );
}

// Score pill: number always shown; the band name is in the tooltip.
export function ScorePill({ score }: { score: number | null }) {
  if (score === null) return <span className="text-ink-3">—</span>;
  const band = score >= 75 ? "Strong fit" : score >= 55 ? "Possible fit" : "Weak fit";
  const tone = score >= 75 ? "text-good" : score >= 55 ? "text-ink" : "text-ink-3";
  return (
    <span title={band} className={`tabular font-semibold ${tone}`}>
      {score}
    </span>
  );
}

export function SkillTag({ skill, tone = "neutral" }: { skill: string; tone?: "neutral" | "have" | "missing" }) {
  const style =
    tone === "have"
      ? "border-border bg-surface-2 text-ink"
      : tone === "missing"
        ? "border-dashed border-bad text-bad"
        : "border-border text-ink-2";
  return (
    <span className={`inline-block rounded-md border px-1.5 py-0.5 text-xs ${style}`}>
      {tone === "missing" && <span aria-hidden>✕ </span>}
      {skill}
    </span>
  );
}

export function formatPay(minK: number, maxK?: number) {
  return maxK === undefined ? `$${minK}k` : `$${minK}k–$${maxK}k`;
}

export function daysAgo(date: Date | string | null) {
  if (!date) return "—";
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  return days <= 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`;
}
