import { createHash } from "node:crypto";
import {
	copyFileSync,
	existsSync,
	readFileSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { pool } from "@/db";
import { parseMigrationSql, runScript } from "@/lib/scripts/utils";

interface JournalEntry {
	idx: number;
	version: string;
	when: number;
	tag: string;
	breakpoints: boolean;
}

interface Journal {
	version: string;
	dialect: string;
	entries: JournalEntry[];
}

function getJournal(): Promise<Journal> {
	const journalPath = join(process.cwd(), "drizzle", "meta", "_journal.json");
	return JSON.parse(readFileSync(journalPath, "utf-8"));
}

async function getAppliedMigrations(): Promise<Map<number, string>> {
	try {
		const result = await pool.query(
			'SELECT id, hash FROM drizzle."__drizzle_migrations" ORDER BY id',
		);
		const map = new Map<number, string>();
		for (const row of result.rows) {
			map.set(row.id, row.hash);
		}
		return map;
	} catch {
		return new Map();
	}
}

function computeHash(filePath: string): string {
	const content = readFileSync(filePath, "utf-8");
	return createHash("sha256").update(content).digest("hex");
}

function generateReverseSql(sql: string): string | null {
	const trimmed = sql.trim().toUpperCase();

	if (trimmed.startsWith("ALTER TABLE")) {
		const tableMatch = sql.match(/ALTER TABLE\s+"?([^"]+)"?/i);
		if (!tableMatch) {
			return null;
		}
		const table = tableMatch[1];

		if (/ADD COLUMN/i.test(sql)) {
			const colMatch = sql.match(/ADD COLUMN\s+"?([^"\s(]+)"?/i);
			if (colMatch) {
				return `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "${colMatch[1]}";`;
			}
		}

		if (/DROP NOT NULL/i.test(sql)) {
			const colMatch = sql.match(/ALTER COLUMN\s+"?([^"]+)"?/i);
			if (colMatch) {
				return `ALTER TABLE "${table}" ALTER COLUMN "${colMatch[1]}" SET NOT NULL;`;
			}
		}

		if (/SET NOT NULL/i.test(sql)) {
			const colMatch = sql.match(/ALTER COLUMN\s+"?([^"]+)"?/i);
			if (colMatch) {
				return `ALTER TABLE "${table}" ALTER COLUMN "${colMatch[1]}" DROP NOT NULL;`;
			}
		}

		if (/SET DATA TYPE/i.test(sql)) {
			const colMatch = sql.match(/ALTER COLUMN\s+"?([^"]+)"?/i);
			if (colMatch) {
				return `-- MANUAL: ALTER TABLE "${table}" ALTER COLUMN "${colMatch[1]}" SET DATA TYPE <previous_type>;`;
			}
		}

		if (/ADD CONSTRAINT/i.test(sql)) {
			const constraintMatch = sql.match(/ADD CONSTRAINT\s+"?([^"]+)"?/i);
			if (constraintMatch) {
				return `ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${constraintMatch[1]}";`;
			}
		}
	}

	if (/CREATE\s+(UNIQUE\s+)?INDEX/i.test(sql)) {
		const indexMatch = sql.match(
			/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?"?([^"\s(]+)"?/i,
		);
		if (indexMatch) {
			return `DROP INDEX IF EXISTS "${indexMatch[1]}";`;
		}
	}

	if (/CREATE OR REPLACE FUNCTION/i.test(sql)) {
		const funcMatch = sql.match(/CREATE OR REPLACE FUNCTION\s+"?([^"(]+)"?/i);
		const paramMatch = sql.match(
			/CREATE OR REPLACE FUNCTION\s+"?[^"(]+"?\s*\(([^)]*)\)/i,
		);
		if (funcMatch) {
			const params = paramMatch?.[1]?.trim() || "";
			return `DROP FUNCTION IF EXISTS "${funcMatch[1].trim()}"(${params});`;
		}
	}

	if (/CREATE TRIGGER/i.test(sql)) {
		const triggerMatch = sql.match(/CREATE TRIGGER\s+"?([^"\s]+)"?/i);
		const tableMatch = sql.match(/ON\s+"?([^"\s]+)"?/i);
		if (triggerMatch && tableMatch) {
			return `DROP TRIGGER IF EXISTS "${triggerMatch[1]}" ON "${tableMatch[1]}";`;
		}
	}

	return null;
}

