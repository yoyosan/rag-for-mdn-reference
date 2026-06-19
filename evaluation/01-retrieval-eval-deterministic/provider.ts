import type { ApiProvider, ProviderResponse } from "promptfoo";
import promptfoo from "promptfoo";
import { getEmbedder, getReranker, resolveEmbeddingModel } from "@/config/ai";
import { performSemanticSearch } from "@/lib/server/search";
import { CachedResult, cachedResultSchema } from "@/types/scripts/promptfoo";

export default class RetrievalProvider implements ApiProvider {
	id(): string {
		return "retrieval-provider";
	}

	async getCachedResult(prompt: string): Promise<ProviderResponse | null> {
		const cache = promptfoo.cache.getCache();
		const cached = await cache.get(prompt);
		const parsed = cachedResultSchema.safeParse(cached);

		return parsed.success ? parsed.data : null;
	}

	async callApi(prompt: string): Promise<ProviderResponse> {
		const cached = await this.getCachedResult(prompt);
		if (cached) {
			return cached;
		}

		try {
			const results = await performSemanticSearch(prompt, 5, {
				embedder: getEmbedder(),
				reranker: getReranker(),
				embedModel: resolveEmbeddingModel(),
			});
			const formattedResult: CachedResult = {
				output: results,
			};

			cachedResultSchema.parse(formattedResult);

			const cache = promptfoo.cache.getCache();
			await cache.set(prompt, formattedResult, 3600);

			return formattedResult;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error(`RetrievalProvider error for "${prompt}":`, message);

			return {
				output: [],
				error: `Search failed : ${message}`,
			};
		}
	}
}
