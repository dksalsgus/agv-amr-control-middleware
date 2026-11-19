import { Injectable } from "@nestjs/common";
import { ProcessSample } from "./process-metrics";

/** 미들웨어 프로세스의 CPU·메모리 표본(메모리). 최근 것만 남긴다 */
@Injectable()
export class ProcessMetricsRepository {
  /** 5초 간격으로 1시간치 */
  private static readonly MAX_SAMPLES = 720;

  private readonly samples: ProcessSample[] = [];

  async save(sample: ProcessSample): Promise<void> {
    this.samples.push(sample);
    if (this.samples.length > ProcessMetricsRepository.MAX_SAMPLES) {
      this.samples.shift();
    }
  }

  async findAfter(since: Date): Promise<ProcessSample[]> {
    return this.samples.filter((sample) => sample.at >= since);
  }
}
