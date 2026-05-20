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
