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
		console.log(`   🎯 Similarity: ${(result.similarity * 100).toFixed(2)}%`);
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
	let similarityThreshold: number = 0.5;

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
		const thresholdArg = args.find((arg) => arg.startsWith("--threshold="));

		if (limitArg) {
			const parsed = parseInt(limitArg.split("=")[1], 10);
			if (!isNaN(parsed) && parsed > 0) {
				limit = parsed;
			} else {
				console.warn(`⚠️  Invalid --limit value, using default: ${limit}`);
			}
		}

		if (thresholdArg) {
			const parsed = parseFloat(thresholdArg.split("=")[1]);
			if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
				similarityThreshold = parsed;
			} else {
				console.warn(
					`⚠️  Invalid --threshold value (must be 0-1), using default: ${similarityThreshold}`,
				);
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
	console.log(
		`Similarity threshold: ${(similarityThreshold * 100).toFixed(0)}%\n`,
	);

	console.log("🚀 Starting semantic search...\n");

	await performSemanticSearch(question, limit, similarityThreshold, (results) =>
		displayResults(results, question),
	);
}

// Run the script only if the file was ran from cli
if (import.meta.main) {
	await runScript(main);
}
