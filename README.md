# Nexus-1.5-ARDR
The Strongest Reasoning AI Architecture Ever.

ARDR - Adaptive Recurrent Dendritic Reasoning
A multi-stage AI reasoning pipeline that orchestrates multiple models in parallel for superior synthesis and deep analysis capabilities.

Features
Multi-Model Orchestration - Coordinates specialized AI models working in parallel
6-Stage Pipeline - Task profiling, decomposition, parallel branches, verification, adaptive recurrence, and synthesis
Adaptive Reasoning - Automatically adjusts depth based on task complexity
Uncertainty Quantification - Attacks its own hypotheses and measures confidence
Streaming Responses - Real-time output from the final synthesizer
Tier System - Low (free), High, and Max tiers with different chief models
Conversational Fast-Path - Skips heavy reasoning for casual chat
Installation
# Clone the repository
git clone https://github.com/yourusername/ardr.git
cd ardr
# Install dependencies
npm install openai

Setup
Option 1: Environment Variable (Recommended)
export OPENROUTER_API_KEY="your-api-key-here"
npx tsx ARDR.ts

Option 2: Direct Edit
Open ARDR.ts and replace:

const OPENROUTER_API_KEY = "YOUR_OPENROUTER_API_KEY";

With your actual API key from OpenRouter.

Usage
# Interactive mode (default: high tier)
npx tsx ARDR.ts
# Specify tier
npx tsx ARDR.ts --tier max
# Enable debug output
npx tsx ARDR.ts --tier high --debug

In-Session Commands
Command	Description
tier low|high|max	Switch reasoning tier
debug	Toggle debug output
exit or quit	End session
Pipeline Architecture
┌─────────────────────────────────────────────────────────────────┐
│                         User Query                               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 0: Task Profiler                                          │
│  • Classifies task type (code, math, writing, reasoning, etc.)  │
│  • Estimates complexity and hallucination risk                   │
│  • Allocates reasoning budget and selects branches               │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │   Conversational?     │
                    └───────────┬───────────┘
                          Yes   │   No
                    ┌───────────┘   └───────────┐
                    ▼                           ▼
            ┌───────────────┐    ┌─────────────────────────────────┐
            │  Fast Path    │    │  STAGE A: Structured Decomposition│
            │  (Direct)     │    │  • Symbolic Abstractor            │
            └───────────────┘    │  • Invariant Reducer              │
                                 │  • Formalizer                     │
                                 └─────────────────────────────────┘
                                                 │
                                                 ▼
                                 ┌─────────────────────────────────┐
                                 │  STAGE B: Dendritic Branches     │
                                 │  ┌─────┐ ┌─────┐ ┌─────┐        │
                                 │  │Logic│ │World│ │Code │  ...   │
                                 │  └─────┘ └─────┘ └─────┘        │
                                 │  (Parallel execution + scratchpad)│
                                 └─────────────────────────────────┘
                                                 │
                                                 ▼
                                 ┌─────────────────────────────────┐
                                 │  STAGE C: Verification Layer     │
                                 │  • Counterexample generation     │
                                 │  • Consistency scoring           │
                                 │  • Uncertainty quantification    │
                                 └─────────────────────────────────┘
                                                 │
                                    ┌────────────┴────────────┐
                                    │  High Uncertainty?       │
                                    │  Weak Branches?          │
                                    └────────────┬────────────┘
                                           Yes   │   No
                                    ┌────────────┘   └────────────┐
                                    ▼                             │
                    ┌─────────────────────────────────┐           │
                    │  STAGE D: Adaptive Recurrence    │           │
                    │  • Generate targeted instructions │           │
                    │  • Re-run weak branches          │           │
                    │  • Loop until threshold met      │           │
                    └─────────────────────────────────┘           │
                                    │                             │
                                    └──────────────┬──────────────┘
                                                   ▼
                                 ┌─────────────────────────────────┐
                                 │  FINAL: Grand Synthesizer        │
                                 │  • Compiles evidence ledger      │
                                 │  • Chief model synthesizes       │
                                 │  • Streaming response output     │
                                 └─────────────────────────────────┘
# MODEL CONFIGURATION

**Branch Models**

Profiler uses Llama 3.3 70B for task classification.

Logic uses Gemini 2.0 Flash for deductive reasoning.

Pattern uses Gemini 2.0 Flash for pattern recognition.

World uses GPT-4.1 Mini for factual verification.

Code uses Claude Sonnet 4 for algorithm design.

Adversarial uses Gemini 2.0 Flash for generating counterexamples.

**Chief Models by Tier**

Low Tier uses Llama 3.3 70B. It's free and best for quick queries and testing.

High Tier uses Deepseek V3.2. Moderate cost, best for complex reasoning.

Max Tier uses Claude Opus 4. Premium cost, best for mission-critical tasks.

**FILE STRUCTURE**

`ARDR.ts` is the main entry point with CLI.

`ARDR_types.ts` contains TypeScript type definitions.
`
ARDR_models.ts` has model and color configuration.

`ARDR_utils.ts` contains the OpenAI client and utilities.

`ARDR_stages.ts` has all pipeline stage implementations.

`index.ts` provides module exports.

**HOW IT WORKS**

1. Task Profiler analyzes your query to determine task type, complexity, and which specialized branches are needed.

2. Structured Decomposition creates three views of the problem: Symbolic (entities, relations, logical constraints), Invariants (what must remain true), and Formal (contracts, algorithms, data structures).

3. Dendritic Branches run in parallel. Logic applies deductive reasoning. Pattern finds analogies. World verifies facts. Code designs algorithms. Adversarial attacks weak points.

4. Verification Layer actively tries to break the hypotheses by generating counterexamples, scoring consistency, and quantifying uncertainty.

5. Adaptive Recurrence re-runs weak branches if uncertainty is high, with targeted improvement instructions.

6. Grand Synthesis compiles all verified evidence and uses the chief model to produce a coherent, multi-proofed response.

**REQUIREMENTS**

Node.js 18 or higher, an OpenRouter API key, and the openai npm package.

**LICENSE**

MIT License.

ARDR is designed for tasks requiring deep, verified reasoning. For simple queries, it automatically uses the fast-path to save tokens and time.