function detectSchemaChanges(statements: string[]): string[] {
	const changes: string[] = [];

	for (const sql of statements) {
		const trimmed = sql.trim().toUpperCase();

		if (trimmed.startsWith("ALTER TABLE")) {
			const tableMatch = sql.match(/ALTER TABLE\s+"?([^"]+)"?/i);
			if (!tableMatch) continue;
			const table = tableMatch[1];

			if (/ADD COLUMN/i.test(sql)) {
				const colMatch = sql.match(/ADD COLUMN\s+"?([^"\s(]+)"?/i);
				if (colMatch) {
					changes.push(
						`Remove column "${colMatch[1]}" from "${table}" in src/db/schema/`,
					);
				}
			}

			if (/DROP NOT NULL/i.test(sql)) {
				const colMatch = sql.match(/ALTER COLUMN\s+"?([^"]+)"?/i);
				if (colMatch) {
					changes.push(
						`Add .notNull() to "${colMatch[1]}" in "${table}" schema`,
					);
				}
			}

			if (/SET NOT NULL/i.test(sql)) {
				const colMatch = sql.match(/ALTER COLUMN\s+"?([^"]+)"?/i);
				if (colMatch) {
					changes.push(
						`Remove .notNull() from "${colMatch[1]}" in "${table}" schema`,
					);
				}
			}

			if (/SET DATA TYPE/i.test(sql)) {
				const colMatch = sql.match(/ALTER COLUMN\s+"?([^"]+)"?/i);
				if (colMatch) {
					changes.push(
						`Revert type of "${colMatch[1]}" in "${table}" schema to previous type`,
					);
				}
			}
		}

		if (/CREATE INDEX/i.test(sql)) {
			const indexMatch = sql.match(/CREATE INDEX\s+"?([^"\s]+)"?/i);
			const tableMatch = sql.match(/ON\s+"?([^"\s]+)"?/i);
			if (indexMatch && tableMatch) {
				changes.push(
					`Remove index "${indexMatch[1]}" from "${tableMatch[1]}" schema (if defined there)`,
				);
			}
		}
	}

	return changes;
}

