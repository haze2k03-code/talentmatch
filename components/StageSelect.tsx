import { moveStageAction } from "@/app/actions";
import { STAGES, type Stage } from "@/lib/types";

// Small form to move a pipeline item to another stage. Works without client JS.
export function StageSelect({ pipelineId, stage }: { pipelineId: number; stage: Stage }) {
  return (
    <form action={moveStageAction} className="flex items-center gap-1.5">
      <input type="hidden" name="pipelineId" value={pipelineId} />
      <select
        name="stage"
        defaultValue={stage}
        aria-label="Move to stage"
        className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-xs capitalize"
      >
        {STAGES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button type="submit" className="rounded-md border border-border px-2 py-0.5 text-xs text-ink-2 hover:bg-surface-2">
        Move
      </button>
    </form>
  );
}
