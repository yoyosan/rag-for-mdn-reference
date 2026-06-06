import { ChunkId } from "@/types/brands";

export interface ChunkData {
	id: ChunkId;
	text: string;
	source: string;
	title: string;
	slug: string;
	pageType: string;
	heading: string | null;
	headingLevel: number | null;
	headingLineNumber: number | null;
	startLine: number;
	endLine: number;
}

export interface ChunksFile {
	metadata: {
		totalChunks: number;
		generatedAt: string;
		chunkingStrategy: string;
		chunkSize: number;
		chunkOverlap: number;
	};
	chunks: ChunkData[];
}

export interface ChunkWithContext {
	context: string;
	chunkContentPrefixed: string;
	chunk: ChunkData;
}
