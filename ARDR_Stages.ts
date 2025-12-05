import { MODELS, colors } from "./ARDR_models";
import { 
  NexusTier, 
  ReasoningBudget, 
  TriStructurePack, 
  BranchOutput, 
  Scratchpad, 
  VerificationResult, 
  ARDRState,
  BranchConfig 
} from "./ARDR_types";
import { log, logSection, callModel, callModelStreaming, parseJsonFromResponse } from "./ARDR_utils";

export async function stage0_TaskProfiler(
  prompt: string, 
  tier: NexusTier, 
  debug: boolean
): Promise<ReasoningBudget> {
  logSection("STAGE 0: Task Profiler & Budget Allocator");
  log("Profiler", "Analyzing task complexity and allocating reasoning budget...", colors.cyan);

  const systemPrompt = `You are a Task Profiler for an advanced AI reasoning system. Analyze the user's request and output a JSON object with:
- taskType: one of "code", "math", "writing", "reasoning", "world_knowledge", "multi_step", "data_analysis", "conversation"
  - Use "conversation" for: greetings, casual chat, simple questions, introductions, emotional support, small talk
  - Use other types only for actual tasks that need deep reasoning
- complexity: one of "low", "medium", "high", "extreme"
- riskScore: 0.0 to 1.0 (hallucination risk)
- allowedDepth: 1-3 (reasoning passes allowed)
- requiredBranches: array of needed branch types from ["logic", "pattern", "world", "code", "adversarial"]
  - For "conversation" type, use empty array []

Be concise. Output ONLY valid JSON, no explanation.`;

  const response = await callModel(MODELS.profiler, systemPrompt, `Analyze this task:\n\n${prompt}`);
  
  let budget: ReasoningBudget;
  const parsed = parseJsonFromResponse(response);
  
  if (parsed) {
    budget = {
      taskType: parsed.taskType || "reasoning",
      complexity: parsed.complexity || "medium",
      riskScore: parsed.riskScore || 0.5,
      allowedDepth: Math.min(parsed.allowedDepth || 2, tier === "max" ? 3 : tier === "high" ? 2 : 1),
      branches: parsed.requiredBranches || ["logic", "world"],
      chiefModel: tier === "max" ? MODELS.chiefMax : tier === "high" ? MODELS.chiefHigh : MODELS.chiefLow
    };
  } else {
    budget = {
      taskType: "reasoning",
      complexity: "medium",
      riskScore: 0.5,
      allowedDepth: tier === "max" ? 3 : tier === "high" ? 2 : 1,
      branches: ["logic", "world", "code"],
      chiefModel: tier === "max" ? MODELS.chiefMax : tier === "high" ? MODELS.chiefHigh : MODELS.chiefLow
    };
  }

  if (debug) {
    console.log(`${colors.dim}Budget:${colors.reset}`, JSON.stringify(budget, null, 2));
  }

  log("Profiler", `Task: ${budget.taskType} | Complexity: ${budget.complexity} | Risk: ${budget.riskScore.toFixed(2)} | Depth: ${budget.allowedDepth}`, colors.green);
  log("Profiler", `Branches: ${budget.branches.join(", ")}`, colors.green);

  return budget;
}

