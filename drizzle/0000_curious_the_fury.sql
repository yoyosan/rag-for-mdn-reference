CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536),
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
