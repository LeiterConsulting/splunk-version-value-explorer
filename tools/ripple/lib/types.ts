export type Verdict = "affected" | "not_affected" | "review";
export type Rule = { branch: string; from: string; through: string; fixed: string };
export type Assessment = {
  id: string; cve: string; component: string; title: string; product: string;
  family: string; severity: "Critical" | "High" | "Medium" | "Low" | "Informational";
  verdict: Verdict; relationship: "embedded" | "protocol" | "integration" | "host";
  scope: string; condition: string; action: string; sourceId: string; section: string;
  verifiedAt: string; rules?: Rule[]; feature?: string; reviewRequired?: boolean;
  kev?: boolean; kevDate?: string; rationale: string;
};
export type SourceCheck = { id: string; name: string; url: string; checkedAt: string;
  outcome: "ok" | "changed" | "unavailable"; hash?: string; message: string };
export type Candidate = { id: string; title: string; url: string; origin: string;
  cves: string[]; discoveredAt: string; publishedAt?: string; kev?: boolean };
export type Snapshot = { schemaVersion: 1; records: Assessment[]; candidates: Candidate[];
  checks: SourceCheck[]; lastRun: string | null; storage: "baseline" | "persistent";
  updateStatus: "not_run" | "complete" | "partial"; runs: number };
export type Selection = { version?: string; feature?: "unknown" | "enabled" | "disabled" };
