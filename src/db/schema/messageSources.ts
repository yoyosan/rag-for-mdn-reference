import {
	integer,
	pgTable,
	real,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { chunksTable } from "@/db/schema/chunks";
import { messagesTable } from "@/db/schema/messages";
import { ChunkId, MessageId, MessageSourceId } from "@/types/brands";

export const messageSourcesTable = pgTable("message_sources", {
	id: uuid("id").$type<MessageSourceId>().defaultRandom().primaryKey(),
	messageId: uuid("message_id")
		.$type<MessageId>()
		.references(() => messagesTable.id, { onDelete: "cascade" })
		.notNull(),
	chunkId: text("chunk_id")
		.$type<ChunkId>()
		.references(() => chunksTable.id, { onDelete: "cascade" })
		.notNull(),
	relevanceScore: real("relevance_store").notNull(), // Similarity/relevance from RAG
	citationNumber: integer("citation_number").notNull(), // For [1], [2], etc. in UI
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
