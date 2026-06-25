import type { documentsTable } from "@/db/schema/documents";

export type Document = typeof documentsTable.$inferSelect;
export type NewDocument = typeof documentsTable.$inferInsert;
export type InsertedDocument = Omit<
	Document,
	"createdAt" | "updatedAt" | "processedAt"
>;
