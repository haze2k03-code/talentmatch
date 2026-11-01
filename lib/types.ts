export const STAGES = ["shortlisted", "applied", "outreach", "interview", "offer", "rejected"] as const;
export type Stage = (typeof STAGES)[number];

export const LEVEL_NAMES: Record<number, string> = {
  1: "Senior IC",
  2: "Staff / Lead",
  3: "Manager",
  4: "Senior Manager",
  5: "Director",
  6: "VP / C-level",
};

export interface ClientRow {
  id: number;
  name: string;
  current_title: string;
  current_company: string;
  seniority: number;
  years_exp: number;
  current_pay_k: number;
  expected_pay_k: number;
  skills: string[];
  domain: string;
  location: string;
  open_to_remote: boolean;
  owner: string;
  joined_on: string;
}

export interface RoleRow {
  id: number;
  company: string;
  title: string;
  seniority: number;
  pay_min_k: number;
  pay_max_k: number;
  required_skills: string[];
  nice_skills: string[];
  domain: string;
  location: string;
  remote: boolean;
  is_open: boolean;
  posted_on: string;
}

export interface MatchRow {
  client_id: number;
  role_id: number;
  score: number;
  skills_gated: boolean;
  skills_pts: number;
  level_pts: number;
  pay_pts: number;
  context_pts: number;
  matched_skills: string[];
  missing_skills: string[];
  level_gap: number;
  pay_uplift_pct: number;
  same_domain: boolean;
  location_ok: boolean;
  role_title: string;
  company: string;
  pay_min_k: number;
  pay_max_k: number;
  location: string;
  remote: boolean;
  client_name: string;
  stage: Stage | null;
}

export interface OverviewStats {
  clients: number;
  open_roles: number;
  interviews: number;
  offers: number;
  active_pairs: number;
}

export interface FunnelStep {
  stage: Stage;
  reached: number;
}

export interface ClientSummary {
  id: number;
  name: string;
  current_title: string;
  current_company: string;
  seniority: number;
  owner: string;
  best_score: number | null;
  best_role_id: number | null;
  best_role_title: string | null;
  best_role_company: string | null;
  active_count: number;
  interview_count: number;
  offer_count: number;
  last_activity: Date | null;
  attention_reason: string | null;
}

export interface RoleSummary {
  id: number;
  company: string;
  title: string;
  seniority: number;
  pay_min_k: number;
  pay_max_k: number;
  location: string;
  remote: boolean;
  strong_fits: number;
  best_score: number;
}

export interface PipelineCard {
  id: number;
  client_id: number;
  role_id: number;
  stage: Stage;
  updated_at: Date;
  client_name: string;
  owner: string;
  role_title: string;
  company: string;
  score: number | null;
}
