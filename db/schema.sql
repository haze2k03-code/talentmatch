-- TalentMatch schema
-- Three tables: clients (job seekers we represent), roles (company openings),
-- pipeline (where each client x role pair is in the job search).

DROP VIEW  IF EXISTS match_scores;
DROP TABLE IF EXISTS pipeline;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS clients;
DROP TYPE  IF EXISTS pipeline_stage;

-- Seniority ladder used by both tables:
-- 1 Senior Engineer, 2 Staff/Lead, 3 Manager, 4 Senior Manager, 5 Director, 6 VP
CREATE TABLE clients (
  id               SERIAL PRIMARY KEY,
  name             TEXT    NOT NULL,
  current_title    TEXT    NOT NULL,
  current_company  TEXT    NOT NULL,
  seniority        INT     NOT NULL CHECK (seniority BETWEEN 1 AND 6),
  years_exp        INT     NOT NULL,
  current_pay_k    INT     NOT NULL,          -- current base pay, USD thousands
  expected_pay_k   INT     NOT NULL,          -- minimum pay the client wants
  skills           TEXT[]  NOT NULL,          -- lowercase skill tags
  domain           TEXT    NOT NULL,          -- e.g. fintech, healthcare, saas
  location         TEXT    NOT NULL,
  open_to_remote   BOOLEAN NOT NULL DEFAULT TRUE,
  owner            TEXT    NOT NULL,          -- delivery owner handling this client
  joined_on        DATE    NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE roles (
  id               SERIAL PRIMARY KEY,
  company          TEXT    NOT NULL,
  title            TEXT    NOT NULL,
  seniority        INT     NOT NULL CHECK (seniority BETWEEN 1 AND 6),
  pay_min_k        INT     NOT NULL,
  pay_max_k        INT     NOT NULL,
  required_skills  TEXT[]  NOT NULL,
  nice_skills      TEXT[]  NOT NULL DEFAULT '{}',
  domain           TEXT    NOT NULL,
  location         TEXT    NOT NULL,
  remote           BOOLEAN NOT NULL DEFAULT FALSE,
  is_open          BOOLEAN NOT NULL DEFAULT TRUE,
  posted_on        DATE    NOT NULL DEFAULT CURRENT_DATE,
  CHECK (pay_max_k >= pay_min_k)
);

CREATE TYPE pipeline_stage AS ENUM
  ('shortlisted', 'applied', 'outreach', 'interview', 'offer', 'rejected');

CREATE TABLE pipeline (
  id          SERIAL PRIMARY KEY,
  client_id   INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role_id     INT NOT NULL REFERENCES roles(id)   ON DELETE CASCADE,
  stage       pipeline_stage NOT NULL DEFAULT 'shortlisted',
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  UNIQUE (client_id, role_id)
);

CREATE INDEX idx_clients_skills ON clients USING GIN (skills);
CREATE INDEX idx_roles_skills   ON roles   USING GIN (required_skills);
CREATE INDEX idx_pipeline_stage ON pipeline (stage);
