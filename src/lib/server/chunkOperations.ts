import { db } from "@/db";
import { chunksTable } from "@/db/schema/chunks";
import { documentsTable } from "@/db/schema/documents";
import { generateContextForChunk } from "@/lib/server/contextualiser";
import { ChunkData, ChunkWithContext } from "@/types/scripts/chunk";
import { DocumentGroups, DocumentToInsert } from "@/types/scripts/document";

export async function analyzeExistingChunks(inputChunks: ChunkData[]): Promise<{
	chunksWithEmbeddings: Set<string>;
	chunksWithoutEmbeddings: ChunkData[];
	documentsToInsert: DocumentToInsert[];
	documentIdMap: Map<string, string>; // source -> document ID
}> {
	console.log("🔍 Analyzing existing chunks and documents...");

	const existingDocuments = await db.select().from(documentsTable);
	const existingChunks = await db
		.select({
			id: chunksTable.id,
			documentId: chunksTable.documentId,
			hasEmbedding: chunksTable.embedding,
		})
		.from(chunksTable);

	console.log(`   📚 Found ${existingDocuments.length} existing documents`);
	console.log(`   📄 Found ${existingChunks.length} existing chunks`);

	const existingDocumentsBySource = new Map<
		string,
		(typeof existingDocuments)[0]
	>();
	for (const doc of existingDocuments) {
		existingDocumentsBySource.set(doc.sourceFilePath, doc);
	}

	const existingChunkIds = new Set<string>();
	const chunksWithEmbeddings = new Set<string>();
	for (const chunk of existingChunks) {
		existingChunkIds.add(chunk.id);
		if (chunk.hasEmbedding !== null) {
			chunksWithEmbeddings.add(chunk.id);
		}
	}

	console.log(
		`   ✅ ${chunksWithEmbeddings.size} chunks already have embeddings`,
	);
	console.log(
		`   ❌ ${
			existingChunkIds.size - chunksWithEmbeddings.size
		} chunks exist but lack embeddings`,
	);

	// Group input chunks by document source
	const inputDocumentMap = new Map<string, DocumentToInsert>();
	for (const [, group] of groupChunksByDocument(inputChunks)) {
		const source = group.sourceFilePath;
		if (!inputDocumentMap.has(source)) {
			inputDocumentMap.set(source, {
				source,
				title: group.title,
				slug: group.slug,
				pageType: group.pageType,
				sidebar: "jsSidebar",
				totalChunks: group.chunks.length,
				chunks: group.chunks,
			});
		}
	}

	// Determine which documents need to be inserted
	const documentsToInsert: DocumentToInsert[] = [];
	const documentIdMap = new Map<string, string>();
	for (const [source, docData] of inputDocumentMap.entries()) {
		const existingDoc = existingDocumentsBySource.get(source);
		if (existingDoc) {
			documentIdMap.set(source, existingDoc.id);
			console.log(`   📖 Document "${docData.title}" already exists`);
		} else {
			documentsToInsert.push(docData);
			console.log(`   📖 Document "${docData.title}" will be created`);
		}
	}

	// Find chunks that need embeddings(either don't exist or exist without embeddings)
	const chunksWithoutEmbeddings: ChunkData[] = [];
	let newChunks = 0;
	let existingWithoutEmbeddings = 0;
	for (const chunk of inputChunks) {
		if (!chunksWithEmbeddings.has(chunk.id)) {
			chunksWithoutEmbeddings.push(chunk);
			if (existingChunkIds.has(chunk.id)) {
				existingWithoutEmbeddings++;
			} else {
				newChunks++;
			}
		}
	}

	console.log(`   📊 Analysis summary:`);
	console.log(`      🆕 ${newChunks} completely new chunks need processing`);
	console.log(
		`      🔄 ${existingWithoutEmbeddings} existing chunks need embeddings`,
	);
	console.log(
		`      ⏭️  ${chunksWithEmbeddings.size} chunks already have embeddings (will skip)`,
	);
	console.log(
		`      🎯 Total chunks to process: ${chunksWithoutEmbeddings.length}`,
	);

	return {
		chunksWithEmbeddings,
		chunksWithoutEmbeddings,
		documentsToInsert,
		documentIdMap,
	};
}

export async function generateContextsForChunks(
	chunks: ChunkData[],
	cache = new Map<string, string>(),
): Promise<ChunkWithContext[]> {
	const chunksWithContexts: ChunkWithContext[] = await Promise.all(
		chunks.map(async (chunk) => {
			const filePath = chunk.source;
			let documentContent = cache.get(filePath);
			if (!documentContent) {
				const file = Bun.file(filePath);
				if (!(await file.exists())) {
					throw new Error(
						`Source file not found: ${filePath}. Re-run 'bun chunk-docs' to regenerate chunks.json.`,
					);
				}

				documentContent = await file.text();
				cache.set(filePath, documentContent);
			}

			const context = await generateContextForChunk(
				documentContent,
				chunk.text,
			);

			return {
				context,
				chunkContentPrefixed: `${context} ${chunk.text}`,
				chunk,
			};
		}),
	);

	return chunksWithContexts;
}

export function groupChunksByDocument(chunks: ChunkData[]): DocumentGroups {
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
