import z from "zod";
import { generateMDNUrl } from "@/lib/helpers/general";
import { performSemanticSearch } from "@/lib/server/search";
import { SearchResult } from "@/types/semanticSearch";

export const aiTools = {
	queryKnowledgeBase: {
		description: "Query the provided context documents",
		inputSchema: z.object({
			message: z
				.string()
				.describe(
					"The question or comment to query the context documents about.",
				),
			limit: z.number().optional().default(5),
		}),
		execute: async ({ message, limit }: { message: string; limit: number }) => {
			const retrievedChunks = await performSemanticSearch(message, limit);

			return transformChunksForFrontend(retrievedChunks);
		},
	},
};

export function transformChunksForFrontend(chunks: SearchResult[]) {
	return chunks.map((source, index) => ({
		id: String(index + 1),
		citationNumber: index + 1,
		title: source.documentTitle,
		snippet: source.content.substring(0, 200) + "...",
		url: generateMDNUrl(source.documentSlug, source.headingContext),
		similarity: source.similarity,
		sourceFilePath: source.sourceFilePath,
		chunkId: source.chunkId,
		content: source.content,
	}));
}
