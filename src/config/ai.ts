import { createAnthropic } from "@ai-sdk/anthropic";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { VoyageAIClient } from "voyageai";
import { lmstudioChat } from "@/lib/aiProviders/lmstudio";
import { ollama } from "@/lib/aiProviders/ollama";
import { unsloth } from "@/lib/aiProviders/unsloth";
import {
	AIProviders,
	type AIProviderType,
	type Embedder,
} from "@/types/aiProviders";

// AI/LLM provider and model

const rawProvider: string = process.env.AI_PROVIDER || "groq";
if (!AIProviders.includes(rawProvider as AIProviderType)) {
	throw new Error(
		`Invalid AI_PROVIDER: ${rawProvider}. Must be one of: ${AIProviders.join(", ")}`,
	);
}
const PROVIDER: AIProviderType = rawProvider as AIProviderType;
export const aiProvider: AIProviderType = PROVIDER;

const MODEL_NAME: string = process.env.AI_MODEL || "llama-3.3-70b-versatile";
export const aiModel: string = MODEL_NAME;

export function getLLM(
	userProvider?: AIProviderType | null,
	userApiKey?: string | null,
	userModel?: string | null,
): LanguageModel {
	const aiModel = userModel || MODEL_NAME;
	const aiProvider = userProvider || PROVIDER;
	let aiApiKey = userApiKey || process.env.AI_API_KEY;

	switch (aiProvider) {
		case "anthropic": {
			aiApiKey = aiApiKey || process.env.ANTHROPIC_API_KEY;
			if (!aiApiKey) {
				throw new Error(
					"API key not configured. Set it in Settings or add ANTHROPIC_API_KEY to .env.local.",
				);
			}

			const anthropicProvider = createAnthropic({ apiKey: aiApiKey });
			return anthropicProvider(aiModel);
		}
		case "openai": {
			aiApiKey = aiApiKey || process.env.OPENAI_API_KEY;
			if (!aiApiKey) {
				throw new Error(
					"API key not configured. Set it in Settings or add OPENAI_API_KEY to .env.local.",
				);
			}
			const openaiProvider = createOpenAI({ apiKey: aiApiKey });
			return openaiProvider(aiModel);
		}
		case "groq": {
			aiApiKey = aiApiKey || process.env.GROQ_API_KEY;
			if (!aiApiKey) {
				throw new Error(
					"API key not configured. Set it in Settings or add GROQ_API_KEY to .env.local.",
				);
			}

			const groqProvider = createGroq({ apiKey: aiApiKey });
			return groqProvider(aiModel);
		}
		case "deepseek": {
			aiApiKey = aiApiKey || process.env.DEEPSEEK_API_KEY;
			if (!aiApiKey) {
				throw new Error(
					"API key not configured. Set it in Settings or add DEEPSEEK_API_KEY to .env.local.",
				);
			}

			const deepSeekProvider = createDeepSeek({ apiKey: aiApiKey });
			return deepSeekProvider(aiModel);
		}
		case "lmstudio":
			return lmstudioChat(aiModel);

		case "ollama":
			return ollama(aiModel);

		case "unsloth":
			if (!aiApiKey) {
				throw new Error(
					"API key not configured. Set it in Settings or add AI_API_KEY to .env.local.",
				);
			}

			if (!process.env.AI_PROVIDER_BASE_URL) {
				throw new Error("AI_PROVIDER_BASE_URL is not set in .env.local.");
			}

			return unsloth(aiApiKey)(aiModel);

		default:
			throw new Error(`Unknown LLM provider: ${aiProvider}`);
	}
}

// Embedding model and provider

const EMBEDDING_PROVIDER = process.env.EMBEDDING_PROVIDER || "voyage";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "voyage-4-large";
export const embeddingModel = EMBEDDING_MODEL;

export function getEmbedder(
	userProvider?: string,
	userApiKey?: string | null,
	userModel?: string | null,
): Embedder {
	const aiProvider = userProvider || EMBEDDING_PROVIDER;
	const aiModel = userModel || EMBEDDING_MODEL;
	const aiApiKey = userApiKey || process.env.VOYAGE_API_KEY;

	switch (aiProvider) {
		// TODO: have to validate/test this locally
		case "ollama":
			return {
				embed: async ({ input }) => {
					const response = await fetch("http://localhost:11434/api/embed", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ model: aiModel, input }),
					});
					const data = await response.json();
					return {
						data: data.embeddings.map((e: number[]) => ({ embedding: e })),
					};
				},
			};
		case "voyage":
			if (!aiApiKey) {
				throw new Error(
					"API key not configured. Set it in Settings or add VOYAGE_API_KEY to .env.local.",
				);
			}

			return new VoyageAIClient({
				apiKey: aiApiKey,
			}) as unknown as Embedder;
		default:
			throw new Error(`Unsupported embedding provider: ${aiProvider}`);
	}
}

export function resolveEmbeddingModel(userModel?: string | null) {
	return userModel || EMBEDDING_MODEL;
}

// Reranker model and provider

const RERANK_PROVIDER = process.env.RERANK_PROVIDER || "voyage";
const RERANK_MODEL = process.env.RERANK_MODEL || "rerank-2.5";
export const rerankModel = RERANK_MODEL;

export function getReranker(
	userProvider?: string,
	userApiKey?: string | null,
): VoyageAIClient {
	const aiProvider = userProvider || RERANK_PROVIDER;
	const aiApiKey = userApiKey || process.env.VOYAGE_API_KEY;

	switch (aiProvider) {
		case "voyage":
			if (!aiApiKey) {
				throw new Error(
					"API key not configured. Set it in Settings or add VOYAGE_API_KEY to .env.local.",
				);
			}

			return new VoyageAIClient({
				apiKey: aiApiKey,
			});
		default:
			throw new Error(`Unsupported rerank provider: ${aiProvider}`);
	}
}
