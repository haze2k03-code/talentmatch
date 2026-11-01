"use server";

import { revalidatePath } from "next/cache";
import { addToPipeline, moveStage } from "@/lib/queries";
import { STAGES, type Stage } from "@/lib/types";

export async function addToPipelineAction(formData: FormData) {
  const clientId = Number(formData.get("clientId"));
  const roleId = Number(formData.get("roleId"));
  if (!Number.isInteger(clientId) || !Number.isInteger(roleId)) return;
  await addToPipeline(clientId, roleId);
  revalidatePath("/", "layout");
}

export async function moveStageAction(formData: FormData) {
  const pipelineId = Number(formData.get("pipelineId"));
  const stage = String(formData.get("stage")) as Stage;
  if (!Number.isInteger(pipelineId) || !STAGES.includes(stage)) return;
  await moveStage(pipelineId, stage);
  revalidatePath("/", "layout");
}
