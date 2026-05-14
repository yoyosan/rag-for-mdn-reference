import { ChunkId } from "@/types/brands";

export type SearchResult = {
	chunkId: ChunkId;
	documentTitle: string;
	content: string;
	headingContext: string | null;
	similarity: number;
	characterCount: number;
	wordCount: number;
	sourceFilePath: string;
};
