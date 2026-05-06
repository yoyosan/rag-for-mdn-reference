import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { chunksTable } from "@/db/schema/chunks";
import { conversationsTable } from "@/db/schema/conversations";
import { documentsTable } from "@/db/schema/documents";
import { messageSourcesTable } from "@/db/schema/messageSources";
import { messagesTable } from "@/db/schema/messages";

const schema = {
	chunksTable,
	conversationsTable,
	documentsTable,
	messagesTable,
	messageSourcesTable,
};

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
