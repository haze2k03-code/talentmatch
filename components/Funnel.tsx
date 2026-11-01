import type { FunnelStep } from "@/lib/types";

// Horizontal funnel: one bar per stage, length = pairs that reached at least that stage.
// Count and step conversion are printed as text, so the bar length isn't the only signal.
export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const top = Math.max(1, steps[0]?.reached ?? 1);
  return (
    <div className="space-y-2.5">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].reached : null;
        const conv = prev ? Math.round((100 * s.reached) / prev) : null;
        return (
          <div key={s.stage} className="grid grid-cols-[88px_1fr_96px] items-center gap-3 text-sm">
            <span className="capitalize text-ink-2">{s.stage}</span>
            <div className="h-5 rounded bg-surface-2" title={`${s.reached} reached ${s.stage}`}>
              <div
                className="h-5 rounded"
                style={{ width: `${(100 * s.reached) / top}%`, minWidth: s.reached ? 4 : 0, background: "var(--funnel)" }}
              />
            </div>
            <span className="tabular text-right">
              <span className="font-semibold">{s.reached}</span>
              {conv !== null && <span className="ml-1.5 text-xs text-ink-3">{conv}%</span>}
            </span>
          </div>
        );
      })}
      <p className="pt-1 text-xs text-ink-3">
        Active client–role pairs that reached each stage. % = conversion from the stage above. Rejected pairs are excluded.
      </p>
    </div>
  );
}
