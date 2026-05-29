import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { transformChunksForFrontend } from "@/lib/helpers/aiTools";
import { performSemanticSearch } from "@/lib/server/search";
import { defaultModel } from "@/lib/shared/constants";
import { SearchResult } from "@/types/semanticSearch";

if (!process.env.GROQ_API_KEY) {
	throw new Error("GROQ_API_KEY is required in .env.local");
}

export interface RAGResponse {
	answer: string;
	sources: SearchResult[];
	tokensUsed?: number;
}
/**
 * Format retrieved chunks into context for the LLM
 */
function formatContextFromChunks(chunks: SearchResult[]): string {
	if (chunks.length === 0) {
		return "No relevant context found.";
	}

	const context = `Here are the relevant documents to help answer the question:\n\n
    <context>
    ${JSON.stringify(transformChunksForFrontend(chunks))}
    </context>
	`;

	return context;
}

export const ragSystemPrompt = `You are a helpful AI assistant that answers questions based on the provided context documents. Please follow these guidelines:

1. Answer the question using primarily the information from the provided context documents
2. If the context doesn't contain enough information to fully answer the question, clearly state what information is missing
3. Be specific and cite which documents you're referencing when possible
4. If the context is contradictory or unclear, acknowledge this
5. Keep your answer concise but comprehensive
6. Use markdown formatting for better readability
7. Stick to the provided context as closely as possible and do NOT add any other information
8. Always include a link to referenced context document (it's url)
9. If the question is unrelated to the context, say so and don't try to answer it
10. Never ask a user to provide more context, they cannot.
11. When referring to the context documents, always use the term "MDN documentation"`;

/**
 * Create a prompt that combines the user's question with retrieved context
 */
function createRAGPrompt(question: string, context: string): string {
	return `${ragSystemPrompt}

Context Documents:
${context}

Question: ${question}

Answer:`;
}

async function queryLLM(
	question: string,
	context: string,
	model: string = defaultModel,
): Promise<{ answer: string; tokensUsed?: number }> {
	const prompt = createRAGPrompt(question, context);

	const { text, usage } = await generateText({
		model: groq(model),
		prompt,
		temperature: 0.1,
	});

	return { answer: text, tokensUsed: usage?.totalTokens };
}

export async function performRAGQuery(
	question: string,
	options: {
		limit?: number;
		model?: string;
	} = {},
): Promise<RAGResponse> {
	const { limit = 5, model = defaultModel } = options;

	const retrievedChunks = await performSemanticSearch(question, limit);

	if (retrievedChunks.length === 0) {
		return {
			answer:
				"I couldn't find any relevant information in the knowledge base to answer your question. You may want to try rephrasing your question or checking if the information exists in the documents.",
			sources: [],
		};
	}

	const context = formatContextFromChunks(retrievedChunks);
	const llmResponse = await queryLLM(question, context, model);

	return {
		answer: llmResponse.answer,
		sources: retrievedChunks,
		tokensUsed: llmResponse.tokensUsed,
	};
}
