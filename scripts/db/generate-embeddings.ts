import { isNull } from "drizzle-orm";
import { db, pool } from "@/db";
import { chunksTable } from "@/db/schema/chunks";
import { runScript } from "@/lib/scripts/utils";
import { ChunkRow, generateEmbeddingsForChunks } from "@/lib/server/embeddings";

const VOYAGE_MAX_BATCH_SIZE = 128;

async function fetchChunksWithoutEmbeddings(): Promise<ChunkRow[]> {
	return db
		.select({
			id: chunksTable.id,
			content: chunksTable.content,
		})
		.from(chunksTable)
		.where(isNull(chunksTable.embedding));
}

async function main(): Promise<void> {
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

		await generateEmbeddingsForChunks(batch);
		processed += batch.length;

		console.log(`Progress: ${processed}/${chunks.length} chunks completed`);

		const hasMoreBatches = i + VOYAGE_MAX_BATCH_SIZE < chunks.length;
		if (hasMoreBatches) {
			await new Promise((resolve) => setTimeout(resolve, 200));
		}
	}

	console.log(`\nDone! Generated embeddings for ${processed} chunks.`);
}

if (import.meta.main) {
	await runScript(main);
}
