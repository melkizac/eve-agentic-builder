export const MEMORY_KINDS = [
  "preference",
  "decision",
  "procedure",
  "project_fact",
  "relationship",
  "open_commitment"
] as const;

export const SENSITIVITY_LEVELS = ["normal", "restricted"] as const;

export type MemoryKind = (typeof MEMORY_KINDS)[number];
export type Sensitivity = (typeof SENSITIVITY_LEVELS)[number];

export interface MemoryScope {
  namespace: string;
  tenantId: string;
  userId: string;
  projectId: string;
}

export interface MemoryItem {
  id: string;
  kind: MemoryKind;
  content: string;
  sensitivity: Sensitivity;
  status: "proposed" | "confirmed" | "superseded" | "deleted";
  sourceSessionId: string | null;
  sourceEventId: string | null;
  supersededBy: string | null;
  createdAt: string;
  updatedAt: string;
}
