export const AIProviders = ["ollama", "groq", "deepseek"] as const;
export type AIProviderType = (typeof AIProviders)[number];

export interface Embedder {
	embed(params: {
		input: string[] | string;
		model: string;
		inputType?: string;
	}): Promise<{ data: { embedding: number[] }[] }>;
}
