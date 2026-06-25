import {
	index,
	integer,
	pgTable,
	real,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { chunksTable } from "@/db/schema/chunks";
import { messagesTable } from "@/db/schema/messages";
import type { ChunkId, MessageId, MessageSourceId } from "@/types/brands";

export const messageSourcesTable = pgTable(
	"message_sources",
	{
		id: uuid("id").$type<MessageSourceId>().defaultRandom().primaryKey(),
		messageId: uuid("message_id")
			.$type<MessageId>()
			.references(() => messagesTable.id)
			.notNull(),
		chunkId: text("chunk_id")
			.$type<ChunkId>()
			.references(() => chunksTable.id)
			.notNull(),
		relevanceScore: real("relevance_score").notNull(), // Similarity/relevance from RAG
		citationNumber: integer("citation_number").notNull(), // For [1], [2], etc. in UI
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("message_sources_message_id_idx").on(table.messageId),
		index("message_sources_chunk_id_idx").on(table.chunkId),
	],
);
