import type { conversationsTable } from "@/db/schema/conversations";

export type Conversation = typeof conversationsTable.$inferSelect;
export type NewConversation = typeof conversationsTable.$inferInsert;
