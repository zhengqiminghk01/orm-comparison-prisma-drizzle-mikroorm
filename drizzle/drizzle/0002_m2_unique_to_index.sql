DROP INDEX "comment_media_comment_id_sort_order_index";--> statement-breakpoint
CREATE INDEX "comment_media_comment_id_sort_order_index" ON "comment_media" USING btree ("comment_id","sort_order");