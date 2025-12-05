#!/usr/bin/env npx tsx
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ARDR - Adaptive Recurrent Dendritic Reasoning (High Mode)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * A multi-stage reasoning pipeline that orchestrates multiple AI models in parallel
 * for superior synthesis and analysis capabilities.
 * 
 * SETUP:
 * 1. Get your OpenRouter API key from https://openrouter.ai/keys
 * 2. Replace "YOUR_OPENROUTER_API_KEY" below with your actual key
 * 3. Run with: npx tsx scripts/ardr/ARDR.ts
 * 
 * OPTIONS:
 *   --tier low|high|max    Set reasoning tier (default: high)
 *   --debug                Show detailed debug output
 * 
 * EXAMPLES:
 *   npx tsx scripts/ardr/ARDR.ts                    # Interactive mode, high tier
 *   npx tsx scripts/ardr/ARDR.ts --tier max         # Use max tier (Opus 4.5)
 *   npx tsx scripts/ardr/ARDR.ts --tier low --debug # Low tier with debug output
 * 
 * IN-SESSION COMMANDS:
 *   tier low|high|max      Switch reasoning tier
 *   debug                  Toggle debug mode
 *   exit / quit            End session
 * 
 * PIPELINE STAGES:
 *   Stage 0: Task Profiler - Analyzes complexity and allocates reasoning budget
 *   Stage A: Structured Decomposition - Creates symbolic/invariant/formal views
 *   Stage B: Dendritic Branches - Parallel specialized reasoning (logic, pattern, world, code, adversarial)
 *   Stage C: Verification - Attacks hypotheses and measures uncertainty
 *   Stage D: Adaptive Recurrence - Re-runs weak branches with targeted instructions
 *   Final:   Grand Synthesis - Chief model synthesizes verified evidence into response
 * 
 * MODELS BY TIER:
 *   Low:  Llama 3.3 70B (free)
 *   High: Deepseek V3.2
 *   Max:  Claude Opus 4.5
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import * as readline from "readline";
import { NexusTier, ARDRState } from "./ARDR_types";
import { colors } from "./ARDR_models";
import { initializeOpenAI, log } from "./ARDR_utils";
import { 
  stage0_TaskProfiler, 
  stageA_StructuredDecomposition, 
  stageB_DendriticBranches,
  stageC_Verification,
  stageD_AdaptiveRecurrence,
  stageFinal_GrandSynthesis,
  handleConversation
} from "./ARDR_stages";

const OPENROUTER_API_KEY = "YOUR_OPENROUTER_API_KEY";

if (OPENROUTER_API_KEY === "YOUR_OPENROUTER_API_KEY") {
  console.error(`
${colors.red}${colors.bright}Error: API key not configured${colors.reset}

Please edit ${colors.cyan}scripts/ardr/ARDR.ts${colors.reset} and replace:
  ${colors.dim}const OPENROUTER_API_KEY = "YOUR_OPENROUTER_API_KEY";${colors.reset}

With your actual OpenRouter API key from:
  ${colors.cyan}https://openrouter.ai/keys${colors.reset}
`);
  process.exit(1);
}

initializeOpenAI(OPENROUTER_API_KEY);

async function runARDR(prompt: string, tier: NexusTier, debug: boolean): Promise<string> {
  console.log(`\n${colors.bgMagenta}${colors.white}${colors.bright} ARDR - ${tier.toUpperCase()} MODE ${colors.reset}\n`);
  
  const state: ARDRState = {
    originalPrompt: prompt,
    tier,
    budget: null as any,
    triPack: null as any,
    scratchpad: { entries: [], sharedArtifacts: new Map() },
    branchOutputs: [],
    verification: null as any,
    recurrenceCount: 0,
    finalResponse: ""
  };

  state.budget = await stage0_TaskProfiler(prompt, tier, debug);

  if (state.budget.taskType === "conversation" || state.budget.branches.length === 0) {
    log("Profiler", "Detected conversational input - using fast path", colors.green);
    return await handleConversation(prompt, tier);
  }

  state.triPack = await stageA_StructuredDecomposition(prompt, state.budget, debug);

  state.branchOutputs = await stageB_DendriticBranches(
    prompt, state.triPack, state.budget, state.scratchpad, debug
  );

  state.verification = await stageC_Verification(
    prompt, state.triPack, state.branchOutputs, state.scratchpad, debug
  );

  let shouldContinue = true;
  while (shouldContinue && state.recurrenceCount < state.budget.allowedDepth) {
    const recurrenceResult = await stageD_AdaptiveRecurrence(
      prompt, state.triPack, state.branchOutputs, state.scratchpad,
      state.verification, state.budget, state.recurrenceCount, debug
    );
    
    state.branchOutputs = recurrenceResult.updatedBranches;
    
    if (recurrenceResult.shouldRecur) {
      state.recurrenceCount++;
      state.verification = await stageC_Verification(
        prompt, state.triPack, state.branchOutputs, state.scratchpad, debug
      );
    } else {
      shouldContinue = false;
    }
  }

  state.finalResponse = await stageFinal_GrandSynthesis(prompt, state, debug);

  return state.finalResponse;
}

