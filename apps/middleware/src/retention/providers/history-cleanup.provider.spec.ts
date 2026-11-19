import { retentionConfig } from "../../config/retention.config";
import { LogsRepository } from "../../history/logs.repository";
import { VendorsConnectionsDevicesPlcPointsEventsRepository } from "../../history/vendors-connections-devices-plc-points-events.repository";
import { VendorsConnectionsDevicesTelemetryRepository } from "../../history/vendors-connections-devices-telemetry.repository";
import { HistoryCleanupProvider } from "./history-cleanup.provider";

describe("HistoryCleanupProvider", () => {
  it("묶음보다 적게 지워질 때까지 묶음 단위로 계속 지운다", async () => {
    const config = Object.assign(retentionConfig(), { deleteBatchSize: 10 });
    const batches = [10, 10, 3];
    const deleteOlderThan = jest.fn(async () => batches.shift() ?? 0);
    const telemetry = {
      deleteOlderThan,
    } as unknown as VendorsConnectionsDevicesTelemetryRepository;
    const provider = new HistoryCleanupProvider(
      config,
      telemetry,
      {} as VendorsConnectionsDevicesPlcPointsEventsRepository,
      {} as LogsRepository,
    );
    const cutoff = new Date("2026-11-18T00:00:00Z");

    expect(await provider.deleteTelemetry(cutoff)).toBe(23);
    expect(deleteOlderThan).toHaveBeenCalledTimes(3);
    expect(deleteOlderThan).toHaveBeenCalledWith(cutoff, 10);
  });
});
