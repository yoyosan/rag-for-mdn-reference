import type { messagesTable, messageTypes } from "@/db/schema/messages";

export type Message = typeof messagesTable.$inferSelect;
export type NewMessage = typeof messagesTable.$inferInsert;
export type MessageType = (typeof messageTypes)[number];