export async function stageA_StructuredDecomposition(
  prompt: string, 
  budget: ReasoningBudget, 
  debug: boolean
): Promise<TriStructurePack> {
  logSection("STAGE A: Structured Decomposition Layer");
  log("Decomposer", "Creating Tri-Structure Pack...", colors.cyan);

  const [symbolic, invariants, formal] = await Promise.all([
    (async () => {
      log("Symbolic", "Extracting entities, relations, and operations...", colors.yellow);
      return await callModel(
        MODELS.cheap,
        `You are a Symbolic Abstractor. Convert the problem into symbolic form:
- Identify key entities/variables
- Extract relationships between them
- Define operations and transformations needed
- Express constraints in logical notation
Keep output under 400 tokens. Be precise and formal.`,
        `Extract symbolic structure from:\n\n${prompt}`
      );
    })(),

    (async () => {
      log("Invariants", "Extracting core invariants and constraints...", colors.yellow);
      return await callModel(
        MODELS.cheap,
        `You are an Invariant Reducer. Extract the core invariants:
- What must remain true throughout the solution?
- What are the hard constraints?
- What can be simplified or removed as noise?
- What dependencies exist between components?
Keep output under 400 tokens. Focus on what cannot change.`,
        `Extract invariants from:\n\n${prompt}`
      );
    })(),

    (async () => {
      log("Formalizer", "Creating formal specification...", colors.yellow);
      return await callModel(
        MODELS.cheap,
        `You are a Formalizer. Create a formal representation:
- For code: input/output contracts, algorithm sketch, data structures
- For math: equations, proofs outline, theorems to apply
- For writing: structure outline, key arguments, logical flow
- For reasoning: decision tree, evaluation criteria, success metrics
Keep output under 400 tokens. Use pseudo-code or formal notation.`,
        `Formalize this problem:\n\n${prompt}`
      );
    })()
  ]);

  const triPack: TriStructurePack = { symbolic, invariants, formal };

  if (debug) {
    console.log(`\n${colors.dim}=== TRI-STRUCTURE PACK ===${colors.reset}`);
    console.log(`${colors.cyan}[Symbolic]${colors.reset}\n${symbolic.slice(0, 500)}...`);
    console.log(`${colors.cyan}[Invariants]${colors.reset}\n${invariants.slice(0, 500)}...`);
    console.log(`${colors.cyan}[Formal]${colors.reset}\n${formal.slice(0, 500)}...`);
  }

  log("Decomposer", "Tri-Structure Pack complete", colors.green);
  return triPack;
}

