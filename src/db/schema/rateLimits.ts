import {
	bigint,
	integer,
	pgTable,
	text,
	uniqueIndex,
} from "drizzle-orm/pg-core";

export const rateLimitsTable = pgTable(
	"rate_limits",
	{
		ip: text("ip").notNull(),
		windowStart: bigint("window_start", { mode: "number" }).notNull(),
		count: integer("count").notNull(),
	},
	(t) => [uniqueIndex("ip_window_idx").on(t.ip, t.windowStart)],
);