async function main() {
  const args = process.argv.slice(2);
  const tier: NexusTier = args.includes("--tier") 
    ? (args[args.indexOf("--tier") + 1] as NexusTier) || "high"
    : "high";
  const debug = args.includes("--debug");

  console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ${colors.white} █████╗ ██████╗ ██████╗ ██████╗ ${colors.cyan}                        ║
║     ${colors.white}██╔══██╗██╔══██╗██╔══██╗██╔══██╗${colors.cyan}                        ║
║     ${colors.white}███████║██████╔╝██║  ██║██████╔╝${colors.cyan}                        ║
║     ${colors.white}██╔══██║██╔══██╗██║  ██║██╔══██╗${colors.cyan}                        ║
║     ${colors.white}██║  ██║██║  ██║██████╔╝██║  ██║${colors.cyan}                        ║
║     ${colors.white}╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝${colors.cyan}                        ║
║                                                               ║
║          ${colors.yellow}Adaptive Recurrent Dendritic Reasoning${colors.cyan}              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}

${colors.dim}Tier: ${tier.toUpperCase()} | Debug: ${debug ? "ON" : "OFF"}${colors.reset}
${colors.dim}Type your query or 'exit' to quit. Use 'tier low|high|max' to switch.${colors.reset}
`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let currentTier = tier;
  let currentDebug = debug;
  let isClosed = false;

  rl.on('close', () => {
    isClosed = true;
    console.log(`\n${colors.cyan}Session ended.${colors.reset}\n`);
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log(`\n${colors.cyan}Interrupted. Goodbye!${colors.reset}\n`);
    rl.close();
    process.exit(0);
  });

  const promptUser = () => {
    if (isClosed) return;
    
    rl.question(`\n${colors.bright}${colors.green}You [${currentTier.toUpperCase()}]>${colors.reset} `, async (input) => {
      if (isClosed) return;
      
      const trimmed = input?.trim() || "";
      
      if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
        console.log(`\n${colors.cyan}Goodbye!${colors.reset}\n`);
        rl.close();
        process.exit(0);
      }

      if (trimmed.toLowerCase().startsWith("tier ")) {
        const newTier = trimmed.slice(5).toLowerCase() as NexusTier;
        if (["low", "high", "max"].includes(newTier)) {
          currentTier = newTier;
          console.log(`${colors.green}Switched to ${newTier.toUpperCase()} mode${colors.reset}`);
        } else {
          console.log(`${colors.red}Invalid tier. Use: low, high, or max${colors.reset}`);
        }
        if (!isClosed) promptUser();
        return;
      }

      if (trimmed.toLowerCase() === "debug") {
        currentDebug = !currentDebug;
        console.log(`${colors.yellow}Debug mode: ${currentDebug ? "ON" : "OFF"}${colors.reset}`);
        if (!isClosed) promptUser();
        return;
      }

      if (!trimmed) {
        if (!isClosed) promptUser();
        return;
      }

      try {
        await runARDR(trimmed, currentTier, currentDebug);
      } catch (error: any) {
        console.log(`\n${colors.red}Error: ${error.message}${colors.reset}`);
      }

      if (!isClosed) promptUser();
    });
  };

  promptUser();
}

main().catch(console.error);
