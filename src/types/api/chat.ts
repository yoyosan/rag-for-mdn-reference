import z from "zod";
import { defaultModel } from "@/lib/shared/constants";

export const chatRequestSchema = z.object({
	message: z.string().min(1),
	limit: z.number().int().min(1).max(10).default(5),
	threshold: z.number().min(0).max(1).default(0.5),
	model: z.string().min(5).default(defaultModel),
});
