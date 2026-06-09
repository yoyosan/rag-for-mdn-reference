import { getRerankModel, rerankModel } from "@/config/ai";

export async function rerankResults<T extends { content: string }>(
	query: string,
	results: T[],
): Promise<T[]> {
	if (results.length === 0) {
		return results;
	}

	const similarityThreshold = 0.5;
	const documents = results.map((result) => result.content);

	const reranker = getRerankModel();
	const result = await reranker.rerank({
		query,
		documents,
		model: rerankModel,
		topK: results.length,
		returnDocuments: false,
	});

	const rerankedResults: (T & { rerankScore: number })[] = [];
	for (const reranked of result.data || []) {
		if (
			reranked.index == null ||
			reranked.index < 0 ||
			reranked.index >= results.length
		) {
			continue;
		}

		const score = reranked.relevanceScore;
		if (score != null && score >= similarityThreshold) {
			rerankedResults.push({ ...results[reranked.index], rerankScore: score });
		}
	}

	if (rerankedResults.length === 0 && results.length > 0) {
		return results;
	}

	return rerankedResults;
}
