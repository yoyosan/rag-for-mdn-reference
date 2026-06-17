import { createOpenAI } from "@ai-sdk/openai";

export const unsloth = createOpenAI({
	baseURL: `${process.env.AI_PROVIDER_BASE_URL}/v1`,
	apiKey: process.env.AI_API_KEY,
});
