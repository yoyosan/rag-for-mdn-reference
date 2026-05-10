import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { chunksTable } from "@/db/schema/chunks";
import { conversationsTable } from "@/db/schema/conversations";
import { documentsTable } from "@/db/schema/documents";
import { messageSourcesTable } from "@/db/schema/messageSources";
import { messagesTable } from "@/db/schema/messages";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not set");
}

const schema = {
	chunksTable,
	conversationsTable,
	documentsTable,
	messagesTable,
	messageSourcesTable,
};

export const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	max: 20,
	connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, { schema });
