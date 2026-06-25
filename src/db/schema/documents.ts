import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { DocumentId } from "@/types/brands";

export const documentsTable = pgTable("documents", {
	id: uuid("id").$type<DocumentId>().defaultRandom().primaryKey(),
	title: text("title").notNull(),
	slug: text("slug"),
	sourceFilePath: text("source_file_path").notNull(),
	pageType: text("page_type"),
	sidebar: text("sidebar"),
	totalChunks: integer("total_chunks").notNull().default(0),
	processedAt: timestamp("processed_at").defaultNow().notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});
