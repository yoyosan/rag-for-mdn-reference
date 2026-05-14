import { eq } from "drizzle-orm";
import { VoyageAIClient } from "voyageai";
import { db } from "@/db";
import { chunksTable } from "@/db/schema/chunks";
import { Chunk } from "@/types/entities/chunk";

export type ChunkRow = Pick<Chunk, "id" | "content">;

if (!process.env.VOYAGE_API_KEY) {
	throw new Error("VOYAGE_API_KEY is required in .env.local");
}

export const voyageClient = new VoyageAIClient({
	apiKey: process.env.VOYAGE_API_KEY,
});

export async function generateEmbeddings(chunks: ChunkRow[]): Promise<void> {
	const texts = chunks.map((chunk) => chunk.content);
	const response = await voyageClient.embed({
		input: texts,
		model: "voyage-4-large",
		inputType: "document",
	});

	if (!response.data || response.data.length !== chunks.length) {
		throw new Error(
			`Embedding count mismatch: expected ${chunks.length}, got ${response.data?.length ?? 0}`,
		);
	}

	if (response.data.some((d) => !d.embedding)) {
		throw new Error("Received embeddings with missing data");
	}

	for (const [i, chunk] of chunks.entries()) {
		const embedding = response.data[i].embedding;

		await db
			.update(chunksTable)
			.set({ embedding })
			.where(eq(chunksTable.id, chunk.id));
	}
}
