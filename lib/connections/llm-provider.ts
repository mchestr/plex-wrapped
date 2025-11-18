import { type LLMProviderInput } from "@/lib/validations/llm-provider";
import { testOpenAIConnection } from "./openai";

export async function testLLMProviderConnection(config: LLMProviderInput): Promise<{ success: boolean; error?: string }> {
  if (config.provider === "openai") {
    return testOpenAIConnection(config.apiKey);
  }
  return { success: false, error: "Unknown provider" };
}

