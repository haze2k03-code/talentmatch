import Link from "next/link";
import { notFound } from "next/navigation";
import { MatchList } from "@/components/MatchList";
import { ScoreLegend } from "@/components/ScoreBar";
import { StageSelect } from "@/components/StageSelect";
import { Card, ScorePill, SectionTitle, SkillTag, StageBadge, daysAgo, formatPay } from "@/components/ui";
import { getClient, getMatchesForClient, getPipelineForClient } from "@/lib/queries";
import { LEVEL_NAMES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const client = await getClient(id);
  if (!client) notFound();
  const [matches, pipeline] = await Promise.all([getMatchesForClient(id, 6), getPipelineForClient(id)]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-xs text-ink-3 hover:text-ink">
          ← Overview
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{client.name}</h1>
        <p className="mt-1 text-sm text-ink-2">
          {client.current_title} at {client.current_company} · {client.years_exp} yrs · owner {client.owner}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-6">
          <Card>
            <SectionTitle>Profile</SectionTitle>
            <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-sm">
              <dt className="text-ink-3">Level</dt>
              <dd>{LEVEL_NAMES[client.seniority]}</dd>
              <dt className="text-ink-3">Current pay</dt>
              <dd className="tabular">{formatPay(client.current_pay_k)}</dd>
              <dt className="text-ink-3">Wants</dt>
              <dd className="tabular">{formatPay(client.expected_pay_k)}+</dd>
              <dt className="text-ink-3">Domain</dt>
              <dd className="capitalize">{client.domain}</dd>
              <dt className="text-ink-3">Location</dt>
              <dd>
                {client.location}
                {client.open_to_remote && <span className="text-ink-3"> · open to remote</span>}
              </dd>
            </dl>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {client.skills.map((s) => (
                <SkillTag key={s} skill={s} tone="have" />
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle hint="Move a pair when something changes">Pipeline ({pipeline.length})</SectionTitle>
            {pipeline.length === 0 ? (
              <p className="text-sm text-ink-3">Nothing yet. Shortlist a role from the matches.</p>
            ) : (
              <ul className="space-y-3">
                {pipeline.map((p) => (
                  <li key={p.id} className="text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/roles/${p.role_id}`} className="hover:underline">
                        {p.role_title}
                        <span className="text-ink-3"> · {p.company}</span>
                      </Link>
                      <ScorePill score={p.score} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <StageBadge stage={p.stage} />
                      <span className="text-xs text-ink-3">{daysAgo(p.updated_at)}</span>
                      <StageSelect pipelineId={p.id} stage={p.stage} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <SectionTitle hint="Top open roles by fit score, with the reasons and gaps">Best matches</SectionTitle>
            <ScoreLegend />
          </div>
          <MatchList matches={matches} view="roles-for-client" />
        </Card>
      </div>
    </div>
  );
}
