import { readFile } from "node:fs/promises";
import path from "node:path";
import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { chunksTable } from "@/db/schema/chunks";
import { documentsTable } from "@/db/schema/documents";
import { runScript } from "@/lib/scripts/utils";
import {
	analyzeExistingChunks,
	generateContextsForChunks,
} from "@/lib/server/chunkOperations";
import { generateEmbeddingsForTexts } from "@/lib/server/embeddings";
import { BATCH_SIZES } from "@/lib/shared/batchSizes";
import type { ChunkId, DocumentId } from "@/types/brands";
import { Chunk } from "@/types/entities/chunk";
import { ChunkData } from "@/types/scripts/chunk";

const projectRoot = path.resolve(import.meta.dir, "..", "..");
const chunksPath = path.resolve(projectRoot, "chunks.json");

async function loadChunks(): Promise<ChunkData[]> {
	const content = await readFile(chunksPath, "utf8");
	return JSON.parse(content) as ChunkData[];
}

async function main(): Promise<void> {
	console.log("Loading chunks...");
	const chunks: ChunkData[] = await loadChunks();

	console.log(`📊 Total chunks in input file: ${chunks.length}`);

	const analysis = await analyzeExistingChunks(chunks);

	if (analysis.chunksWithoutEmbeddings.length === 0) {
		console.log("🎉 All chunks already have embeddings! Nothing to process.");
		console.log("✅ Database is up to date.\n");
		return;
	}

	if (analysis.documentsToInsert.length > 0) {
		console.log("📖 Inserting new documents...");
		const documentsToInsert = analysis.documentsToInsert.map((doc) => ({
			title: doc.title,
			slug: doc.slug,
			sourceFilePath: doc.source,
			pageType: doc.pageType,
			sidebar: doc.sidebar,
			totalChunks: doc.totalChunks,
			processedAt: new Date(),
		}));

		const insertedDocuments = await db
			.insert(documentsTable)
			.values(documentsToInsert)
			.returning();

		console.log(`✅ Inserted ${insertedDocuments.length} new documents\n`);

		// Update document ID mapping for new documents
		for (let i = 0; i < insertedDocuments.length; i++) {
			const doc = insertedDocuments[i];
			const originalDoc = analysis.documentsToInsert[i];
			analysis.documentIdMap.set(originalDoc.source, doc.id);
		}
	}

	console.log("");

	// Process chunks that need embeddings in batches
	console.log("📄 Processing chunks that need embeddings...");
	let totalProcessed = 0;
	let totalInserted = 0;
	let totalUpdated = 0;

	// Get all existing chunk IDs from the database before we start
	const existingChunkIds = new Set<ChunkId>(
		(await db.select({ id: chunksTable.id }).from(chunksTable)).map(
			(c) => c.id,
		),
	);

	const chunksToProcess = analysis.chunksWithoutEmbeddings;
	for (
		let i = 0;
		i < chunksToProcess.length;
		i += BATCH_SIZES.contextGeneration
	) {
		const batch = chunksToProcess.slice(i, i + BATCH_SIZES.contextGeneration);

		console.log(
			`   🏁 Begin ${totalProcessed + batch.length} of ${chunksToProcess.length}  chunks that need embeddings...`,
		);

		const chunksWithContext = await generateContextsForChunks(batch);

		// Extract text content from batch for embedding generation
		const textsForEmbedding = chunksWithContext.map(
			(chunkWithContext) => chunkWithContext.chunkContentPrefixed,
		);
		const embeddings = await generateEmbeddingsForTexts(textsForEmbedding);

		for (let j = 0; j < batch.length; j++) {
			const chunk = batch[j];
			const chunkWithContext = chunksWithContext[j];
			const embedding = embeddings[j];
			const documentId = analysis.documentIdMap.get(chunk.source);

			if (!documentId) {
				console.warn(
					`⚠️  Document ID not found for chunk ${chunk.id}, skipping...`,
				);
				continue;
			}

			const newChunk: Chunk = {
				id: chunk.id,
				documentId: documentId as DocumentId,
				contextPrefix: chunkWithContext.context,
				content: chunk.text,
				chunkIndex: Number.parseInt(chunk.id.split("_").pop() || "0", 10),
				startLine: chunk.startLine || null,
				endLine: chunk.endLine || null,
				headingContextText: chunk.heading || null,
				headingContextLevel: chunk.headingLevel || null,
				headingLineNumber: chunk.headingLineNumber || null,
				characterCount: chunk.text.length,
				wordCount: chunk.text.split(/\s+/).filter(Boolean).length,
				embedding,
				searchVector: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const result = await db
				.insert(chunksTable)
				.values(newChunk)
				.onConflictDoUpdate({
					target: chunksTable.id,
					set: {
						embedding: newChunk.embedding,
						updatedAt: new Date(),
					},
				})
				.returning({ id: chunksTable.id });

			if (result.length > 0) {
				// Check if this was an insert or update based on whether chunk existed before
				if (existingChunkIds.has(chunk.id)) {
					totalUpdated++;
				} else {
					totalInserted++;
				}
			}
		}

		totalProcessed += batch.length;

		console.log(
			`   🔚 End: ${totalProcessed} of ${chunksToProcess.length} chunks processed with embeddings`,
		);
	}

	console.log(`✅ Processing completed!`);
	console.log(`   🆕 Inserted: ${totalInserted} new chunks`);
	console.log(`   🔄 Updated: ${totalUpdated} existing chunks`);
	console.log("");

	// Verify the final state
	const documentCount = await db.select().from(documentsTable);
	const chunkCount = await db.select().from(chunksTable);
	const chunksWithoutEmbeddings = await db
		.select()
		.from(chunksTable)
		.where(isNull(chunksTable.embedding));

	console.log("📊 Final Database Summary:");
	console.log(`   📚 Total documents: ${documentCount.length}`);
	console.log(`   📄 Total chunks: ${chunkCount.length}`);
	console.log(
		`   🔮 Chunks with embeddings: ${
			chunkCount.length - chunksWithoutEmbeddings.length
		}`,
	);
	console.log(
		`   ❌ Chunks without embeddings: ${chunksWithoutEmbeddings.length}`,
	);
	console.log(`   🎯 Input file had: ${chunks.length} chunks`);

	if (chunksWithoutEmbeddings.length === 0) {
		console.log("✅ All chunks now have embeddings!");
	} else {
		console.log(
			"⚠️  Some chunks still lack embeddings. Run the script again to continue processing.",
		);
	}

	console.log("\n🚀 Incremental database seeding completed successfully!");
}

if (import.meta.main) {
	await runScript(main);
}
