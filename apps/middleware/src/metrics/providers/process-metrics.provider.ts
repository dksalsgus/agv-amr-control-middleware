import { Injectable } from "@nestjs/common";
import { round2 } from "../../common/utils/percentile.util";
import { ProcessSample } from "../../state/process-metrics";
import { ProcessMetricsRepository } from "../../state/process-metrics.repository";

/** 이 프로세스의 CPU 사용률(코어 1개 = 100%)과 메모리를 잰다. */
@Injectable()
export class ProcessMetricsProvider {
  private static readonly MB = 1024 * 1024;

  private lastCpu = process.cpuUsage();
  private lastAt = Date.now();

  constructor(
    private readonly processMetricsRepository: ProcessMetricsRepository,
  ) {}

  async sample(): Promise<void> {
    const now = Date.now();
    const cpu = process.cpuUsage(this.lastCpu);
    const elapsedUs = (now - this.lastAt) * 1000;
    const memory = process.memoryUsage();

    this.lastCpu = process.cpuUsage();
    this.lastAt = now;

    await this.processMetricsRepository.save({
      at: new Date(now),
      cpuPct: round2(((cpu.user + cpu.system) / elapsedUs) * 100),
      rssMb: round2(memory.rss / ProcessMetricsProvider.MB),
      heapUsedMb: round2(memory.heapUsed / ProcessMetricsProvider.MB),
    });
  }

  async findAfter(since: Date): Promise<ProcessSample[]> {
    return await this.processMetricsRepository.findAfter(since);
  }
}
