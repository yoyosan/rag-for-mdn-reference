import { readFile } from "node:fs/promises";
import path from "node:path";

import { db, pool } from "@/db";
import { chunksTable } from "@/db/schema/chunks";
import { documentsTable } from "@/db/schema/documents";
import type { ChunkId, DocumentId } from "@/types/brands";
import { InsertedDocument } from "@/types/entities/document";

interface ChunkData {
	id: string;
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

interface DocumentGroup {
	title: string;
	slug: string;
	sourceFilePath: string;
	pageType: string;
	chunks: ChunkData[];
}

type DocumentGroups = Map<string, DocumentGroup>;

const projectRoot = path.resolve(import.meta.dir, "..");
const chunksPath = path.resolve(projectRoot, "chunks.json");

async function loadChunks(): Promise<ChunkData[]> {
	const content = await readFile(chunksPath, "utf8");
	return JSON.parse(content) as ChunkData[];
}

function groupChunksByDocument(chunks: ChunkData[]): DocumentGroups {
	const groups: DocumentGroups = new Map();

	for (const chunk of chunks) {
		const key = chunk.slug;
		if (!groups.has(key)) {
			groups.set(key, {
				title: chunk.title,
				slug: chunk.slug,
				sourceFilePath: chunk.source,
				pageType: chunk.pageType,
				chunks: [chunk],
			});
		} else {
			groups.get(key)?.chunks.push(chunk);
		}
	}

	return groups;
}

async function seedDatabase(): Promise<void> {
	console.log("Loading chunks...");
	const chunks = await loadChunks();
	console.log(`Loaded ${chunks.length} chunks`);

	const documentGroups = groupChunksByDocument(chunks);
	console.log(`Found ${documentGroups.size} unique documents`);

	console.log("Clearing existing data...");

	await db.transaction(async (tx) => {
		const documentInsertions: Array<InsertedDocument> = [];
		await tx.delete(chunksTable);
		await tx.delete(documentsTable);

		console.log("Inserting documents...");

		for (const [, group] of documentGroups) {
			const result = await tx
				.insert(documentsTable)
				.values({
					title: group.title,
					slug: group.slug,
					sourceFilePath: group.sourceFilePath,
					pageType: group.pageType,
					sidebar: "jsSidebar",
					totalChunks: group.chunks.length,
				})
				.returning({ id: documentsTable.id });

			documentInsertions.push({
				id: result[0].id,
				title: group.title,
				slug: group.slug,
				sourceFilePath: group.sourceFilePath,
				pageType: group.pageType,
				sidebar: "jsSidebar",
				totalChunks: group.chunks.length,
			});
		}

		console.log(`Inserted ${documentInsertions.length} documents`);

		const documentIdBySlug = new Map<string, DocumentId>();
		for (const doc of documentInsertions) {
			documentIdBySlug.set(doc.slug, doc.id);
		}

		console.log("Inserting chunks...");
		const chunkValues = chunks.map((chunk) => {
			const documentId = documentIdBySlug.get(chunk.slug);
			if (!documentId) {
				throw new Error(`No document found for slug: ${chunk.slug}`);
			}

			return {
				id: chunk.id as ChunkId,
				documentId,
				content: chunk.text,
				chunkIndex: Number.parseInt(chunk.id.split("-").pop() || "0", 10),
				startLine: chunk.startLine,
				endLine: chunk.endLine,
				headingContextText: chunk.heading,
				headingContextLevel: chunk.headingLevel,
				headingLineNumber: chunk.headingLineNumber,
				characterCount: chunk.text.length,
				wordCount: chunk.text.split(/\s+/).filter(Boolean).length,
				embedding: null,
			};
		});

		const BATCH_SIZE = 100;
		for (let i = 0; i < chunkValues.length; i += BATCH_SIZE) {
			const batch = chunkValues.slice(i, i + BATCH_SIZE);
			await tx.insert(chunksTable).values(batch);
			console.log(
				`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunkValues.length / BATCH_SIZE)} (${batch.length} chunks)`,
			);
		}

		console.log(
			`\nDone! Seeded ${documentInsertions.length} documents and ${chunks.length} chunks.`,
		);
	});
}

try {
	await seedDatabase();
} catch (error) {
	console.error("Seed failed:", error);
	process.exit(1);
} finally {
	await pool.end();
}
