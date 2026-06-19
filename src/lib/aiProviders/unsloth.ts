import { createOpenAI } from "@ai-sdk/openai";

export const unsloth = (apiKey: string) => (model: string) =>
	createOpenAI({
		baseURL: `${process.env.AI_PROVIDER_BASE_URL}/v1`,
		apiKey,
	})(model);
