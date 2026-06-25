import type { ChunkData } from "@/types/scripts/chunk";

interface DocumentGroup {
	title: string;
	slug: string;
	sourceFilePath: string;
	pageType: string;
	chunks: ChunkData[];
}

export type DocumentGroups = Map<string, DocumentGroup>;

export interface DocumentToInsert {
	source: string;
	title: string;
	slug: string;
	pageType: string;
	sidebar: string;
	totalChunks: number;
	chunks: ChunkData[];
}
