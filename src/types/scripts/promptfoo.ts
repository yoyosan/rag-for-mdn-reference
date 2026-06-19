import z from "zod";

export const cachedResultSchema = z.object({
	output: z.union([
		z.array(z.record(z.string(), z.unknown())),
		z.record(z.string(), z.unknown()),
	]),
});
export type CachedResult = z.output<typeof cachedResultSchema>;
