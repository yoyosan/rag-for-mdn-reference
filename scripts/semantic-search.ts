import { runScript } from "@/lib/scripts/utils";
import { performSemanticSearch } from "@/lib/server/search";
import { SearchResult } from "@/types/semanticSearch";

if (!process.env.VOYAGE_API_KEY) {
	throw new Error("VOYAGE_API_KEY is required in .env.local");
}

function displayResults(results: SearchResult[], question: string): void {
	console.log("\n" + "=".repeat(80));
	console.log(`📊 SEMANTIC SEARCH RESULTS FOR: "${question}"`);
	console.log("=".repeat(80));

	if (results.length === 0) {
		console.log("🔍 No relevant chunks found above the similarity threshold.");
		console.log("💡 Try:");
		console.log("   - Rephrasing your question");
		console.log("   - Using different keywords");
		console.log("   - Lowering the similarity threshold");
		return;
	}

	results.forEach((result, index) => {
		console.log(`\n📄 RESULT ${index + 1}:`);
		console.log(`   📋 Document: ${result.documentTitle}`);
		console.log(`   📁 Source: ${result.sourceFilePath}`);
		console.log(`   🔗 Slug: ${result.documentSlug || "N/A"}`);
		console.log(`   🎯 RRF Score: ${result.similarity.toFixed(6)}`);
		if (result.vectorScore !== undefined) {
			console.log(
				`   🔢 Vector Score: ${(result.vectorScore * 100).toFixed(2)}%`,
			);
		}
		if (result.bm25Score !== undefined) {
			console.log(`   🔤 BM25 Score: ${(result.bm25Score * 100).toFixed(2)}%`);
		}
		console.log(
			`   📏 Length: ${result.characterCount} chars, ${result.wordCount} words`,
		);

		if (result.headingContext) {
			console.log(`   🏷️  Context: ${result.headingContext}`);
		}

		console.log(`   💬 Content Preview:`);
		console.log(
			`   "${result.content.substring(0, 200).replace(/\n/g, " ")}${
				result.content.length > 200 ? "..." : ""
			}"`,
		);
		console.log(`   🆔 Chunk ID: ${result.chunkId}`);

		if (index < results.length - 1) {
			console.log("\n" + "-".repeat(40));
		}
	});

	console.log("\n" + "=".repeat(80));
}

async function main(): Promise<void> {
	const args = process.argv.slice(2);

	let question: string;
	let limit: number = 5;

	if (args.length === 0) {
		// Interactive mode - prompt for question
		const readline = await import("readline");
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		question = await new Promise<string>((resolve) => {
			rl.question("🤔 Enter your question: ", (answer) => {
				rl.close();
				resolve(answer.trim());
			});
		});
	} else {
		// Parse arguments: question --limit=N --threshold=N
		question = args.filter((arg) => !arg.startsWith("--")).join(" ");

		// Parse optional parameters
		const limitArg = args.find((arg) => arg.startsWith("--limit="));

		if (limitArg) {
			const parsed = parseInt(limitArg.split("=")[1], 10);
			if (!isNaN(parsed) && parsed > 0) {
				limit = parsed;
			} else {
				console.warn(`⚠️  Invalid --limit value, using default: ${limit}`);
			}
		}
	}

	if (!question) {
		console.error("❌ No question provided");
		console.log("Usage:");
		console.log('  bun semantic-search "your question here"');
		console.log(
			'  bun semantic-search "your question" --limit=10 --threshold=0.6',
		);
		console.log("  bun semantic-search  (for interactive mode)");
		process.exit(1);
	}

	console.log(`Question: "${question}"`);
	console.log(`Limit: ${limit} results`);

	console.log("🚀 Starting semantic search...\n");

	await performSemanticSearch(question, limit, (results) =>
		displayResults(results, question),
	);
}

// Run the script only if the file was ran from cli
if (import.meta.main) {
	await runScript(main);
}
