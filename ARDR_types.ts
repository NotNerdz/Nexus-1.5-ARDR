export type NexusTier = "low" | "high" | "max";
export type TaskType = "code" | "math" | "writing" | "reasoning" | "world_knowledge" | "multi_step" | "data_analysis" | "conversation";

export interface ReasoningBudget {
  taskType: TaskType;
  complexity: "low" | "medium" | "high" | "extreme";
  riskScore: number;
  allowedDepth: number;
  branches: string[];
  chiefModel: string;
}

export interface TriStructurePack {
  symbolic: string;
  invariants: string;
  formal: string;
}

export interface BranchOutput {
  branchName: string;
  hypotheses: string[];
  artifacts: string[];
  notes: string;
  contradictions: string[];
  confidence: number;
}

export interface ScratchpadEntry {
  branch: string;
  timestamp: number;
  content: string;
  type: "hypothesis" | "artifact" | "note" | "contradiction";
}

export interface Scratchpad {
  entries: ScratchpadEntry[];
  sharedArtifacts: Map<string, string>;
}

export interface VerificationResult {
  branchScores: Map<string, number>;
  counterexamples: string[];
  contradictions: string[];
  provenInvariants: string[];
  uncertaintyScore: number;
  weakPoints: string[];
}

export interface ARDRState {
  originalPrompt: string;
  tier: NexusTier;
  budget: ReasoningBudget;
  triPack: TriStructurePack;
  scratchpad: Scratchpad;
  branchOutputs: BranchOutput[];
  verification: VerificationResult;
  recurrenceCount: number;
  finalResponse: string;
}

export interface BranchConfig {
  model: string;
  systemPrompt: string;
}
