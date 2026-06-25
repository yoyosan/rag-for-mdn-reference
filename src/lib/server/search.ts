import { cosineDistance, eq, sql } from "drizzle-orm";
import { getEmbedder, resolveEmbeddingModel } from "@/config/ai";
import { db } from "@/db";
import { chunksTable } from "@/db/schema/chunks";
import { documentsTable } from "@/db/schema/documents";
import type { AIToolsParams } from "@/lib/helpers/aiTools";
import { rerankResults } from "@/lib/server/reranker";
import type { Embedder } from "@/types/aiProviders";
import type { RankedSearchResult, SearchResult } from "@/types/semanticSearch";

export async function generateQuestionEmbedding(
	question: string,
	{ embedder, embedModel }: { embedder?: Embedder; embedModel?: string },
): Promise<number[]> {
	const resolvedEmbedder = embedder ?? getEmbedder();
	const resolvedEmbedModel = embedModel ?? resolveEmbeddingModel();
	const response = await resolvedEmbedder.embed({
		model: resolvedEmbedModel,
		input: question,
		inputType: "query",
	});

	if (!response.data || response.data.length === 0) {
		throw new Error(`No embedding generated for question: ${question}`);
	}
	const embedding = response.data[0].embedding;
	if (!embedding) {
		throw new Error("Received embedding with missing data");
	}

	return embedding;
}

async function searchSimilarChunks(
	questionEmbedding: number[],
	limit: number = 5,
	similarityThreshold: number = 0.5,
): Promise<RankedSearchResult[]> {
	const results = await db
		.select({
			chunkId: chunksTable.id,
			documentTitle: documentsTable.title,
			content: chunksTable.content,
			headingContext: chunksTable.headingContextText,
			characterCount: chunksTable.characterCount,
			wordCount: chunksTable.wordCount,
			sourceFilePath: documentsTable.sourceFilePath,
			documentSlug: documentsTable.slug,
			vectorScore: sql<number>`1 - (${cosineDistance(chunksTable.embedding, questionEmbedding)})`,
		})
		.from(chunksTable)
		.innerJoin(documentsTable, eq(chunksTable.documentId, documentsTable.id))
		.where(sql`${chunksTable.embedding} IS NOT NULL`)
		.orderBy(cosineDistance(chunksTable.embedding, questionEmbedding))
		.limit(limit);

	const filteredResults = results.filter(
		(result) => result.vectorScore >= similarityThreshold,
	);

	return filteredResults;
}

export async function performSemanticSearch(
	question: string,
	limit: number = 5,
	aiTools: AIToolsParams,
	onResults?: (results: SearchResult[]) => void,
): Promise<SearchResult[]> {
	const questionEmbedding = await generateQuestionEmbedding(question, {
		embedder: aiTools.embedder,
		embedModel: aiTools.embedModel,
	});

	const hybridResults: SearchResult[] = await hybridSearch(
		question,
		questionEmbedding,
		limit,
		{
			rrfK: 60,
		},
	);

	let results: SearchResult[] = [];
	try {
		const rerankedResults = await rerankResults<SearchResult>(
			question,
			hybridResults,
			aiTools.reranker,
		);
		results = rerankedResults.slice(0, limit);
	} catch (error) {
		console.error("rerank failed, falling back to hybrid search order", {
			error,
		});
		results = hybridResults.slice(0, limit);
	}

	onResults?.(results);

	return results;
}

async function searchWithBM25(
	query: string,
	limit: number = 20,
): Promise<RankedSearchResult[]> {
	const processedQuery = preprocessQueryForBM25(query);
	const tsQuery = sql`to_tsquery('english', ${processedQuery})`;
	const rankQuery = sql<number>`ts_rank(${chunksTable.searchVector}, ${tsQuery})`;

	const results = await db
		.select({
			chunkId: chunksTable.id,
			documentTitle: documentsTable.title,
			content: chunksTable.content,
			headingContext: chunksTable.headingContextText,
			characterCount: chunksTable.characterCount,
			wordCount: chunksTable.wordCount,
			sourceFilePath: documentsTable.sourceFilePath,
			documentSlug: documentsTable.slug,
			bm25Score: rankQuery,
		})
		.from(chunksTable)
		.innerJoin(documentsTable, eq(chunksTable.documentId, documentsTable.id))
		.where(sql`${chunksTable.searchVector} @@ ${tsQuery}`)
		.orderBy(sql`${rankQuery} DESC`)
		.limit(limit);

	return results;
}

async function hybridSearch(
	question: string,
	questionEmbedding: number[],
	limit: number = 5,
	options: {
		rrfK?: number;
	} = {},
): Promise<SearchResult[]> {
	const { rrfK = 60 } = options;
	// RRF scores are ~0.01-0.016; this keeps all fused candidates
	const rrfSimilarityThreshold = 0.01;
	// Cosine similarity for vector candidate retrieval
	const vectorSimilarityThreshold = 0.6;

	const [vectorResults, bm25Results] = await Promise.all([
		searchSimilarChunks(questionEmbedding, 20, vectorSimilarityThreshold),
		searchWithBM25(question, 20),
	]);

	const combinedResults = reciprocalRankFusion(
		vectorResults,
		bm25Results,
		rrfK,
	);

	const filteredResults = combinedResults
		.filter((result) => result.similarity >= rrfSimilarityThreshold)
		.slice(0, limit);

	return filteredResults;
}

function reciprocalRankFusion(
	vectorResults: RankedSearchResult[],
	bm25Results: RankedSearchResult[],
	k: number = 60,
): SearchResult[] {
	const rrfScores = new Map<
		string,
		RankedSearchResult & { rrfScore: number }
	>();

	for (const [rank, result] of vectorResults.entries()) {
		const rrfScore = 1 / (k + rank + 1);
		rrfScores.set(result.chunkId, { ...result, rrfScore });
	}

	for (const [rank, result] of bm25Results.entries()) {
		const rrfScore = 1 / (k + rank + 1);
		const existing = rrfScores.get(result.chunkId);

		if (existing) {
			existing.rrfScore += rrfScore;
		} else {
			rrfScores.set(result.chunkId, { ...result, rrfScore });
		}
	}

	const results = Array.from(rrfScores.values())
		.sort((a, b) => b.rrfScore - a.rrfScore)
		.map((result) => ({ ...result, similarity: result.rrfScore }));

	return results;
}

function preprocessQueryForBM25(query: string): string {
	const words = query
		.toLowerCase()
		.replace(/[^\w\s]/g, " ") // Replace punctuation with spaces so "closure?" matches "closure"
		.split(/\s+/)
		.filter((word) => word.length > 0);

	return words.join(" | ");
}
