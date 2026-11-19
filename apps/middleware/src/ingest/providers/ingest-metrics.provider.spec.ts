import { IngestMetricsRepository } from "../../state/ingest-metrics.repository";
import { IngestMetricsProvider } from "./ingest-metrics.provider";

describe("IngestMetricsProvider", () => {
  it("판정별로 세고, 받아들인 것만 지연 표본에 넣는다", async () => {
    const repository = new IngestMetricsRepository();
    const provider = new IngestMetricsProvider(repository);
    const sourceTs = new Date(1000);

    await provider.record(
      "VENDOR_A MQTT",
      { verdict: "NORMAL", accept: true, missed: 0 },
      sourceTs,
      new Date(1040),
    );
    await provider.record(
      "VENDOR_A MQTT",
      { verdict: "GAP", accept: true, missed: 2 },
      sourceTs,
      new Date(1060),
    );
    await provider.record(
      "VENDOR_A MQTT",
      { verdict: "DUPLICATE", accept: false, missed: 0 },
      sourceTs,
      new Date(1070),
    );
    await provider.record(
      "VENDOR_A MQTT",
      { verdict: "OUT_OF_ORDER", accept: false, missed: 0 },
      sourceTs,
      new Date(1080),
    );

    expect(await repository.findOrCreate("VENDOR_A MQTT")).toEqual({
      key: "VENDOR_A MQTT",
      received: 4,
      accepted: 2,
      duplicates: 1,
      outOfOrder: 1,
      missed: 2,
      latenciesMs: [40, 60],
    });
  });
});
