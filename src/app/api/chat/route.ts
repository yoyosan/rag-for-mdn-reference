import { groq } from "@ai-sdk/groq";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { aiTools } from "@/lib/helpers/aiTools";
import { ragSystemPrompt } from "@/lib/server/rag";
import { defaultModel } from "@/lib/shared/constants";
import { chatRequestSchema } from "@/types/api/chat";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
	try {
		if (!process.env.VOYAGE_API_KEY || !process.env.GROQ_API_KEY) {
			return NextResponse.json(
				{ error: "Missing required API keys" },
				{ status: 500 },
			);
		}

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

		const { messages } = parseResult.data;
		const result = streamText({
			model: groq(defaultModel),
			messages: await convertToModelMessages(messages),
			stopWhen: stepCountIs(2),
			system:
				ragSystemPrompt +
				`\n\n Context documents are accessible with the queryKnowledgeBase tool.`,
			temperature: 0.1,
			tools: aiTools,
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
