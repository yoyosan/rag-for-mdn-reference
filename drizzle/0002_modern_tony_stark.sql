ALTER TABLE "message_sources" RENAME COLUMN "relevance_store" TO "relevance_score";--> statement-breakpoint
CREATE INDEX "chunks_document_id_idx" ON "chunks" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "messages_conversation_id_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "message_sources_message_id_idx" ON "message_sources" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "message_sources_chunk_id_idx" ON "message_sources" USING btree ("chunk_id");