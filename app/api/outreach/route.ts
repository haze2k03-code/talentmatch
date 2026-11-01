import { NextResponse } from "next/server";
import { getClient, getMatchPair } from "@/lib/queries";

// POST { clientId, roleId } -> { message, source: "llm" | "template" }
// With ANTHROPIC_API_KEY set, the LLM writes the note; otherwise a template does,
// so the feature works with no key at all.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const clientId = Number(body?.clientId);
  const roleId = Number(body?.roleId);
  if (!Number.isInteger(clientId) || !Number.isInteger(roleId)) {
    return NextResponse.json({ error: "clientId and roleId are required" }, { status: 400 });
  }

  const [client, match] = await Promise.all([getClient(clientId), getMatchPair(clientId, roleId)]);
  if (!client || !match) {
    return NextResponse.json({ error: "Client or open role not found" }, { status: 404 });
  }

  const firstName = client.name.split(" ")[0];
  const strengths = match.matched_skills.slice(0, 3).join(", ") || client.skills.slice(0, 3).join(", ");
  const template = `Hi [Hiring manager],

I saw you're hiring a ${match.role_title} at ${match.company}. I'm reaching out on behalf of ${client.name}, currently ${client.current_title} at ${client.current_company} with ${client.years_exp} years of experience.

${firstName} brings hands-on depth in ${strengths}, which lines up closely with what the role asks for.

Would you be open to a 20-minute call this week? Happy to share ${firstName}'s resume ahead of time.

Best,
${client.owner}`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ message: template, source: "template" });

  const prompt = `Write a short, specific cold outreach message (under 120 words) to the hiring manager for this role, sent by a job-search agency on behalf of their client. Plain text, no subject line, start with "Hi [Hiring manager],", sign off as ${client.owner}. Don't invent achievements; only use the facts below.

Role: ${match.role_title} at ${match.company}
Client: ${client.name}, ${client.current_title} at ${client.current_company}, ${client.years_exp} years experience
Skills that match the role: ${match.matched_skills.join(", ") || "none listed"}
Other client skills: ${client.skills.filter((s) => !match.matched_skills.includes(s)).join(", ")}
Domain: ${client.domain}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-5-5",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`LLM request failed: ${res.status}`);
    const data = await res.json();
    const text: string | undefined = data?.content?.find((c: { type: string }) => c.type === "text")?.text;
    if (!text) throw new Error("Empty LLM response");
    return NextResponse.json({ message: text.trim(), source: "llm" });
  } catch (err) {
    console.error(err);
    // Fall back to the template so the button never just fails.
    return NextResponse.json({ message: template, source: "template" });
  }
}
