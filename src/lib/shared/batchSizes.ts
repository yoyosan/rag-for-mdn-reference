export const BATCH_SIZES = {
	/** Max chunks per Voyage AI API call (hard limit from Voyage) */
	voyageEmbedding: 128,
	/** Chunks per LLM context generation batch. Balances cost vs. parallelism. */
	contextGeneration: 25,
} as const;
