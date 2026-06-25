import type { ChunkId } from "@/types/brands";

export type SearchResult = {
	chunkId: ChunkId;
	documentTitle: string;
	content: string;
	headingContext: string | null;
	similarity: number; // Combined score from hybrid search
	characterCount: number;
	wordCount: number;
	sourceFilePath: string;
	documentSlug: string | null;
	bm25Score?: number; // BM25 score from keyword search
	vectorScore?: number; // Vector score from semantic search
	rerankScore?: number; // Rerank relevance score
};

export type RankedSearchResult = Omit<SearchResult, "similarity">;
