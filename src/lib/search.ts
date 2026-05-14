import { cosineDistance, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { chunksTable } from "@/db/schema/chunks";
import { documentsTable } from "@/db/schema/documents";
import { voyageClient } from "@/lib/embeddings";
import { SearchResult } from "@/types/semanticSearch";

export async function generateQuestionEmbedding(
	question: string,
): Promise<number[]> {
	const response = await voyageClient.embed({
		model: "voyage-4-large",
		input: question,
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

export async function searchSimilarChunks(
	questionEmbedding: number[],
	limit: number = 5,
	similarityThreshold: number = 0.5,
): Promise<SearchResult[]> {
	const results = await db
		.select({
			chunkId: chunksTable.id,
			documentTitle: documentsTable.title,
			content: chunksTable.content,
			headingContext: chunksTable.headingContextText,
			similarity: sql<number>`1 - (${cosineDistance(chunksTable.embedding, questionEmbedding)})`,
			characterCount: chunksTable.characterCount,
			wordCount: chunksTable.wordCount,
			sourceFilePath: documentsTable.sourceFilePath,
		})
		.from(chunksTable)
		.innerJoin(documentsTable, eq(chunksTable.documentId, documentsTable.id))
		.where(sql`${chunksTable.embedding} IS NOT NULL`)
		.orderBy(cosineDistance(chunksTable.embedding, questionEmbedding))
		.limit(limit);

	return results.filter((result) => result.similarity >= similarityThreshold);
}

export async function performSemanticSearch(
	question: string,
	limit: number = 5,
	similarityThreshold: number = 0.5,
	onResults?: (results: SearchResult[]) => void,
): Promise<SearchResult[]> {
	const questionEmbedding = await generateQuestionEmbedding(question);

	const results = await searchSimilarChunks(
		questionEmbedding,
		limit,
		similarityThreshold,
	);

	onResults?.(results);

	return results;
}
