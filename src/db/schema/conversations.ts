import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { ConversationId } from "@/types/brands";

export const conversationsTable = pgTable("conversations", {
	id: uuid("id").$type<ConversationId>().defaultRandom().primaryKey(),
	title: text("title"), // Auto-generated from first message or user-set
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});
