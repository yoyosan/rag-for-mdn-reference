import { pool } from "@/db";
import { performRAGQuery, RAGResponse } from "@/lib/rag";

/**
 * Format and display the RAG response
 */
function displayRAGResponse(response: RAGResponse, question: string): void {
	console.log("\n" + "=".repeat(80));
	console.log(`🎯 RAG RESPONSE FOR: "${question}"`);
	console.log("=".repeat(80));

	console.log("\n🤖 AI ANSWER:");
	console.log("-".repeat(40));
	console.log(response.answer);

	if (response.tokensUsed) {
		console.log(`\n📊 Tokens used: ${response.tokensUsed}`);
	}

	console.log("\n📚 SOURCES USED:");
	console.log("-".repeat(40));
	response.sources.forEach((source, index) => {
		console.log(`${index + 1}. ${source.documentTitle}`);
		console.log(`   📁 ${source.sourceFilePath}`);
		console.log(`   🎯 Similarity: ${(source.similarity * 100).toFixed(1)}%`);
		console.log(
			`   📄 "${source.content.substring(0, 100).replace(/\n/g, " ")}..."`,
		);
		console.log();
	});

	console.log("=".repeat(80));
}

/**
 * Handle command line arguments and interactive input
 */
async function main(): Promise<void> {
	const args = process.argv.slice(2);

	let question: string;
	let limit: number = 5;
	let similarityThreshold: number = 0.5;

	// Parse command line arguments
	if (args.length === 0) {
		// Interactive mode - prompt for question
		const readline = await import("readline");
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		question = await new Promise<string>((resolve) => {
			rl.question("🤔 Ask me anything: ", (answer) => {
				rl.close();
				resolve(answer.trim());
			});
		});
	} else {
		// Parse arguments: question --limit=N --threshold=N --model=X
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
		console.log('  bun rag-query "your question here"');
		console.log('  bun rag-query "your question" --limit=10 --threshold=0.6');
		console.log("  bun rag-query  (for interactive mode)");
		process.exit(1);
	}

	console.log("🚀 Starting RAG query...\n");
	console.log(`📝 Question: "${question}"`);
	console.log(
		`🔍 Retrieving up to ${limit} relevant chunks (threshold: ${(
			similarityThreshold * 100
		).toFixed(0)}%)`,
	);
	console.log(`🤖 Using model: llama-3.3-70b-versatile\n`);

	// Perform the RAG query
	const response = await performRAGQuery(question, {
		limit,
		similarityThreshold,
	});

	// Display the response
	displayRAGResponse(response, question);
}

// Run the script only if the file was ran from cli
if (import.meta.main) {
	try {
		await main();
	} catch (error) {
		console.error("Script failed:", error);
		process.exit(1);
	} finally {
		await pool.end();
	}
}
