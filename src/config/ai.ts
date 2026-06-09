import { deepseek } from "@ai-sdk/deepseek";
import { groq } from "@ai-sdk/groq";
import { LanguageModel } from "ai";
import { VoyageAIClient } from "voyageai";
import { lmstudioChat } from "@/lib/aiProviders/lmstudio";
import { ollama } from "@/lib/aiProviders/ollama";
import { ollamaModel } from "@/lib/shared/constants";
import { AIProviders, AIProviderType, Embedder } from "@/types/aiProviders";

// AI/LLM model and provider

const rawProvider: string = process.env.AI_PROVIDER || AIProviders[0];
if (!AIProviders.includes(rawProvider as AIProviderType)) {
	throw new Error(
		`Invalid AI_PROVIDER: ${rawProvider}. Must be one of: ${AIProviders.join(", ")}`,
	);
}
const PROVIDER: AIProviderType = rawProvider as AIProviderType;
export const aiProvider: AIProviderType = PROVIDER;

const MODEL_NAME: string = process.env.AI_MODEL || ollamaModel;
export const aiModel: string = MODEL_NAME;

export function getAIModel(modelOverride?: string): LanguageModel {
	const modelName = modelOverride || MODEL_NAME;

	switch (PROVIDER) {
		case "groq":
			if (!process.env.GROQ_API_KEY) {
				throw new Error("GROQ_API_KEY is required in .env.local");
			}

			return groq(modelName);
		case "deepseek":
			if (!process.env.DEEPSEEK_API_KEY) {
				throw new Error("DEEPSEEK_API_KEY is required in .env.local");
			}

			return deepseek(modelName);
		case "lmstudio":
			return lmstudioChat(modelName);

		case "ollama":
			return ollama(modelName);

		default:
			throw new Error(`Unknown provider: ${PROVIDER}`);
	}
}

// Embedding model and provider

const EMBEDDING_PROVIDER = process.env.EMBEDDING_PROVIDER || "voyage";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "voyage-4-large";
export const embeddingModel = EMBEDDING_MODEL;

export function getEmbeddingModel(modelOverride?: string): Embedder {
	const modelName = modelOverride || EMBEDDING_MODEL;

	switch (EMBEDDING_PROVIDER) {
		case "ollama":
			return {
				embed: async ({ input }) => {
					const response = await fetch("http://localhost:11434/api/embed", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ model: modelName, input }),
					});
					const data = await response.json();
					return {
						data: data.embeddings.map((e: number[]) => ({ embedding: e })),
					};
				},
			};
		case "voyage":
		default:
			if (!process.env.VOYAGE_API_KEY) {
				throw new Error("VOYAGE_API_KEY is required in .env.local");
			}

			return new VoyageAIClient({
				apiKey: process.env.VOYAGE_API_KEY,
			}) as unknown as Embedder;
	}
}

const RERANK_PROVIDER = process.env.RERANK_PROVIDER || "voyage";
const RERANK_MODEL = process.env.RERANK_MODEL || "rerank-2.5";
export const rerankModel = RERANK_MODEL;

export function getRerankModel() {
	switch (RERANK_PROVIDER) {
		case "voyage":
		default:
			if (!process.env.VOYAGE_API_KEY) {
				throw new Error("VOYAGE_API_KEY is required in .env.local");
			}

			return new VoyageAIClient({
				apiKey: process.env.VOYAGE_API_KEY,
			});
	}
}