export async function stageB_DendriticBranches(
  prompt: string, 
  triPack: TriStructurePack, 
  budget: ReasoningBudget,
  scratchpad: Scratchpad,
  debug: boolean
): Promise<BranchOutput[]> {
  logSection("STAGE B: Dendritic Branch Network");
  log("Branches", `Activating ${budget.branches.length} specialized branches...`, colors.cyan);

  const branchConfigs: Record<string, BranchConfig> = {
    logic: {
      model: MODELS.logic,
      systemPrompt: `You are the Logic Branch of a reasoning network. Analyze using formal logic:
- Apply deductive reasoning
- Check for logical fallacies
- Build proof chains
- Identify necessary and sufficient conditions
Output JSON: { "hypotheses": [...], "artifacts": [...], "notes": "...", "contradictions": [...], "confidence": 0.0-1.0 }`
    },
    pattern: {
      model: MODELS.pattern,
      systemPrompt: `You are the Pattern Branch of a reasoning network. Analyze patterns and structures:
- Identify recurring patterns
- Find analogies to known problems
- Detect spatial/temporal relationships
- Recognize transformations
Output JSON: { "hypotheses": [...], "artifacts": [...], "notes": "...", "contradictions": [...], "confidence": 0.0-1.0 }`
    },
    world: {
      model: MODELS.world,
      systemPrompt: `You are the World Knowledge Branch of a reasoning network. Apply real-world knowledge:
- Verify factual claims
- Apply domain expertise
- Check temporal consistency
- Validate against known principles
Output JSON: { "hypotheses": [...], "artifacts": [...], "notes": "...", "contradictions": [...], "confidence": 0.0-1.0 }`
    },
    code: {
      model: MODELS.code,
      systemPrompt: `You are the Code/Algorithm Branch of a reasoning network. Focus on implementation:
- Design algorithms
- Write code solutions
- Optimize for efficiency
- Handle edge cases
Output JSON: { "hypotheses": [...], "artifacts": [...], "notes": "...", "contradictions": [...], "confidence": 0.0-1.0 }`
    },
    adversarial: {
      model: MODELS.adversarial,
      systemPrompt: `You are the Adversarial Branch of a reasoning network. Challenge everything:
- Find counterexamples
- Stress test assumptions
- Identify failure modes
- Attack weak arguments
Output JSON: { "hypotheses": [...], "artifacts": [...], "notes": "...", "contradictions": [...], "confidence": 0.0-1.0 }`
    }
  };

  const contextPack = `
=== SYMBOLIC STRUCTURE ===
${triPack.symbolic}

=== INVARIANTS ===
${triPack.invariants}

=== FORMAL SPECIFICATION ===
${triPack.formal}

=== ORIGINAL QUERY ===
${prompt}
`;

  const branchPromises = budget.branches.map(async (branchName) => {
    const config = branchConfigs[branchName];
    if (!config) return null;

    log(branchName.toUpperCase(), "Processing...", colors.yellow);
    
    const response = await callModel(config.model, config.systemPrompt, contextPack, 800);

    let output: BranchOutput;
    const parsed = parseJsonFromResponse(response);
    
    if (parsed) {
      output = {
        branchName,
        hypotheses: parsed.hypotheses || [],
        artifacts: parsed.artifacts || [],
        notes: parsed.notes || "",
        contradictions: parsed.contradictions || [],
        confidence: parsed.confidence || 0.5
      };
    } else {
      output = {
        branchName,
        hypotheses: [response.slice(0, 500)],
        artifacts: [],
        notes: response,
        contradictions: [],
        confidence: 0.5
      };
    }

    scratchpad.entries.push({
      branch: branchName,
      timestamp: Date.now(),
      content: output.notes,
      type: "note"
    });
    output.hypotheses.forEach(h => {
      scratchpad.entries.push({
        branch: branchName,
        timestamp: Date.now(),
        content: h,
        type: "hypothesis"
      });
    });

    log(branchName.toUpperCase(), `Done (confidence: ${output.confidence.toFixed(2)})`, colors.green);
    return output;
  });

  const results = await Promise.all(branchPromises);
  const branchOutputs = results.filter((r): r is BranchOutput => r !== null);

  if (debug) {
    console.log(`\n${colors.dim}=== BRANCH OUTPUTS ===${colors.reset}`);
    branchOutputs.forEach(b => {
      console.log(`${colors.cyan}[${b.branchName}]${colors.reset} Confidence: ${b.confidence}, Hypotheses: ${b.hypotheses.length}`);
    });
  }

  log("Branches", "Running micro-reflection on shared scratchpad...", colors.cyan);
  
  return branchOutputs;
}

