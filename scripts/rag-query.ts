import { runScript } from "@/lib/scripts/utils";
import { performRAGQuery, RAGResponse } from "@/lib/server/rag";
import { defaultModel } from "@/lib/shared/constants";

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
		console.log('  bun rag-query "your question here"');
		console.log('  bun rag-query "your question" --limit=10');
		console.log("  bun rag-query  (for interactive mode)");
		process.exit(1);
	}

	console.log("🚀 Starting RAG query...\n");
	console.log(`📝 Question: "${question}"`);
	console.log(`🤖 Using model: ${defaultModel}\n`);

	const response = await performRAGQuery(question, {
		limit,
	});

	displayRAGResponse(response, question);
}

// Run the script only if the file was ran from cli
if (import.meta.main) {
	await runScript(main);
}
