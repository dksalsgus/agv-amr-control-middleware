import { Injectable } from "@nestjs/common";
import { LinkQualityRepository } from "../../state/link-quality.repository";
import { LinkStateRepository } from "../../state/link-state.repository";
import { SeqWindowCounts } from "../../state/seq-window";
import { SeqWindowRepository } from "../../state/seq-window.repository";
import { LinkLoss } from "./connection-stats.types";

/** 관제 화면용 연결별 최근 구간 건수와 유실 표본 */
@Injectable()
export class ConnectionStatsProvider {
  constructor(
    private readonly seqWindowRepository: SeqWindowRepository,
    private readonly linkQualityRepository: LinkQualityRepository,
    private readonly linkStateRepository: LinkStateRepository,
  ) {}

  /** 수집 중인(켜진) 연결 id */
  async findConnectionIds(): Promise<string[]> {
    const entries = await this.linkStateRepository.findAll();
    return entries.map((entry) => entry.connectionId);
  }

  async sumSeqSince(
    connectionId: string,
    since: Date,
  ): Promise<SeqWindowCounts> {
    return await this.seqWindowRepository.sumSince(connectionId, since);
  }

  /** LINK_LOSS 알람과 같은 표본(받아야 할 건수와 잃은 건수)을 더한다. */
  async sumLossSince(connectionId: string, since: Date): Promise<LinkLoss> {
    const samples = await this.linkQualityRepository.findSince(
      connectionId,
      since,
    );
    return samples.reduce<LinkLoss>(
      (sum, sample) => ({
        expected: sum.expected + sample.expected,
        lost: sum.lost + sample.lost,
      }),
      { expected: 0, lost: 0 },
    );
  }
}
