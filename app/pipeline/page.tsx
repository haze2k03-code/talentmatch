import Link from "next/link";
import { StageSelect } from "@/components/StageSelect";
import { ScorePill, daysAgo } from "@/components/ui";
import { getPipelineCards } from "@/lib/queries";
import { STAGES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const cards = await getPipelineCards();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
        <p className="mt-1 text-sm text-ink-2">Every client–role pair being worked, by stage. Move a card when it changes.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {STAGES.map((stage) => {
          const inStage = cards.filter((c) => c.stage === stage);
          return (
            <section key={stage} className="rounded-xl border border-border bg-surface-2 p-2.5">
              <h2 className="mb-2 flex items-center justify-between px-1 text-xs font-semibold capitalize text-ink-2">
                {stage}
                <span className="tabular font-normal text-ink-3">{inStage.length}</span>
              </h2>
              <ul className="space-y-2">
                {inStage.map((c) => (
                  <li key={c.id} className="rounded-lg border border-border bg-surface p-2.5 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/clients/${c.client_id}`} className="font-medium hover:underline">
                        {c.client_name}
                      </Link>
                      <ScorePill score={c.score} />
                    </div>
                    <Link href={`/roles/${c.role_id}`} className="mt-0.5 block text-xs text-ink-2 hover:underline">
                      {c.role_title} · {c.company}
                    </Link>
                    <div className="mt-1 text-xs text-ink-3">
                      {c.owner} · {daysAgo(c.updated_at)}
                    </div>
                    <div className="mt-2">
                      <StageSelect pipelineId={c.id} stage={c.stage} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
