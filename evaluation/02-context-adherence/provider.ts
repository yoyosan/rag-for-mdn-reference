import type { ApiProvider, ProviderResponse } from "promptfoo";
import promptfoo from "promptfoo";
import { performRAGQuery } from "@/lib/server/rag";
import { CachedResult, cachedResultSchema } from "@/types/scripts/promptfoo";

export default class GenerationWithSourcesProvider implements ApiProvider {
	id(): string {
		return "generation-with-sources-provider";
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
			const results = await performRAGQuery(prompt);
			const formattedResult: CachedResult = {
				output: {
					answer: results.answer,
					context: results.sources.map((source) => source.content).join("\n"),
				},
			};

			cachedResultSchema.parse(formattedResult);

			const cache = promptfoo.cache.getCache();
			await cache.set(prompt, formattedResult, 3600);

			return formattedResult;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error(
				`GenerationWithSourcesProvider error for "${prompt}":`,
				message,
			);

			return {
				output: [],
				error: `Search failed : ${message}`,
			};
		}
	}
}
