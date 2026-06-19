import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import {
	getEmbedder,
	getLLM,
	getReranker,
	resolveEmbeddingModel,
} from "@/config/ai";
import { createAITools } from "@/lib/helpers/aiTools";
import { ragSystemPrompt } from "@/lib/server/rag";
import { AIProviderType } from "@/types/aiProviders";
import { chatRequestSchema, UserAISettings } from "@/types/api/chat";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const parseResult = chatRequestSchema.safeParse(body);

		if (!parseResult.success) {
			return NextResponse.json(
				{
					error: "Invalid request body",
					details: parseResult.error.issues,
				},
				{ status: 400 },
			);
		}

		// get x-ai* related headers
		const headers = req.headers;
		const userAISettings: UserAISettings = {
			aiApiKey: headers.get("x-ai-api-key"),
			aiApiProvider: headers.get("x-ai-api-provider") as AIProviderType | null,
			aiModel: headers.get("x-ai-model"),
			aiEmbedModel: headers.get("x-ai-embed-model"),
			aiVoyageApiKey: headers.get("x-ai-voyage-api-key"),
		};
		const tools = createAITools({
			embedder: getEmbedder(
				"voyage",
				userAISettings["aiVoyageApiKey"],
				userAISettings["aiEmbedModel"],
			),
			reranker: getReranker("voyage", userAISettings["aiVoyageApiKey"]),
			embedModel: resolveEmbeddingModel(userAISettings["aiEmbedModel"]),
		});

		const { messages } = parseResult.data;
		const result = streamText({
			model: getLLM(
				userAISettings["aiApiProvider"],
				userAISettings["aiApiKey"],
				userAISettings["aiModel"],
			),
			messages: await convertToModelMessages(messages),
			stopWhen: stepCountIs(2),
			system:
				ragSystemPrompt +
				`\n\n Context documents are accessible with the queryKnowledgeBase tool.`,
			temperature: 0.1,
			tools,
		});

		return result.toUIMessageStreamResponse({
			originalMessages: messages,
			messageMetadata: ({ part }) => {
				if (part.type === "start") {
					return {
						createdAt: Date.now(),
					};
				}
			},
		});
	} catch (error) {
		console.error("RAG API error: ", error);

		return NextResponse.json(
			{
				error: "Failed to process question",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
