import Link from "next/link";
import { notFound } from "next/navigation";
import { MatchList } from "@/components/MatchList";
import { ScoreLegend } from "@/components/ScoreBar";
import { Card, SectionTitle, SkillTag, formatPay } from "@/components/ui";
import { getMatchesForRole, getRole } from "@/lib/queries";
import { LEVEL_NAMES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RolePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const role = await getRole(id);
  if (!role) notFound();
  const matches = role.is_open ? await getMatchesForRole(id, 6) : [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/roles" className="text-xs text-ink-3 hover:text-ink">
          ← Open roles
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{role.title}</h1>
        <p className="mt-1 text-sm text-ink-2">
          {role.company} · {formatPay(role.pay_min_k, role.pay_max_k)} · {role.remote ? "Remote" : role.location}
          {!role.is_open && <span className="text-bad"> · closed</span>}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Card>
          <SectionTitle>What they want</SectionTitle>
          <dl className="grid grid-cols-[90px_1fr] gap-y-2 text-sm">
            <dt className="text-ink-3">Level</dt>
            <dd>{LEVEL_NAMES[role.seniority]}</dd>
            <dt className="text-ink-3">Domain</dt>
            <dd className="capitalize">{role.domain}</dd>
            <dt className="text-ink-3">Posted</dt>
            <dd>{role.posted_on}</dd>
          </dl>
          <div className="mt-4 text-xs text-ink-3">Required</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {role.required_skills.map((s) => (
              <SkillTag key={s} skill={s} tone="have" />
            ))}
          </div>
          <div className="mt-3 text-xs text-ink-3">Nice to have</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {role.nice_skills.map((s) => (
              <SkillTag key={s} skill={s} />
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <SectionTitle hint="Clients ranked by fit for this role">Best-fit clients</SectionTitle>
            <ScoreLegend />
          </div>
          {matches.length === 0 ? (
            <p className="text-sm text-ink-3">This role is closed.</p>
          ) : (
            <MatchList matches={matches} view="clients-for-role" />
          )}
        </Card>
      </div>
    </div>
  );
}
