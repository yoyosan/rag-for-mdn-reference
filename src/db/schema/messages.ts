import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { conversationsTable } from "@/db/schema/conversations";
import type { ConversationId, MessageId } from "@/types/brands";

export const messageTypes = ["user", "ai"] as const;

export const messagesTable = pgTable(
	"messages",
	{
		id: uuid("id").$type<MessageId>().defaultRandom().primaryKey(),
		conversationId: uuid("conversation_id")
			.$type<ConversationId>()
			.references(() => conversationsTable.id)
			.notNull(),
		type: text("type", { enum: messageTypes }).notNull(),
		content: text("content").notNull(),
		isStreaming: boolean("is_streaming").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("messages_conversation_id_idx").on(table.conversationId)],
);
