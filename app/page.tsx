import Link from "next/link";
import { Funnel } from "@/components/Funnel";
import { Card, ScorePill, SectionTitle, StatTile, daysAgo } from "@/components/ui";
import { getClientSummaries, getFunnel, getOverviewStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [stats, funnel, clients] = await Promise.all([getOverviewStats(), getFunnel(), getClientSummaries()]);
  const attention = clients.filter((c) => c.attention_reason);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-ink-2">Who fits where, and how every client's search is moving.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Clients" value={stats.clients} />
        <StatTile label="Open roles" value={stats.open_roles} />
        <StatTile label="In interview" value={stats.interviews} note="client–role pairs" />
        <StatTile label="Offers" value={stats.offers} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <SectionTitle hint={`${stats.active_pairs} active pairs`}>Pipeline funnel</SectionTitle>
          <Funnel steps={funnel} />
        </Card>

        <Card>
          <SectionTitle hint="No roles in pipeline, weak best match, or nothing moved in 10+ days">
            Needs attention ({attention.length})
          </SectionTitle>
          {attention.length === 0 ? (
            <p className="text-sm text-ink-3">Every client is moving.</p>
          ) : (
            <ul className="divide-y divide-border">
              {attention.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div>
                    <Link href={`/clients/${c.id}`} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                    <div className="text-xs text-ink-3">
                      {c.attention_reason} · owner {c.owner}
                    </div>
                  </div>
                  <span className="text-xs text-ink-3">
                    best match <ScorePill score={c.best_score} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="overflow-x-auto">
        <SectionTitle hint="Best open role for each client by fit score (out of 100)">All clients</SectionTitle>
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-ink-3">
              <th className="py-2 font-normal">Client</th>
              <th className="py-2 font-normal">Best open role</th>
              <th className="py-2 text-right font-normal">Fit</th>
              <th className="py-2 text-right font-normal">Active</th>
              <th className="py-2 text-right font-normal">Interviews</th>
              <th className="py-2 text-right font-normal">Last moved</th>
              <th className="py-2 pl-4 font-normal">Owner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {clients.map((c) => (
              <tr key={c.id}>
                <td className="py-2.5">
                  <Link href={`/clients/${c.id}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                  <div className="text-xs text-ink-3">
                    {c.current_title} · {c.current_company}
                  </div>
                </td>
                <td className="py-2.5">
                  {c.best_role_id ? (
                    <Link href={`/roles/${c.best_role_id}`} className="hover:underline">
                      {c.best_role_title}
                      <span className="text-ink-3"> · {c.best_role_company}</span>
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2.5 text-right">
                  <ScorePill score={c.best_score} />
                </td>
                <td className="tabular py-2.5 text-right">{c.active_count}</td>
                <td className="tabular py-2.5 text-right">{c.interview_count}</td>
                <td className="py-2.5 text-right text-ink-2">{daysAgo(c.last_activity)}</td>
                <td className="py-2.5 pl-4 text-ink-2">{c.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
