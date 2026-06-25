import type { InferUITools, UIDataTypes, UIMessage } from "ai";
import z from "zod";
import type { AITools } from "@/lib/helpers/aiTools";

// Infer the types from the tool set
type MyUITools = InferUITools<AITools>;

export const messageMetadataSchema = z.object({
	createdAt: z.number(),
});
export type MessageMetadata = z.output<typeof messageMetadataSchema>;

export type AppUIMessage = UIMessage<MessageMetadata, UIDataTypes, MyUITools>;
