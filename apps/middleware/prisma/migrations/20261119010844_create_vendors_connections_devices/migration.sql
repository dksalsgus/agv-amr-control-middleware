-- CreateEnum
CREATE TYPE "vendors_connections_protocol" AS ENUM ('MQTT', 'REST', 'MODBUS_TCP');

-- CreateEnum
CREATE TYPE "vendors_connections_devices_type" AS ENUM ('AMR', 'AGV', 'PLC');

-- CreateTable
CREATE TABLE "vendors" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors_connections" (
    "id" UUID NOT NULL,
    "vendors_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "protocol" "vendors_connections_protocol" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendors_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors_connections_devices" (
    "id" UUID NOT NULL,
    "vendors_connections_id" UUID NOT NULL,
    "external_id" TEXT NOT NULL,
    "type" "vendors_connections_devices_type" NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendors_connections_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendors_code_key" ON "vendors"("code");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_connections_name_key" ON "vendors_connections"("name");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_connections_devices_vendors_connections_id_external_key" ON "vendors_connections_devices"("vendors_connections_id", "external_id");

-- AddForeignKey
ALTER TABLE "vendors_connections" ADD CONSTRAINT "vendors_connections_vendors_id_fkey" FOREIGN KEY ("vendors_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors_connections_devices" ADD CONSTRAINT "vendors_connections_devices_vendors_connections_id_fkey" FOREIGN KEY ("vendors_connections_id") REFERENCES "vendors_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