export async function stageC_Verification(
  prompt: string,
  triPack: TriStructurePack,
  branchOutputs: BranchOutput[],
  scratchpad: Scratchpad,
  debug: boolean
): Promise<VerificationResult> {
  logSection("STAGE C: Verification Layer & Uncertainty Engine");
  log("Verifier", "Attacking hypotheses and calculating uncertainty...", colors.cyan);

  const allHypotheses = branchOutputs.flatMap(b => b.hypotheses.map(h => `[${b.branchName}] ${h}`));
  const allContradictions = branchOutputs.flatMap(b => b.contradictions);
  
  const verificationContext = `
=== ORIGINAL QUERY ===
${prompt}

=== INVARIANTS ===
${triPack.invariants}

=== HYPOTHESES FROM BRANCHES ===
${allHypotheses.map((h, i) => `${i + 1}. ${h}`).join("\n")}

=== IDENTIFIED CONTRADICTIONS ===
${allContradictions.join("\n") || "None identified"}

=== SCRATCHPAD NOTES ===
${scratchpad.entries.slice(-10).map(e => `[${e.branch}] ${e.content.slice(0, 200)}`).join("\n")}
`;

  const [counterexampleResult, consistencyResult] = await Promise.all([
    (async () => {
      log("Counterexamples", "Generating counterexamples...", colors.yellow);
      return await callModel(
        MODELS.cheap,
        `You are a Counterexample Generator. For each hypothesis, try to find a counterexample that disproves it.
Output JSON: { "counterexamples": ["counterexample1", ...], "failed_hypotheses": [1, 3, ...] }`,
        verificationContext,
        600
      );
    })(),

    (async () => {
      log("Consistency", "Scoring consistency and coverage...", colors.yellow);
      return await callModel(
        MODELS.cheap,
        `You are a Consistency Scorer. Evaluate the hypotheses:
- Check for internal contradictions
- Score coverage (are all aspects addressed?)
- Identify proven invariants
- Calculate overall uncertainty (0.0 = certain, 1.0 = highly uncertain)
Output JSON: { "branch_scores": {"logic": 0.8, "code": 0.6, ...}, "proven_invariants": [...], "weak_points": [...], "uncertainty": 0.5 }`,
        verificationContext,
        600
      );
    })()
  ]);

  let counterexamples: string[] = [];
  let branchScores = new Map<string, number>();
  let provenInvariants: string[] = [];
  let weakPoints: string[] = [];
  let uncertaintyScore = 0.5;

  const ceParsed = parseJsonFromResponse(counterexampleResult);
  if (ceParsed) {
    counterexamples = ceParsed.counterexamples || [];
  }

  const csParsed = parseJsonFromResponse(consistencyResult);
  if (csParsed) {
    if (csParsed.branch_scores) {
      Object.entries(csParsed.branch_scores).forEach(([k, v]) => {
        branchScores.set(k, v as number);
      });
    }
    provenInvariants = csParsed.proven_invariants || [];
    weakPoints = csParsed.weak_points || [];
    uncertaintyScore = csParsed.uncertainty || 0.5;
  }

  const avgConfidence = branchOutputs.reduce((sum, b) => sum + b.confidence, 0) / branchOutputs.length;
  uncertaintyScore = (uncertaintyScore + (1 - avgConfidence)) / 2;

  const result: VerificationResult = {
    branchScores,
    counterexamples,
    contradictions: allContradictions,
    provenInvariants,
    uncertaintyScore,
    weakPoints
  };

  if (debug) {
    console.log(`\n${colors.dim}=== VERIFICATION RESULT ===${colors.reset}`);
    console.log(`Uncertainty: ${uncertaintyScore.toFixed(3)}`);
    console.log(`Counterexamples: ${counterexamples.length}`);
    console.log(`Weak points: ${weakPoints.join(", ") || "None"}`);
  }

  log("Verifier", `Uncertainty: ${uncertaintyScore.toFixed(3)} | Counterexamples: ${counterexamples.length} | Weak points: ${weakPoints.length}`, 
    uncertaintyScore > 0.6 ? colors.red : uncertaintyScore > 0.4 ? colors.yellow : colors.green);

  return result;
}

