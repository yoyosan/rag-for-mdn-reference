import { VoyageAIClient } from "voyageai";
import z from "zod";
import { generateMDNUrl } from "@/lib/helpers/general";
import { performSemanticSearch } from "@/lib/server/search";
import { Embedder } from "@/types/aiProviders";
import { SearchResult } from "@/types/semanticSearch";
import { ChatSource } from "@/types/web/message";

const aiToolInputSchema = z.object({
	message: z
		.string()
		.describe("The question or comment to query the context documents about."),
	limit: z.number().optional().default(5),
});

export type AIToolsParams = {
	embedder: Embedder;
	embedModel: string;
	reranker: VoyageAIClient;
};

export type AITools = {
	queryKnowledgeBase: {
		description: string;
		inputSchema: typeof aiToolInputSchema;
		execute: (input: {
			message: string;
			limit: number;
		}) => Promise<ChatSource[]>;
	};
};

export const createAITools = ({
	embedder,
	reranker,
	embedModel,
}: AIToolsParams): AITools => ({
	queryKnowledgeBase: {
		description: "Query the provided context documents",
		inputSchema: aiToolInputSchema,
		execute: async ({ message, limit }: { message: string; limit: number }) => {
			const retrievedChunks = await performSemanticSearch(message, limit, {
				embedder,
				reranker,
				embedModel,
			});

			return transformChunksForFrontend(retrievedChunks);
		},
	},
});

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
