import Link from "next/link";
import { addToPipelineAction } from "@/app/actions";
import { OutreachButton } from "@/components/OutreachButton";
import { ScoreBar, matchReasons } from "@/components/ScoreBar";
import { ScorePill, SkillTag, StageBadge, formatPay } from "@/components/ui";
import type { MatchRow } from "@/lib/types";

// One list used on both the client page (showing roles) and the role page (showing clients).
export function MatchList({ matches, view }: { matches: MatchRow[]; view: "roles-for-client" | "clients-for-role" }) {
  return (
    <ul className="divide-y divide-border">
      {matches.map((m) => {
        const { good, gaps } = matchReasons(m);
        return (
          <li key={`${m.client_id}-${m.role_id}`} className="py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                {view === "roles-for-client" ? (
                  <Link href={`/roles/${m.role_id}`} className="font-medium hover:underline">
                    {m.role_title} <span className="font-normal text-ink-2">· {m.company}</span>
                  </Link>
                ) : (
                  <Link href={`/clients/${m.client_id}`} className="font-medium hover:underline">
                    {m.client_name}
                  </Link>
                )}
                {view === "roles-for-client" && (
                  <div className="text-xs text-ink-3">
                    {formatPay(m.pay_min_k, m.pay_max_k)} · {m.remote ? "Remote" : m.location}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                {m.stage ? (
                  <StageBadge stage={m.stage} />
                ) : (
                  <form action={addToPipelineAction}>
                    <input type="hidden" name="clientId" value={m.client_id} />
                    <input type="hidden" name="roleId" value={m.role_id} />
                    <button
                      type="submit"
                      className="rounded-md border border-border px-2.5 py-1 text-xs text-ink-2 hover:bg-surface-2"
                    >
                      + Shortlist
                    </button>
                  </form>
                )}
                <span className="text-xl">
                  <ScorePill score={m.score} />
                </span>
              </div>
            </div>

            <div className="mt-2.5 max-w-xl">
              <ScoreBar match={m} />
            </div>

            <p className="mt-2 text-xs text-ink-2">
              {good.join(" · ")}
              {gaps.length > 0 && <span className="text-warn"> · {gaps.join(" · ")}</span>}
            </p>

            {m.missing_skills.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-ink-3">Missing:</span>
                {m.missing_skills.map((s) => (
                  <SkillTag key={s} skill={s} tone="missing" />
                ))}
              </div>
            )}

            <div className="mt-2.5">
              <OutreachButton clientId={m.client_id} roleId={m.role_id} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
