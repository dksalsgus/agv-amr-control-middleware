import { Injectable } from "@nestjs/common";
import { SeqWindowBucket, SeqWindowCounts } from "./seq-window";

/** 연결별 최근 seq 판정 건수를 1초 단위로 모은다. 구간을 넘긴 칸은 넣을 때 지운다. */
@Injectable()
export class SeqWindowRepository {
  private readonly buckets = new Map<string, SeqWindowBucket[]>();

  async add(
    connectionId: string,
    at: Date,
    counts: SeqWindowCounts,
    windowMs: number,
  ): Promise<void> {
    const second = Math.floor(at.getTime() / 1000);
    const oldest = Math.floor((at.getTime() - windowMs) / 1000);
    const kept = (this.buckets.get(connectionId) ?? []).filter(
      (bucket) => bucket.second >= oldest,
    );
    const last = kept.at(-1);
    const bucket =
      last?.second === second
        ? last
        : { second, received: 0, duplicates: 0, outOfOrder: 0, missed: 0 };
    if (bucket !== last) {
      kept.push(bucket);
    }

    bucket.received += counts.received;
    bucket.duplicates += counts.duplicates;
    bucket.outOfOrder += counts.outOfOrder;
    bucket.missed += counts.missed;
    this.buckets.set(connectionId, kept);
  }

  /** since 이후 칸을 더한 건수 */
  async sumSince(connectionId: string, since: Date): Promise<SeqWindowCounts> {
    const sinceSecond = Math.floor(since.getTime() / 1000);
    return (this.buckets.get(connectionId) ?? [])
      .filter((bucket) => bucket.second >= sinceSecond)
      .reduce<SeqWindowCounts>(
        (sum, bucket) => ({
          received: sum.received + bucket.received,
          duplicates: sum.duplicates + bucket.duplicates,
          outOfOrder: sum.outOfOrder + bucket.outOfOrder,
          missed: sum.missed + bucket.missed,
        }),
        { received: 0, duplicates: 0, outOfOrder: 0, missed: 0 },
      );
  }
}
