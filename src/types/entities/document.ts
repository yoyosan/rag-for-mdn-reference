import { documentsTable } from "@/db/schema/documents";

export type Document = typeof documentsTable.$inferSelect;
export type NewDocument = typeof documentsTable.$inferInsert;
