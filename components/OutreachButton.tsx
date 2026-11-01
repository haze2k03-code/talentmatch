"use client";

import { useState } from "react";

// Drafts a short note to the hiring manager for one client-role pair.
// Uses the LLM if an API key is set on the server, otherwise a template.
export function OutreachButton({ clientId, roleId }: { clientId: number; roleId: number }) {
  const [draft, setDraft] = useState<string | null>(null);
  const [source, setSource] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, roleId }),
      });
      const data = await res.json();
      setDraft(data.message ?? data.error ?? "Something went wrong.");
      setSource(data.source ?? "");
    } catch {
      setDraft("Couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!draft) return;
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!draft) {
    return (
      <button
        onClick={generate}
        disabled={loading}
        className="rounded-md border border-border px-2.5 py-1 text-xs text-ink-2 hover:bg-surface-2 disabled:opacity-60"
      >
        {loading ? "Drafting…" : "Draft outreach"}
      </button>
    );
  }

  return (
    <div className="mt-3 w-full rounded-lg border border-border bg-surface-2 p-3">
      <div className="mb-2 flex items-center justify-between text-xs text-ink-3">
        <span>Outreach draft {source === "llm" ? "(AI)" : "(template)"}</span>
        <span className="flex gap-3">
          <button onClick={copy} className="hover:text-ink">{copied ? "Copied" : "Copy"}</button>
          <button onClick={() => setDraft(null)} className="hover:text-ink">Close</button>
        </span>
      </div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={7}
        className="w-full resize-y rounded-md border border-border bg-surface p-2 text-sm"
      />
    </div>
  );
}
