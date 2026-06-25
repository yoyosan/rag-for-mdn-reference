import type { externalAIProviders } from "@/types/aiProviders";

export const externalAIProvidersLabels: Record<
	(typeof externalAIProviders)[number],
	string
> = {
	anthropic: "Anthropic",
	deepseek: "DeepSeek",
	groq: "Groq",
	openai: "OpenAI",
} as const;
