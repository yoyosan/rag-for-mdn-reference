import { ProviderResponse } from "promptfoo";
import z from "zod";

export const cachedResultSchema = z.object({
	output: z.array(z.record(z.string(), z.unknown())),
});
export type CachedResult = z.output<typeof cachedResultSchema>;
