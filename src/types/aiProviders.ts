export const externalAIProviders = [
	"anthropic",
	"deepseek",
	"groq",
	"openai",
] as const;
export type ExternalAIProvider = (typeof externalAIProviders)[number];
export const localAIProviders = ["ollama", "lmstudio", "unsloth"] as const;
export const AIProviders = [
	...externalAIProviders,
	...localAIProviders,
] as const;
export type AIProviderType = (typeof AIProviders)[number];

export interface Embedder {
	embed(params: {
		input: string[] | string;
		model: string;
		inputType?: string;
	}): Promise<{ data: { embedding: number[] }[] }>;
}
