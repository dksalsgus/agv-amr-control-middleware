import { Injectable } from "@nestjs/common";
import { LinkQualitySample } from "./link-quality";

/** 연결별 최근 품질 표본. 구간을 넘긴 표본은 넣을 때 지운다. */
@Injectable()
export class LinkQualityRepository {
  private readonly samples = new Map<string, LinkQualitySample[]>();

  async add(
    connectionId: string,
    sample: LinkQualitySample,
    windowMs: number,
  ): Promise<void> {
    const oldest = sample.at.getTime() - windowMs;
    const kept = (this.samples.get(connectionId) ?? []).filter(
      (item) => item.at.getTime() >= oldest,
    );
    kept.push(sample);
    this.samples.set(connectionId, kept);
  }

  async findSince(
    connectionId: string,
    since: Date,
  ): Promise<LinkQualitySample[]> {
    return (this.samples.get(connectionId) ?? []).filter(
      (item) => item.at.getTime() >= since.getTime(),
    );
  }
}
