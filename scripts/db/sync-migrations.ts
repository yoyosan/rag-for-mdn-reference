import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pool } from "@/db";
import { runScript } from "@/lib/scripts/utils";

function computeHash(filePath: string): string {
	const content = readFileSync(filePath, "utf-8");
	return createHash("sha256").update(content).digest("hex");
}

async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const isForce = args.includes("--force");
	const isDryRun = !isForce;

	const migrationsDir = join(process.cwd(), "drizzle");
	const journalPath = join(migrationsDir, "meta", "_journal.json");

	const journal = JSON.parse(readFileSync(journalPath, "utf-8"));

	console.log("🔧 Migration Journal Sync");
	console.log("=".repeat(60));

	let dbResult: { rows: { hash: string }[] };
	try {
		dbResult = await pool.query(
			'SELECT hash FROM drizzle."__drizzle_migrations"',
		);
	} catch (error) {
		const pgError = error as { code?: string; message: string };
		if (pgError.code === "42P01") {
			console.log(
				'⚠️  drizzle."__drizzle_migrations" table not found.' +
					" Run 'bun db:migrate' first to initialize the journal.",
			);
		}
		throw error;
	}

	const dbHashes = new Set(dbResult.rows.map((r) => r.hash));

	console.log(`\n📊 DB has ${dbHashes.size} recorded migrations`);
	console.log(`📁 Journal has ${journal.entries.length} entries`);

	if (isDryRun) {
		console.log("\n🔍 DRY RUN MODE — use --force to actually sync");
	}

	const unrecorded: Array<{ tag: string; hash: string; path: string }> = [];

	for (const entry of journal.entries) {
		const sqlPath = join(migrationsDir, `${entry.tag}.sql`);
		const hash = computeHash(sqlPath);
		const isRecorded = dbHashes.has(hash);

		console.log(`\n${isRecorded ? "✅" : "❌"} ${entry.tag}`);
		console.log(`   Hash: ${hash}`);

		if (!isRecorded) {
			unrecorded.push({ tag: entry.tag, hash, path: sqlPath });
			console.log(`   Status: NOT recorded in journal`);
			console.log(`   File: ${sqlPath}`);
		}
	}

	if (unrecorded.length === 0) {
		console.log("\n✅ All migrations are already in sync!");
		return;
	}

	console.log(
		`\n⚠️  ${unrecorded.length} migration(s) not recorded in journal:`,
	);
	for (const { tag } of unrecorded) {
		console.log(`   - ${tag}`);
	}

	console.log(
		"\n⚠️  WARNING: Only sync migrations that were ACTUALLY applied to the DB.",
	);
	console.log(
		"   If you sync unapplied migrations, drizzle-kit will skip them on 'db:migrate'.",
	);

	for (const { tag, path } of unrecorded) {
		const sql = readFileSync(path, "utf-8");
		console.log(`\n📄 SQL content of ${tag}:`);
		console.log("-".repeat(60));
		console.log(sql.substring(0, 500));
		if (sql.length > 500) {
			console.log(`... (${sql.length - 500} more chars)`);
		}
		console.log("-".repeat(60));
	}

	if (isDryRun) {
		console.log(
			"\n🛑 DRY RUN — no changes made." +
				" Run with --force after verifying the SQL was applied.",
		);
		console.log("\n   bun db:sync-migrations --force");
		return;
	}

	console.log("\n📝 Recording migrations...");
	for (const { tag, hash } of unrecorded) {
		await pool.query(
			'INSERT INTO drizzle."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)',
			[hash, BigInt(Date.now())],
		);
		console.log(`   ✅ Recorded ${tag}`);
	}

	console.log("\n✅ Journal synced!");
}

if (import.meta.main) {
	runScript(main);
}
