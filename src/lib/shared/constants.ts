import type { ExternalAIProvider } from "@/types/aiProviders";

interface ProviderMeta {
	label: string;
	url: string;
	free: string | null;
	recommendedModel: string;
}

export const externalAIProviderMeta = {
	anthropic: {
		label: "Anthropic",
		url: "https://console.anthropic.com/",
		free: null,
		recommendedModel: "claude-haiku-4-5",
	},
	deepseek: {
		label: "DeepSeek",
		url: "https://platform.deepseek.com/",
		free: null,
		recommendedModel: "deepseek-v4-flash",
	},
	groq: {
		label: "Groq",
		url: "https://console.groq.com/",
		free: "Free tier",
		recommendedModel: "llama-3.3-70b-versatile",
	},
	openai: {
		label: "OpenAI",
		url: "https://platform.openai.com/",
		free: "$5 free credits",
		recommendedModel: "gpt-5.4-nano",
	},
} satisfies Record<ExternalAIProvider, ProviderMeta>;

export const voyageRecommendedModels = {
	embedding: "voyage-4-large",
	reranker: "rerank-2.5",
} as const;
