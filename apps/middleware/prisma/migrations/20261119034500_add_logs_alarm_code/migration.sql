-- AlterTable
ALTER TABLE "logs" ADD COLUMN "alarm_code" VARCHAR(20);

-- CreateIndex
CREATE INDEX "logs_target_type_target_id_created_at_idx" ON "logs"("target_type", "target_id", "created_at" DESC);
