import Link from "next/link";
import { Card, ScorePill, SectionTitle, formatPay } from "@/components/ui";
import { getRoleSummaries } from "@/lib/queries";
import { LEVEL_NAMES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const roles = await getRoleSummaries();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Open roles</h1>
        <p className="mt-1 text-sm text-ink-2">Roles with the most strong-fit clients first. Strong fit = score 75+.</p>
      </div>

      <Card className="overflow-x-auto">
        <SectionTitle>{roles.length} open roles</SectionTitle>
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-ink-3">
              <th className="py-2 font-normal">Role</th>
              <th className="py-2 font-normal">Level</th>
              <th className="py-2 font-normal">Pay</th>
              <th className="py-2 font-normal">Location</th>
              <th className="py-2 text-right font-normal">Strong fits</th>
              <th className="py-2 text-right font-normal">Best fit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {roles.map((r) => (
              <tr key={r.id}>
                <td className="py-2.5">
                  <Link href={`/roles/${r.id}`} className="font-medium hover:underline">
                    {r.title}
                  </Link>
                  <div className="text-xs text-ink-3">{r.company}</div>
                </td>
                <td className="py-2.5 text-ink-2">{LEVEL_NAMES[r.seniority]}</td>
                <td className="tabular py-2.5 text-ink-2">{formatPay(r.pay_min_k, r.pay_max_k)}</td>
                <td className="py-2.5 text-ink-2">{r.remote ? "Remote" : r.location}</td>
                <td className="tabular py-2.5 text-right">{r.strong_fits}</td>
                <td className="py-2.5 text-right">
                  <ScorePill score={r.best_score} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