export async function stageD_AdaptiveRecurrence(
  prompt: string,
  triPack: TriStructurePack,
  branchOutputs: BranchOutput[],
  scratchpad: Scratchpad,
  verification: VerificationResult,
  budget: ReasoningBudget,
  recurrenceCount: number,
  debug: boolean
): Promise<{ shouldRecur: boolean; updatedBranches: BranchOutput[] }> {
  logSection("STAGE D: Adaptive Recurrence Pass");

  const UNCERTAINTY_THRESHOLD = 0.55;
  const MIN_BRANCH_SCORE = 0.5;

  if (verification.uncertaintyScore < UNCERTAINTY_THRESHOLD && 
      verification.weakPoints.length === 0) {
    log("Recurrence", "Uncertainty below threshold, skipping recurrence (fast path)", colors.green);
    return { shouldRecur: false, updatedBranches: branchOutputs };
  }

  if (recurrenceCount >= budget.allowedDepth) {
    log("Recurrence", `Max depth reached (${recurrenceCount}/${budget.allowedDepth}), proceeding to synthesis`, colors.yellow);
    return { shouldRecur: false, updatedBranches: branchOutputs };
  }

  log("Recurrence", `Pass ${recurrenceCount + 1}/${budget.allowedDepth} - Targeting weak branches...`, colors.cyan);

  const weakBranches = branchOutputs.filter(b => {
    const score = verification.branchScores.get(b.branchName) || b.confidence;
    return score < MIN_BRANCH_SCORE || verification.weakPoints.some(wp => wp.includes(b.branchName));
  });

  if (weakBranches.length === 0) {
    log("Recurrence", "No weak branches identified, proceeding to synthesis", colors.green);
    return { shouldRecur: false, updatedBranches: branchOutputs };
  }

  log("Recurrence", `Re-running ${weakBranches.length} weak branches: ${weakBranches.map(b => b.branchName).join(", ")}`, colors.yellow);

  const instructionPrompt = `Based on these issues, generate specific improvement instructions for each weak branch:

Weak points: ${verification.weakPoints.join(", ")}
Counterexamples found: ${verification.counterexamples.slice(0, 3).join("; ")}
Branches to improve: ${weakBranches.map(b => b.branchName).join(", ")}

Output JSON: { "instructions": { "branchName": "specific instruction", ... } }`;

  const instructionResult = await callModel(MODELS.cheap, 
    "You are a Reasoning Controller. Generate specific, targeted instructions for branches that need improvement.",
    instructionPrompt, 400);

  let instructions: Record<string, string> = {};
  const parsed = parseJsonFromResponse(instructionResult);
  if (parsed) {
    instructions = parsed.instructions || {};
  }

  const updatedBranchPromises = branchOutputs.map(async (branch) => {
    if (!weakBranches.find(wb => wb.branchName === branch.branchName)) {
      return branch;
    }

    const instruction = instructions[branch.branchName] || "Re-analyze with more rigor";
    log(branch.branchName.toUpperCase(), `Re-running: ${instruction.slice(0, 50)}...`, colors.magenta);

    const refinedContext = `
PREVIOUS ANALYSIS: ${branch.notes}
COUNTEREXAMPLES TO ADDRESS: ${verification.counterexamples.slice(0, 2).join("; ")}
SPECIFIC INSTRUCTION: ${instruction}

ORIGINAL PROBLEM:
${prompt}

Provide an improved analysis. Output JSON: { "hypotheses": [...], "artifacts": [...], "notes": "...", "contradictions": [...], "confidence": 0.0-1.0 }`;

    const model = branch.branchName === "code" ? MODELS.code : MODELS.cheap;
    const response = await callModel(model, 
      `You are the ${branch.branchName} reasoning branch. Improve your previous analysis based on the feedback.`,
      refinedContext, 800);

    const refined = parseJsonFromResponse(response);
    if (refined) {
      return {
        branchName: branch.branchName,
        hypotheses: refined.hypotheses || branch.hypotheses,
        artifacts: refined.artifacts || branch.artifacts,
        notes: refined.notes || response,
        contradictions: refined.contradictions || [],
        confidence: Math.min((refined.confidence || branch.confidence) + 0.1, 0.95)
      };
    }

    return { ...branch, confidence: branch.confidence + 0.1 };
  });

  const updatedBranches = await Promise.all(updatedBranchPromises);
  log("Recurrence", `Completed pass ${recurrenceCount + 1}`, colors.green);

  return { shouldRecur: true, updatedBranches };
}

