import { pool } from "@/db";

export async function runScript(main: () => Promise<void>): Promise<void> {
	try {
		await main();
	} catch (error) {
		console.error("Script failed:", error);
		process.exit(1);
	} finally {
		try {
			await pool.end();
		} catch (error) {
			console.error("Failed to close database pool:", error);
		}
	}
}

export function parseMigrationSql(sql: string): string[] {
	const byBreakpoint = sql.split("--> statement-breakpoint");
	const statements: string[] = [];

	for (const section of byBreakpoint) {
		const trimmed = section.trim();
		if (!trimmed) {
			continue;
		}

		const lines = trimmed.split("\n");
		let currentStatement = "";
		let inDollarQuote = false;

		for (const line of lines) {
			const trimmedLine = line.trim();

			if (!trimmedLine || trimmedLine.startsWith("--")) {
				if (currentStatement.trim() && !inDollarQuote) {
					statements.push(currentStatement.trim());
					currentStatement = "";
				}
				continue;
			}

			currentStatement += (currentStatement ? "\n" : "") + line;

			if (trimmedLine.includes("$$")) {
				const dollarCount = (trimmedLine.match(/\$\$/g) || []).length;
				if (dollarCount % 2 === 1) {
					inDollarQuote = !inDollarQuote;
				}
			}

			if (trimmedLine.endsWith(";") && !inDollarQuote) {
				statements.push(currentStatement.trim());
				currentStatement = "";
			}
		}

		if (currentStatement.trim()) {
			statements.push(currentStatement.trim());
		}
	}

	return statements;
}
