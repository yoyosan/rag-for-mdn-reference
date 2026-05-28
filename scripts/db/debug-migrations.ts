import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pool } from "@/db";
import { parseMigrationSql, runScript } from "@/lib/scripts/utils";

async function getAppliedMigrations(): Promise<Set<string>> {
	try {
		const result = await pool.query(
			'SELECT hash FROM drizzle."__drizzle_migrations"',
		);
		return new Set(result.rows.map((r) => r.hash));
	} catch {
		return new Set();
	}
}

function computeMigrationHash(filePath: string): string {
	const content = readFileSync(filePath, "utf-8");
	return createHash("sha256").update(content).digest("hex");
}

function getMigrationFiles(): Array<{ tag: string; path: string }> {
	const drizzleDir = join(process.cwd(), "drizzle");
	const files = readdirSync(drizzleDir)
		.filter((f) => f.endsWith(".sql"))
		.sort();

	return files.map((file) => ({
		tag: file.replace(".sql", ""),
		path: join(drizzleDir, file),
	}));
}

type StatementResult = {
	statement: string;
	success: boolean;
	error?: string;
	code?: string;
};

type MigrationResult = {
	tag: string;
	statements: StatementResult[];
	failed: boolean;
};

async function runMigrationInTransaction(
	filePath: string,
	tag: string,
	client: import("pg").PoolClient,
	isDryRun: boolean,
): Promise<MigrationResult> {
	console.log(
		`\n📝 ${isDryRun ? "[DRY RUN] Checking" : "Running"} migration: ${tag}`,
	);
	console.log("-".repeat(60));

	const sql = readFileSync(filePath, "utf-8");
	const statements = parseMigrationSql(sql);

	const results: StatementResult[] = [];

	for (let i = 0; i < statements.length; i++) {
		const statement = statements[i];
		console.log(
			`\n  [${i + 1}/${statements.length}] ${statement.split("\n")[0]}...`,
		);

		try {
			await client.query(statement);
			console.log(`  ✅ Success`);
			results.push({ statement: statement.split("\n")[0], success: true });
		} catch (error) {
			const pgError = error as {
				code?: string;
				message: string;
				detail?: string;
				hint?: string;
			};

			// PG error codes for objects that already exist or can't be auto-cast
			// https://www.postgresql.org/docs/current/errcodes-appendix.html
			const alreadyExistsCodes = new Set([
				"42P07", // duplicate_table
				"42710", // duplicate_object (index, type, etc.)
				"42P16", // invalid_table_definition (column already has type)
				"42703", // undefined_column (already renamed/dropped)
				"42701", // duplicate_column (already added)
			]);

			if (pgError.code && alreadyExistsCodes.has(pgError.code)) {
				console.log(`  ⚠️  Already exists, skipping`);
				results.push({ statement: statement.split("\n")[0], success: true });
				continue;
			}

			console.log(`  ❌ FAILED`);
			console.log(`     Error: ${pgError.message}`);
			if (pgError.code) {
				console.log(`     Code: ${pgError.code}`);
			}
			if (pgError.detail) {
				console.log(`     Detail: ${pgError.detail}`);
			}
			if (pgError.hint) {
				console.log(`     Hint: ${pgError.hint}`);
			}

			results.push({
				statement: statement.split("\n")[0],
				success: false,
				error: pgError.message,
				code: pgError.code,
			});

			return { tag, statements: results, failed: true };
		}
	}

	return { tag, statements: results, failed: false };
}

async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const isForce = args.includes("--force");
	const isDryRun = !isForce;

	console.log("🔧 Drizzle Migration Debugger");
	console.log("=".repeat(60));

	if (isDryRun) {
		console.log("\n🔍 DRY RUN MODE — All changes will be rolled back");
		console.log("   Use --force to actually apply migrations\n");
	} else {
		console.log("\n⚠️  FORCE MODE — Changes will be committed!\n");
	}

	const applied = await getAppliedMigrations();
	const files = getMigrationFiles();

	console.log(`📊 Status:`);
	console.log(`   Applied migrations: ${applied.size}`);
	console.log(`   Migration files found: ${files.length}`);

	const pending = files.filter(
		(f) => !applied.has(computeMigrationHash(f.path)),
	);

	if (pending.length === 0) {
		console.log("\n✅ All migrations are already applied!");
		return;
	}

	console.log(`\n⏳ Pending migrations (${pending.length}):`);
	for (const { tag } of pending) {
		console.log(`   - ${tag}`);
	}

	console.log("\n" + "=".repeat(60));
	console.log(
		isDryRun
			? "Checking migrations (will rollback)..."
			: "Applying migrations...",
	);
	console.log("=".repeat(60));

	if (!isDryRun) {
		const readline = await import("readline");
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		const migrationNames = pending.map((p) => p.tag).join(", ");
		const confirmation = await new Promise<string>((resolve) => {
			rl.question(
				`\n❓ Type "yes" to confirm applying ${pending.length} migration(s) (${migrationNames}): `,
				(answer) => {
					rl.close();
					resolve(answer.trim().toLowerCase());
				},
			);
		});

		if (confirmation !== "yes") {
			console.log("\n🛑 Migration application cancelled.");
			return;
		}
	}

	const client = await pool.connect();
	const results: MigrationResult[] = [];
	let allSuccess = true;

	try {
		await client.query("BEGIN");

		for (const { tag, path } of pending) {
			const result = await runMigrationInTransaction(
				path,
				tag,
				client,
				isDryRun,
			);
			results.push(result);

			if (result.failed) {
				allSuccess = false;
				break;
			}
		}

		if (isDryRun) {
			await client.query("ROLLBACK");
			console.log("\n" + "=".repeat(60));
			console.log("🔄 ROLLED BACK — No changes were made to the database");
		} else if (allSuccess) {
			await client.query("COMMIT");
			console.log("\n" + "=".repeat(60));
			console.log("✅ COMMITTED — All migrations applied successfully!");
		} else {
			await client.query("ROLLBACK");
			console.log("\n" + "=".repeat(60));
			console.log("🔄 ROLLED BACK — Errors were found, no changes made");
		}

		console.log("\n📋 Summary:");
		console.log("-".repeat(60));
		for (const result of results) {
			const icon = result.failed ? "❌" : "✅";
			console.log(`${icon} ${result.tag}`);
			for (const stmt of result.statements) {
				const stmtIcon = stmt.success ? "  ✅" : "  ❌";
				console.log(`${stmtIcon} ${stmt.statement}`);
				if (stmt.error) {
					console.log(`     Error: ${stmt.error}`);
					if (stmt.code) {
						console.log(`     Code: ${stmt.code}`);
					}
				}
			}
		}

		if (isDryRun && allSuccess) {
			console.log("\n⚠️  DRY RUN complete. To apply these migrations:");
			console.log("   bun db:debug-migrations --force");
			console.log(
				"\n   After applying, run 'bun db:migrate' to update the journal.",
			);
		}
	} finally {
		client.release();
	}
}

if (import.meta.main) {
	runScript(main);
}
