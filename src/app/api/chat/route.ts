import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import {
	getEmbedder,
	getLLM,
	getReranker,
	resolveEmbeddingModel,
} from "@/config/ai";
import { db } from "@/db";
import { rateLimitsTable } from "@/db/schema/rateLimits";
import { createAITools } from "@/lib/helpers/aiTools";
import { ragSystemPrompt } from "@/lib/server/rag";
import { AIProviders, type AIProviderType } from "@/types/aiProviders";
import { chatRequestSchema, type UserAISettings } from "@/types/api/chat";

// Vercel serverless function timeout
export const maxDuration = 30;
const RATE_LIMIT = 20;
const WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
	try {
		// Rate limit check
		const ip = req.headers.get("x-forwarded-for") || "unknown";
		const windowStart = Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS;

		// Upsert: increment count or create new row
		const [record] = await db
			.insert(rateLimitsTable)
			.values({ ip, windowStart, count: 1 })
			.onConflictDoUpdate({
				target: [rateLimitsTable.ip, rateLimitsTable.windowStart],
				set: { count: sql`${rateLimitsTable.count} + 1` },
			})
			.returning();

		if (record && record.count > RATE_LIMIT) {
			return NextResponse.json({ error: "Too many requests" }, { status: 429 });
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

		// get x-ai* related headers
		const headers = req.headers;

		const rawProvider = headers.get("x-ai-api-provider") as AIProviderType;
		if (!AIProviders.includes(rawProvider)) {
			return NextResponse.json(
				{
					error: `Invalid AI_PROVIDER: ${rawProvider}. Must be one of: ${AIProviders.join(", ")}`,
				},
				{ status: 400 },
			);
		}

		const userAISettings: UserAISettings = {
			aiApiKey: headers.get("x-ai-api-key"),
			aiApiProvider: rawProvider,
			aiModel: headers.get("x-ai-model"),
			aiEmbedModel: headers.get("x-ai-embed-model"),
			aiVoyageApiKey: headers.get("x-ai-voyage-api-key"),
		};
		const tools = createAITools({
			embedder: getEmbedder(
				"voyage",
				userAISettings.aiVoyageApiKey,
				userAISettings.aiEmbedModel,
			),
			reranker: getReranker("voyage", userAISettings.aiVoyageApiKey),
			embedModel: resolveEmbeddingModel(userAISettings.aiEmbedModel),
		});

		const { messages } = parseResult.data;
		const result = streamText({
			model: getLLM(
				userAISettings.aiApiProvider,
				userAISettings.aiApiKey,
				userAISettings.aiModel,
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
			},
			{ status: 500 },
		);
	}
}
