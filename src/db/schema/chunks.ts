import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
	vector,
} from "drizzle-orm/pg-core";
import { documentsTable } from "@/db/schema/documents";
import { ChunkId, DocumentId } from "@/types/brands";

export const chunksTable = pgTable(
	"chunks",
	{
		id: text("id").$type<ChunkId>().primaryKey(),
		documentId: uuid("document_id")
			.$type<DocumentId>()
			.references(() => documentsTable.id, { onDelete: "cascade" })
			.notNull(),
		content: text("content").notNull(),
		chunkIndex: integer("chunk_index").notNull(),
		startLine: integer("start_line"),
		endLine: integer("end_line"),
		headingContextText: text("heading_context_text"),
		headingContextLevel: integer("heading_context_level"),
		headingLineNumber: integer("heading_line_number"),
		characterCount: integer("character_count").notNull(),
		wordCount: integer("word_count").notNull(),
		embedding: vector("embedding", { dimensions: 1536 }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("chunks_document_id_idx").on(table.documentId)],
);
