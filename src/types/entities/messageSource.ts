import { messageSourcesTable } from "@/db/schema/messageSources";

export type MessageSource = typeof messageSourcesTable.$inferSelect;
export type NewMessageSource = typeof messageSourcesTable.$inferInsert;
