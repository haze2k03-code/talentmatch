-- Explainable fit score for every client x open role pair.
-- Total = 100 points:
--   skills    40  share of the role's required skills the client has (+ small bonus for nice-to-haves)
--   level     25  how close the role's seniority is to the client's (one step up scores well)
--   pay       20  whether the role's top of band meets the client's expected pay
--   context   15  same domain (8) + location works (7)
-- Skills gate: if the client has under 40% of the required skills, the total is capped at 40,
-- so a pair can't rank high on level/pay/location alone.
-- Each part is returned separately so the dashboard can show WHY a pair matches.

CREATE OR REPLACE VIEW match_scores AS
WITH pairs AS (
  SELECT
    c.id AS client_id,
    r.id AS role_id,
    -- required skills the client has / doesn't have
    ARRAY(SELECT s FROM unnest(r.required_skills) s WHERE s = ANY (c.skills))     AS matched_skills,
    ARRAY(SELECT s FROM unnest(r.required_skills) s WHERE NOT (s = ANY (c.skills))) AS missing_skills,
    cardinality(r.required_skills)                                                AS required_count,
    (SELECT count(*) FROM unnest(r.nice_skills) s WHERE s = ANY (c.skills))       AS nice_hits,
    r.seniority - c.seniority                                                     AS level_gap,
    c.expected_pay_k,
    c.current_pay_k,
    r.pay_min_k,
    r.pay_max_k,
    (c.domain = r.domain)                                                         AS same_domain,
    (r.remote AND c.open_to_remote) OR c.location = r.location                    AS location_ok
  FROM clients c
  CROSS JOIN roles r
  WHERE r.is_open
),
parts AS (
  SELECT
    p.*,
    -- skills: 40 * share of required skills, +2 per nice-to-have, capped at 40
    LEAST(40, ROUND(40.0 * cardinality(p.matched_skills) / NULLIF(p.required_count, 0))
              + 2 * p.nice_hits)::INT                                             AS skills_pts,
    -- level: same level 25, one step up (a promotion) 22, one step down 12, else 0
    CASE
      WHEN p.level_gap = 0  THEN 25
      WHEN p.level_gap = 1  THEN 22
      WHEN p.level_gap = -1 THEN 12
      ELSE 0
    END                                                                           AS level_pts,
    -- pay: full marks if top of band >= expected; lose 2 points per 1% short
    GREATEST(0, LEAST(20, ROUND(
      20 - 200.0 * GREATEST(0, p.expected_pay_k - p.pay_max_k) / p.expected_pay_k
    )))::INT                                                                      AS pay_pts,
    (CASE WHEN p.same_domain THEN 8 ELSE 0 END
     + CASE WHEN p.location_ok THEN 7 ELSE 0 END)                                 AS context_pts,
    -- pay uplift vs the client's current pay, using the midpoint of the band
    ROUND(100.0 * ((p.pay_min_k + p.pay_max_k) / 2.0 - p.current_pay_k) / p.current_pay_k)::INT
                                                                                  AS pay_uplift_pct,
    (cardinality(p.matched_skills) < 0.4 * p.required_count)                      AS skills_gated
  FROM pairs p
)
SELECT
  client_id,
  role_id,
  CASE WHEN skills_gated THEN LEAST(40, skills_pts + level_pts + pay_pts + context_pts)
       ELSE skills_pts + level_pts + pay_pts + context_pts END AS score,
  skills_gated,
  skills_pts,
  level_pts,
  pay_pts,
  context_pts,
  matched_skills,
  missing_skills,
  level_gap,
  pay_uplift_pct,
  same_domain,
  location_ok
FROM parts;
