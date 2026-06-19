CREATE TABLE "rate_limits" (
	"ip" text NOT NULL,
	"window_start" integer NOT NULL,
	"count" integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ip_window_idx" ON "rate_limits" USING btree ("ip","window_start");