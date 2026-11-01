import { query } from "./db";
import type {
  ClientRow,
  ClientSummary,
  FunnelStep,
  MatchRow,
  OverviewStats,
  PipelineCard,
  RoleRow,
  RoleSummary,
  Stage,
} from "./types";

// All SQL lives in this file so the matching logic is easy to read and test.
// Every count/round is cast to ::int because node-postgres returns bigint/numeric as strings.

const OVERVIEW_STATS = /* sql */ `
SELECT
  (SELECT count(*) FROM clients)::int                              AS clients,
  (SELECT count(*) FROM roles WHERE is_open)::int                  AS open_roles,
  (SELECT count(*) FROM pipeline WHERE stage = 'interview')::int   AS interviews,
  (SELECT count(*) FROM pipeline WHERE stage = 'offer')::int       AS offers,
  (SELECT count(*) FROM pipeline WHERE stage <> 'rejected')::int   AS active_pairs
`;

// How many active (non-rejected) pairs have reached at least each stage.
// Enum values compare in declaration order, so stage >= 'applied' means "applied or later".
const FUNNEL = /* sql */ `
WITH steps(stage, ord) AS (
  VALUES ('shortlisted'::pipeline_stage, 1), ('applied', 2), ('outreach', 3), ('interview', 4), ('offer', 5)
)
SELECT
  s.stage::text AS stage,
  (SELECT count(*) FROM pipeline p WHERE p.stage <> 'rejected' AND p.stage >= s.stage)::int AS reached
FROM steps s
ORDER BY s.ord
`;

// One row per client with their best open-role match and pipeline activity.
// A client "needs attention" if nothing is in their pipeline, their best match is weak,
// or nothing has moved for 10+ days.
const CLIENT_SUMMARIES = /* sql */ `
WITH best AS (
  SELECT DISTINCT ON (m.client_id)
         m.client_id, m.score AS best_score, r.id AS best_role_id,
         r.title AS best_role_title, r.company AS best_role_company
  FROM match_scores m
  JOIN roles r ON r.id = m.role_id
  ORDER BY m.client_id, m.score DESC, r.id
),
activity AS (
  SELECT client_id,
         count(*) FILTER (WHERE stage <> 'rejected')::int  AS active_count,
         count(*) FILTER (WHERE stage = 'interview')::int  AS interview_count,
         count(*) FILTER (WHERE stage = 'offer')::int      AS offer_count,
         max(updated_at)                                   AS last_activity
  FROM pipeline
  GROUP BY client_id
)
SELECT
  c.id, c.name, c.current_title, c.current_company, c.seniority, c.owner,
  b.best_score, b.best_role_id, b.best_role_title, b.best_role_company,
  COALESCE(a.active_count, 0)    AS active_count,
  COALESCE(a.interview_count, 0) AS interview_count,
  COALESCE(a.offer_count, 0)     AS offer_count,
  a.last_activity,
  CASE
    WHEN a.active_count IS NULL OR a.active_count = 0       THEN 'No roles in pipeline'
    WHEN b.best_score < 75                                   THEN 'Weak best match'
    WHEN a.last_activity < NOW() - INTERVAL '10 days'        THEN 'No movement in 10+ days'
  END AS attention_reason
FROM clients c
LEFT JOIN best b     ON b.client_id = c.id
LEFT JOIN activity a ON a.client_id = c.id
ORDER BY (CASE WHEN a.active_count IS NULL OR a.active_count = 0 THEN 0 ELSE 1 END),
         b.best_score DESC NULLS LAST
`;

const CLIENT_BY_ID = /* sql */ `
SELECT id, name, current_title, current_company, seniority, years_exp, current_pay_k,
       expected_pay_k, skills, domain, location, open_to_remote, owner, joined_on::text
FROM clients WHERE id = $1
`;

// Top matches for one client, with the pipeline stage if the pair is already being worked.
const MATCHES_FOR_CLIENT = /* sql */ `
SELECT m.*, r.title AS role_title, r.company, r.pay_min_k, r.pay_max_k, r.location, r.remote,
       c.name AS client_name, p.stage::text AS stage
FROM match_scores m
JOIN roles r   ON r.id = m.role_id
JOIN clients c ON c.id = m.client_id
LEFT JOIN pipeline p ON p.client_id = m.client_id AND p.role_id = m.role_id
WHERE m.client_id = $1
ORDER BY m.score DESC, r.id
LIMIT $2
`;

const ROLE_BY_ID = /* sql */ `
SELECT id, company, title, seniority, pay_min_k, pay_max_k, required_skills, nice_skills,
       domain, location, remote, is_open, posted_on::text
FROM roles WHERE id = $1
`;

