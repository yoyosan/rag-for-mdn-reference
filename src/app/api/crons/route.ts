import { lt } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rateLimitsTable } from "@/db/schema/rateLimits";

export async function GET(req: NextRequest) {
	const auth = req.headers.get("authorization");
	if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

	await db
		.delete(rateLimitsTable)
		.where(lt(rateLimitsTable.windowStart, sevenDaysAgo));

	return NextResponse.json({ cleaned: true });
}
