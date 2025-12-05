export const MODELS = {
  profiler: "meta-llama/llama-3.3-70b-instruct:free",
  cheap: "google/gemini-2.0-flash-001",
  
  logic: "google/gemini-2.0-flash-001",
  pattern: "google/gemini-2.0-flash-001",
  world: "openai/gpt-4.1-mini",
  code: "anthropic/claude-sonnet-4",
  adversarial: "google/gemini-2.0-flash-001",
  
  condenser: "anthropic/claude-sonnet-4",
  
  chiefLow: "meta-llama/llama-3.3-70b-instruct:free",
  chiefHigh: "deepseek/deepseek-chat-v3-0324",
  chiefMax: "anthropic/claude-opus-4"
} as const;

export const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m"
};
