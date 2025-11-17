import { type LLMProviderInput } from "@/lib/validations/llm-provider";
import { testOpenAIConnection } from "./openai";
import { testOpenRouterConnection } from "./openrouter";

export async function testLLMProviderConnection(config: LLMProviderInput): Promise<{ success: boolean; error?: string }> {
  if (config.provider === "openai") {
    return testOpenAIConnection(config.apiKey);
  } else if (config.provider === "openrouter") {
    return testOpenRouterConnection(config.apiKey);
  }
  return { success: false, error: "Unknown provider" };
}

