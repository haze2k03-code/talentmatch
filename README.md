# TalentMatch — client–role matching & delivery tracker

A dashboard for a done-for-you job search team. It matches each **client** (a job seeker the team represents) against open **roles** at companies, explains *why* each pair fits, and tracks every pair through the job-search **pipeline**.

> All people and companies in the seed data are fictional.

## What it does

- **Explainable fit score (0–100)** for every client × open role, computed in SQL:
  | Part | Points | How |
  |---|---|---|
  | Skills | 40 | share of the role's required skills the client has, +2 per nice-to-have |
  | Level | 25 | same level 25 · one step up (promotion) 22 · one step down 12 · else 0 |
  | Pay | 20 | full if top of band ≥ client's expected pay, −2 per 1% short |
  | Domain & location | 15 | same domain 8 + location works (remote or same city) 7 |

  **Skills gate:** if the client has under 40% of the required skills, the score is capped at 40, so a pair can't rank high on pay/level/location alone.
- **Overview:** headline numbers, pipeline funnel with stage-to-stage conversion, a "needs attention" list (no roles in pipeline, weak best match, or nothing moved in 10+ days), and every client's best open role.
- **Client page:** profile, top matches with a score breakdown bar, plain-language reasons and gaps, missing skills, one-click **Shortlist**, and their pipeline with stage moves.
- **Role page:** what the company wants and the best-fit clients.
- **Pipeline board:** every pair by stage (shortlisted → applied → outreach → interview → offer / rejected).
- **Draft outreach:** writes a short note to the hiring manager for a client–role pair. Uses an LLM if `ANTHROPIC_API_KEY` is set, otherwise a template.

## Stack

Next.js (App Router, TypeScript) · PostgreSQL (raw SQL with `pg`, no ORM) · Tailwind CSS · deployed on Vercel + Neon.

## Data model

```
clients  (id, name, current_title, current_company, seniority 1-6, years_exp,
          current_pay_k, expected_pay_k, skills text[], domain, location, open_to_remote, owner)
roles    (id, company, title, seniority 1-6, pay_min_k, pay_max_k,
          required_skills text[], nice_skills text[], domain, location, remote, is_open)
pipeline (id, client_id → clients, role_id → roles, stage enum, updated_at)   UNIQUE(client_id, role_id)

match_scores  VIEW  client × open role with score, each part's points, matched/missing skills
```

The matching logic is in [`db/matching.sql`](db/matching.sql); every query the app runs is in [`lib/queries.ts`](lib/queries.ts).

## Run it locally

Needs Node 20.12+ and a Postgres database (a free [Neon](https://neon.tech) project works).

```bash
npm install
cp .env.example .env.local      # paste your DATABASE_URL
npm run db:setup                # creates tables + view + seed data
npm run dev                     # http://localhost:3000
```

To regenerate the fake data: `npm run seed:generate` (Python 3), then `npm run db:setup` again.

## Deploy

1. Push to GitHub.
2. Import the repo on [Vercel](https://vercel.com) and add `DATABASE_URL` (and optionally `ANTHROPIC_API_KEY`) as environment variables.
3. Run `npm run db:setup` once from your machine against the Neon database.

## Project structure

```
app/
  page.tsx              overview: stats, funnel, needs attention, all clients
  clients/[id]/page.tsx client profile, best matches, pipeline
  roles/page.tsx        open roles ranked by number of strong fits
  roles/[id]/page.tsx   role details, best-fit clients
  pipeline/page.tsx     board by stage
  actions.ts            server actions: shortlist, move stage
  api/outreach/route.ts outreach draft (LLM or template)
components/             score bar, funnel, match list, small UI pieces
lib/                    db pool, queries (all SQL), types
db/                     schema.sql, matching.sql, seed.sql
scripts/                setup-db.mjs, generate_seed.py
```

## Ideas for next steps

- Weight sliders so the delivery owner can tune what matters per client
- CSV import for real client and role lists
- Weekly report per client (applications sent, interviews booked)
