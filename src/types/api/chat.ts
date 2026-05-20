import z from "zod";
import { AppUIMessage, messageMetadataSchema } from "@/types/api/aiMessage";

const uiMessagePartSchema = z
	.object({
		type: z.string().min(1),
	})
	.loose();

const uiMessageSchema = z.object({
	id: z.string(),
	role: z.enum(["system", "user", "assistant"]),
	parts: z.array(uiMessagePartSchema),
	metadata: messageMetadataSchema.optional(),
});

export const chatRequestSchema = z.object({
	messages: z
		.array(uiMessageSchema)
		.min(1)
		.transform((s) => s as AppUIMessage[]),
});
