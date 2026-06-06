import { eq } from "drizzle-orm";
import { embeddingModel, getEmbeddingModel } from "@/config/ai";
import { db } from "@/db";
import { chunksTable } from "@/db/schema/chunks";
import { Chunk } from "@/types/entities/chunk";

export type ChunkRow = Pick<Chunk, "id" | "content">;

export async function generateEmbeddingsForChunks(
	chunks: ChunkRow[],
): Promise<void> {
	const texts = chunks.map((chunk) => chunk.content);
	const embedder = getEmbeddingModel();
	const response = await embedder.embed({
		input: texts,
		model: embeddingModel,
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

	await db.transaction(async (tx) => {
		await Promise.all(
			chunks.map((chunk, i) => {
				if (response.data && response.data[i]) {
					const embedding = response.data[i].embedding;

					return tx
						.update(chunksTable)
						.set({ embedding })
						.where(eq(chunksTable.id, chunk.id));
				}
			}),
		);
	});
}

export async function generateEmbeddingsForTexts(
	texts: string[],
): Promise<number[][]> {
	try {
		const embedder = getEmbeddingModel();
		const response = await embedder.embed({
			input: texts,
			model: embeddingModel,
			inputType: "document",
		});

		if (!response.data || response.data.length !== texts.length) {
			throw new Error(
				`Embedding count mismatch: expected ${texts.length}, got ${response.data?.length ?? 0}`,
			);
		}

		if (response.data.some((d) => !d.embedding)) {
			throw new Error("Received embeddings with missing data");
		}

		const result: number[][] = [];
		for (const [i] of texts.entries()) {
			if (response.data && response.data[i]) {
				const embedding = response.data[i].embedding;
				if (!embedding) {
					throw new Error(`Missing embedding for text at index ${i}`);
				}

				result[i] = embedding;
			}
		}

		return result;
	} catch (error) {
		console.error("❌ Error generating embeddings:", error);
		throw error;
	}
}
