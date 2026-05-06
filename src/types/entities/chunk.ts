import { chunksTable } from "@/db/schema/chunks";

export type Chunk = typeof chunksTable.$inferSelect;
export type NewChunk = typeof chunksTable.$inferInsert;