// Best-fit clients for one role.
const MATCHES_FOR_ROLE = /* sql */ `
SELECT m.*, r.title AS role_title, r.company, r.pay_min_k, r.pay_max_k, r.location, r.remote,
       c.name AS client_name, p.stage::text AS stage
FROM match_scores m
JOIN roles r   ON r.id = m.role_id
JOIN clients c ON c.id = m.client_id
LEFT JOIN pipeline p ON p.client_id = m.client_id AND p.role_id = m.role_id
WHERE m.role_id = $1
ORDER BY m.score DESC, c.id
LIMIT $2
`;

// Every open role with how many clients are a strong fit (score >= 75).
const ROLE_SUMMARIES = /* sql */ `
SELECT r.id, r.company, r.title, r.seniority, r.pay_min_k, r.pay_max_k, r.location, r.remote,
       (count(*) FILTER (WHERE m.score >= 75))::int AS strong_fits,
       max(m.score)::int                            AS best_score
FROM roles r
JOIN match_scores m ON m.role_id = r.id
GROUP BY r.id
ORDER BY strong_fits DESC, best_score DESC
`;

const PIPELINE_CARDS = /* sql */ `
SELECT p.id, p.client_id, p.role_id, p.stage::text AS stage, p.updated_at,
       c.name AS client_name, c.owner, r.title AS role_title, r.company,
       m.score
FROM pipeline p
JOIN clients c ON c.id = p.client_id
JOIN roles r   ON r.id = p.role_id
LEFT JOIN match_scores m ON m.client_id = p.client_id AND m.role_id = p.role_id
ORDER BY p.updated_at DESC
`;

const PIPELINE_FOR_CLIENT = /* sql */ `
SELECT p.id, p.client_id, p.role_id, p.stage::text AS stage, p.updated_at,
       c.name AS client_name, c.owner, r.title AS role_title, r.company,
       m.score
FROM pipeline p
JOIN clients c ON c.id = p.client_id
JOIN roles r   ON r.id = p.role_id
LEFT JOIN match_scores m ON m.client_id = p.client_id AND m.role_id = p.role_id
WHERE p.client_id = $1
ORDER BY p.updated_at DESC
`;

const ADD_TO_PIPELINE = /* sql */ `
INSERT INTO pipeline (client_id, role_id, stage)
VALUES ($1, $2, 'shortlisted')
ON CONFLICT (client_id, role_id) DO NOTHING
`;

const MOVE_STAGE = /* sql */ `
UPDATE pipeline SET stage = $2::pipeline_stage, updated_at = NOW() WHERE id = $1
`;

const MATCH_PAIR = /* sql */ `
SELECT m.*, r.title AS role_title, r.company, r.pay_min_k, r.pay_max_k, r.location, r.remote,
       c.name AS client_name, NULL::text AS stage
FROM match_scores m
JOIN roles r   ON r.id = m.role_id
JOIN clients c ON c.id = m.client_id
WHERE m.client_id = $1 AND m.role_id = $2
`;

export async function getOverviewStats(): Promise<OverviewStats> {
  const [row] = await query<OverviewStats>(OVERVIEW_STATS);
  return row;
}

export const getFunnel = () => query<FunnelStep>(FUNNEL);
export const getClientSummaries = () => query<ClientSummary>(CLIENT_SUMMARIES);
export const getRoleSummaries = () => query<RoleSummary>(ROLE_SUMMARIES);
export const getPipelineCards = () => query<PipelineCard>(PIPELINE_CARDS);
export const getPipelineForClient = (clientId: number) =>
  query<PipelineCard>(PIPELINE_FOR_CLIENT, [clientId]);

export async function getClient(id: number): Promise<ClientRow | null> {
  const [row] = await query<ClientRow>(CLIENT_BY_ID, [id]);
  return row ?? null;
}

export async function getRole(id: number): Promise<RoleRow | null> {
  const [row] = await query<RoleRow>(ROLE_BY_ID, [id]);
  return row ?? null;
}

export const getMatchesForClient = (clientId: number, limit = 8) =>
  query<MatchRow>(MATCHES_FOR_CLIENT, [clientId, limit]);

export const getMatchesForRole = (roleId: number, limit = 8) =>
  query<MatchRow>(MATCHES_FOR_ROLE, [roleId, limit]);

export async function getMatchPair(clientId: number, roleId: number): Promise<MatchRow | null> {
  const [row] = await query<MatchRow>(MATCH_PAIR, [clientId, roleId]);
  return row ?? null;
}

export async function addToPipeline(clientId: number, roleId: number) {
  await query(ADD_TO_PIPELINE, [clientId, roleId]);
}

export async function moveStage(pipelineId: number, stage: Stage) {
  await query(MOVE_STAGE, [pipelineId, stage]);
}
