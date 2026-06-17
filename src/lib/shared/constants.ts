import { externalAIProviders } from "@/types/aiProviders";

export const groqModel = "llama-3.3-70b-versatile";
export const deepseekModel = "deepseek-v4-flash";
export const ollamaModel = "qwen2.5:14b";

export const externalAIProvidersLabels: Record<
	(typeof externalAIProviders)[number],
	string
> = {
	anthropic: "Anthropic",
	deepseek: "DeepSeek",
	groq: "Groq",
	openai: "OpenAI",
} as const;
