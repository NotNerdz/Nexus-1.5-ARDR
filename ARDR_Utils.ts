import OpenAI from "openai";
import { colors } from "./ARDR_models";

let openaiClient: OpenAI | null = null;

export function initializeOpenAI(apiKey: string): OpenAI {
  openaiClient = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": "https://infiniax.replit.app",
      "X-Title": "ARDR High"
    }
  });
  return openaiClient;
}

export function getOpenAI(): OpenAI {
  if (!openaiClient) {
    throw new Error("OpenAI client not initialized. Call initializeOpenAI first.");
  }
  return openaiClient;
}

export function log(stage: string, message: string, color: string = colors.white): void {
  const timestamp = new Date().toISOString().slice(11, 19);
  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${color}[${stage}]${colors.reset} ${message}`);
}

export function logSection(title: string): void {
  console.log(`\n${colors.bgBlue}${colors.white}${colors.bright} ═══ ${title} ═══ ${colors.reset}\n`);
}

export async function callModel(
  model: string, 
  systemPrompt: string, 
  userPrompt: string, 
  maxTokens: number = 1500
): Promise<string> {
  const openai = getOpenAI();
  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.7
    });
    return response.choices[0]?.message?.content || "";
  } catch (error: any) {
    log("ERROR", `Model call failed: ${error.message}`, colors.red);
    return `[Error calling ${model}: ${error.message}]`;
  }
}

export async function callModelStreaming(
  model: string, 
  systemPrompt: string, 
  userPrompt: string, 
  maxTokens: number = 4000
): Promise<string> {
  const openai = getOpenAI();
  try {
    const stream = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
      stream: true
    });

    let fullResponse = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      process.stdout.write(content);
      fullResponse += content;
    }
    console.log();
    return fullResponse;
  } catch (error: any) {
    log("ERROR", `Streaming call failed: ${error.message}`, colors.red);
    return `[Error calling ${model}: ${error.message}]`;
  }
}

export function parseJsonFromResponse(response: string): any | null {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {}
  return null;
}
