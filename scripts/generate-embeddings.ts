import { eq, isNull } from "drizzle-orm";
import { VoyageAIClient } from "voyageai";
import { db, pool } from "@/db";
import { chunksTable } from "@/db/schema/chunks";
import { Chunk } from "@/types/entities/chunk";

const VOYAGE_MAX_BATCH_SIZE = 128;

if (!process.env.VOYAGE_API_KEY) {
	throw new Error("VOYAGE_API_KEY is required in .env.local");
}

const voyageClient = new VoyageAIClient({
	apiKey: process.env.VOYAGE_API_KEY,
});

type ChunkRow = Pick<Chunk, "id" | "content">;

async function fetchChunksWithoutEmbeddings(): Promise<ChunkRow[]> {
	return db
		.select({
			id: chunksTable.id,
			content: chunksTable.content,
		})
		.from(chunksTable)
		.where(isNull(chunksTable.embedding));
}

async function generateEmbeddings(chunks: ChunkRow[]): Promise<void> {
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

async function generateAllEmbeddings(): Promise<void> {
	console.log("Fetching chunks without embeddings...");
	const chunks = await fetchChunksWithoutEmbeddings();

	if (chunks.length === 0) {
		console.log("All chunks already have embeddings. Nothing to do.");
		return;
	}

	console.log(`Found ${chunks.length} chunks needing embeddings`);

	const totalBatches = Math.ceil(chunks.length / VOYAGE_MAX_BATCH_SIZE);
	let processed = 0;

	for (let i = 0; i < chunks.length; i += VOYAGE_MAX_BATCH_SIZE) {
		const batch = chunks.slice(i, i + VOYAGE_MAX_BATCH_SIZE);
		const batchNum = Math.floor(i / VOYAGE_MAX_BATCH_SIZE) + 1;

		console.log(
			`Processing batch ${batchNum}/${totalBatches} (${batch.length} chunks)...`,
		);

		await generateEmbeddings(batch);
		processed += batch.length;

		console.log(`Progress: ${processed}/${chunks.length} chunks completed`);

		const hasMoreBatches = i + VOYAGE_MAX_BATCH_SIZE < chunks.length;
		if (hasMoreBatches) {
			await new Promise((resolve) => setTimeout(resolve, 200));
		}
	}

	console.log(`\nDone! Generated embeddings for ${processed} chunks.`);
}

try {
	await generateAllEmbeddings();
} catch (error) {
	console.error("Embedding generation failed:", error);
	process.exit(1);
} finally {
	await pool.end();
}
