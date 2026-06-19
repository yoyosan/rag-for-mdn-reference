import z from "zod";
import { AIProviderType } from "@/types/aiProviders";
import { AppUIMessage, messageMetadataSchema } from "@/types/api/aiMessage";

export type UserAISettings = {
	aiApiKey?: string | null;
	aiApiProvider?: AIProviderType | null;
	aiModel?: string | null;
	aiEmbedModel?: string | null;
	aiVoyageApiKey?: string | null;
};

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
		.max(50)
		.transform((s) => s as AppUIMessage[]),
});