async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const isForce = args.includes("--force");
	const isDryRun = !isForce;

	console.log("⏪ Drizzle Migration Rollback");
	console.log("=".repeat(60));

	if (isDryRun) {
		console.log("\n🔍 DRY RUN MODE — All changes will be rolled back");
		console.log("   Use --force to actually rollback\n");
	} else {
		console.log("\n⚠️  FORCE MODE — Changes will be committed!\n");
	}

	const journal = await getJournal();
	const dbMigrations = await getAppliedMigrations();

	if (journal.entries.length === 0) {
		console.log("❌ No migrations found in journal.");
		return;
	}

	const lastEntry = journal.entries[journal.entries.length - 1];
	const sqlPath = join(process.cwd(), "drizzle", `${lastEntry.tag}.sql`);
	const expectedHash = computeHash(sqlPath);

	console.log(`📋 Last migration: ${lastEntry.tag}`);
	console.log(`   Hash: ${expectedHash}`);
	console.log(`   Journal entries: ${journal.entries.length}`);
	console.log(`   DB records: ${dbMigrations.size}`);

	const dbRecord = Array.from(dbMigrations.entries()).find(
		([, hash]) => hash === expectedHash,
	);
	const dbId = dbRecord ? dbRecord[0] : null;

	if (dbId) {
		console.log(`   Status: ✅ Recorded in DB (id: ${dbId})`);
	} else {
		console.log(`   Status: ❌ NOT recorded in DB`);
	}

	const sql = readFileSync(sqlPath, "utf-8");
	const statements = parseMigrationSql(sql);

	console.log(`\n📄 Forward SQL (${statements.length} statements):`);
	console.log("-".repeat(60));
	for (let i = 0; i < statements.length; i++) {
		console.log(`  ${i + 1}. ${statements[i].split("\n")[0]}...`);
	}

	const reverseStatements: string[] = [];
	const manualReverses: string[] = [];

	for (let i = statements.length - 1; i >= 0; i--) {
		const reverse = generateReverseSql(statements[i]);
		if (reverse) {
			if (reverse.startsWith("-- MANUAL:")) {
				manualReverses.push(reverse);
			} else {
				reverseStatements.push(reverse);
			}
		}
	}

	if (reverseStatements.length === 0 && manualReverses.length === 0) {
		console.log("\n❌ Could not generate reverse SQL for this migration.");
		console.log("   Manual rollback required.");
		return;
	}

	console.log(
		`\n⏪ Reverse SQL (${reverseStatements.length} auto + ${manualReverses.length} manual):`,
	);
	console.log("-".repeat(60));
	for (const stmt of reverseStatements) {
		console.log(`  ${stmt}`);
	}
	for (const stmt of manualReverses) {
		console.log(`  ⚠️  ${stmt}`);
	}

	if (manualReverses.length > 0) {
		console.log(
			"\n⚠️  Some operations require manual reverse SQL (marked above).",
		);
		console.log("   Edit the migration file or provide custom rollback SQL.");
	}

	const schemaChanges = detectSchemaChanges(statements);
	if (schemaChanges.length > 0) {
		console.log("\n📝 Detected TypeScript schema changes to revert:");
		console.log("-".repeat(60));
		for (const change of schemaChanges) {
			console.log(`  • ${change}`);
		}
	}

	if (isDryRun) {
		console.log("\n🛑 DRY RUN — no changes made.");
		console.log("   To execute rollback:");
		console.log(`   bun db:rollback --force`);
		return;
	}

	console.log("\n⚠️  About to execute rollback...");
	console.log("=".repeat(60));

	const readline = await import("node:readline");
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const confirmation = await new Promise<string>((resolve) => {
		rl.question(
			`\n❓ Type "yes" to confirm rollback of ${lastEntry.tag}: `,
			(answer) => {
				rl.close();
				resolve(answer.trim().toLowerCase());
			},
		);
	});

	if (confirmation !== "yes") {
		console.log("\n🛑 Rollback cancelled.");
		return;
	}

	const journalPath = join(process.cwd(), "drizzle", "meta", "_journal.json");
	const backupPath = join(
		process.cwd(),
		"drizzle",
		"meta",
		"_journal.json.backup",
	);

	const snapshotIndex = String(lastEntry.idx).padStart(4, "0");
	const snapshotPath = join(
		process.cwd(),
		"drizzle",
		"meta",
		`${snapshotIndex}_snapshot.json`,
	);

	const client = await pool.connect();

	try {
		// Phase 1: Backup and update files BEFORE COMMIT
		console.log("\n📝 Phase 1: Updating files...");

		copyFileSync(journalPath, backupPath);

		const journal = JSON.parse(readFileSync(journalPath, "utf-8"));
		const removedEntry = journal.entries.pop();
		if (!removedEntry) {
			throw new Error("No journal entry to remove");
		}
		writeFileSync(journalPath, `${JSON.stringify(journal, null, 2)}\n`);
		console.log(`   ✅ Updated _journal.json`);

		if (existsSync(sqlPath)) {
			unlinkSync(sqlPath);
			console.log(`   ✅ Deleted ${removedEntry.tag}.sql`);
		}
		if (existsSync(snapshotPath)) {
			unlinkSync(snapshotPath);
			console.log(`   ✅ Deleted ${snapshotIndex}_snapshot.json`);
		}

		// Phase 2: Execute SQL and COMMIT
		console.log("\n📝 Phase 2: Executing database rollback...");

		await client.query("BEGIN");

		for (const stmt of reverseStatements) {
			console.log(`\n  Executing: ${stmt}`);
			try {
				await client.query(stmt);
				console.log("  ✅ Success");
			} catch (error) {
				const pgError = error as { message: string; code?: string };
				console.log(`  ❌ FAILED: ${pgError.message}`);
				throw error;
			}
		}

		if (dbId) {
			await pool.query(
				'DELETE FROM drizzle."__drizzle_migrations" WHERE id = $1',
				[dbId],
			);
			console.log("   ✅ DB journal record removed.");
		}

		await client.query("COMMIT");
		console.log("\n✅ Rollback committed successfully!");

		// Clean up backup on success
		if (existsSync(backupPath)) {
			unlinkSync(backupPath);
		}

		console.log("\n⚠️  IMPORTANT: Schema TypeScript changes are NOT reverted.");
		console.log("   You must manually revert changes in src/db/schema/*.ts");
		console.log("   Then run 'bun db:generate' to create a new migration.");
	} catch (error) {
		// Restore files from backup on failure
		console.log("\n🔄 Restoring files from backup...");
		if (existsSync(backupPath)) {
			copyFileSync(backupPath, journalPath);
			unlinkSync(backupPath);
		}

		await client.query("ROLLBACK");
		console.log("🔄 ROLLED BACK — Error occurred, no changes made");
		throw error;
	} finally {
		client.release();
	}
}

if (import.meta.main) {
	runScript(main);
}