export async function stageFinal_GrandSynthesis(
  prompt: string,
  state: ARDRState,
  debug: boolean
): Promise<string> {
  logSection("FINAL STAGE: Grand Synthesizer");
  
  const tierLabel = state.tier === "max" ? "Max (Opus 4.5)" : 
                    state.tier === "high" ? "High (Deepseek V3.2)" : "Low (Llama 3.3 70B)";
  log("Synthesizer", `${tierLabel} synthesizing final response...`, colors.cyan);

  const evidenceLedger = `
=== EVIDENCE LEDGER ===

[Task Profile]
Type: ${state.budget.taskType}
Complexity: ${state.budget.complexity}
Risk Score: ${state.budget.riskScore}
Recurrence Passes: ${state.recurrenceCount}

[Structured Views]
Symbolic: ${state.triPack.symbolic.slice(0, 300)}...
Invariants: ${state.triPack.invariants.slice(0, 300)}...
Formal: ${state.triPack.formal.slice(0, 300)}...

[Branch Findings]
${state.branchOutputs.map(b => `
[${b.branchName.toUpperCase()}] (confidence: ${b.confidence.toFixed(2)})
Hypotheses: ${b.hypotheses.slice(0, 3).join("; ")}
Key artifacts: ${b.artifacts.slice(0, 2).join("; ") || "None"}
`).join("\n")}

[Verification Results]
Uncertainty: ${state.verification.uncertaintyScore.toFixed(3)}
Proven Invariants: ${state.verification.provenInvariants.join(", ") || "None proven"}
Counterexamples Found: ${state.verification.counterexamples.length}
Remaining Weak Points: ${state.verification.weakPoints.join(", ") || "None"}
Contradictions Resolved: ${state.verification.contradictions.length}

[Scratchpad Highlights]
${state.scratchpad.entries.slice(-5).map(e => `[${e.branch}] ${e.content.slice(0, 150)}`).join("\n")}
`;

  const systemPrompt = `You are the ARDR Grand Synthesizer (${tierLabel}).

You have received clean, verified evidence from a multi-stage reasoning pipeline:
1. A Task Profiler classified this problem
2. A Decomposition Layer created structured views
3. Multiple specialized branches reasoned in parallel with a shared scratchpad
4. A Verification Layer attacked hypotheses and measured uncertainty
5. Adaptive Recurrence refined weak points

Your job: Synthesize a final, coherent response that is:
- Comprehensive but concise
- Multi-proofed and contradiction-free
- Leveraging the best insights from each branch
- Honest about remaining uncertainties

For code tasks: Provide complete, working code
For writing tasks: Deliver polished, structured prose
For reasoning tasks: Show clear logical chains
For math tasks: Include formal proofs where appropriate

Do not mention the internal pipeline or stages. Respond directly to the user's query.`;

  console.log(`\n${colors.bright}${colors.green}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.green}                       ARDR RESPONSE                          ${colors.reset}`);
  console.log(`${colors.bright}${colors.green}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  const maxTokens = state.tier === "max" ? 8000 : state.tier === "high" ? 4000 : 2000;
  
  const response = await callModelStreaming(
    state.budget.chiefModel,
    systemPrompt,
    `${evidenceLedger}\n\n=== ORIGINAL USER QUERY ===\n${prompt}`,
    maxTokens
  );

  return response;
}

export async function handleConversation(prompt: string, tier: NexusTier): Promise<string> {
  console.log(`\n${colors.bright}${colors.green}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.green}                       ARDR RESPONSE                          ${colors.reset}`);
  console.log(`${colors.bright}${colors.green}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  const chiefModel = tier === "max" ? MODELS.chiefMax : tier === "high" ? MODELS.chiefHigh : MODELS.chiefLow;
  
  const systemPrompt = `You are ARDR, a friendly and capable AI assistant. You can help with:
- Casual conversation and chat
- Coding and programming tasks
- Writing and creative work
- Analysis and reasoning
- Answering questions

Be natural, warm, and helpful. Match the user's tone - if they're casual, be casual. If they need help with something, offer to assist.`;

  const response = await callModelStreaming(chiefModel, systemPrompt, prompt, 1500);
  return response;
}
