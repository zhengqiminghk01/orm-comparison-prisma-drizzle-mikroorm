-- DropIndex
DROP INDEX "comment_media_comment_id_sort_order_key";

-- CreateIndex
CREATE INDEX "comment_media_comment_id_sort_order_idx" ON "comment_media"("comment_id", "sort_order");
