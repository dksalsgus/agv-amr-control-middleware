-- CreateTable
CREATE TABLE "logs" (
    "id" BIGSERIAL NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "level" VARCHAR(10) NOT NULL,
    "target_type" VARCHAR(20) NOT NULL,
    "target_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "logs_created_at_idx" ON "logs"("created_at" DESC);
