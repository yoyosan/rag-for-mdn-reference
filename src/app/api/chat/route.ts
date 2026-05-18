import { NextRequest, NextResponse } from "next/server";
import slug from "slug";
import { performRAGQuery } from "@/lib/server/rag";
import { chatRequestSchema } from "@/types/client/chat";

function headingToSlug(headingText: string): string {
	if (!headingText) {
		return "";
	}

	return slug(headingText, {
		replacement: "_",
		remove: /[.]/g,
		lower: true,
	});
}

function generateMDNUrl(
	slug: string | null,
	headingContext: string | null = null,
): string {
	const baseUrl = slug
		? `https://developer.mozilla.org/en-US/docs/${slug}`
		: "https://developer.mozilla.org/en-US/docs/";

	if (headingContext) {
		return `${baseUrl}#${headingToSlug(headingContext)}`;
	}

	return baseUrl;
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const parseResult = chatRequestSchema.safeParse(body);

		if (!parseResult.success) {
			return NextResponse.json(
				{
					error: "Invalid request body",
					details: parseResult.error.issues.map((issue) => ({
						path: issue.path.join("."),
						message: issue.message,
					})),
				},
				{ status: 400 },
			);
		}

		const { message, limit, threshold, model } = parseResult.data;

		if (!process.env.VOYAGE_API_KEY || !process.env.GROQ_API_KEY) {
			return NextResponse.json(
				{ error: "Missing required API keys" },
				{ status: 500 },
			);
		}

		console.log(`🔍 RAG Query: "${message}"`);

		const ragResponse = await performRAGQuery(message, {
			limit,
			similarityThreshold: threshold,
			model,
		});

		const transformedSources = ragResponse.sources.map((source, index) => ({
			id: String(index + 1),
			title: source.documentTitle,
			snippet: source.content.substring(0, 200) + "...",
			url: generateMDNUrl(source.documentSlug, source.headingContext),
			similarity: source.similarity,
			sourceFilePath: source.sourceFilePath,
			chunkId: source.chunkId,
		}));

		return NextResponse.json({
			content: ragResponse.answer,
			sources: transformedSources,
			tokensUsed: ragResponse.tokensUsed,
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
