import { pgTable, serial, text, timestamp, vector } from "drizzle-orm/pg-core";

export const documents = pgTable("documents", {
	id: serial("id").primaryKey(),
	content: text("content").notNull(),
	embedding: vector("embedding", { dimensions: 1536 }),
	metadata: text("metadata"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
