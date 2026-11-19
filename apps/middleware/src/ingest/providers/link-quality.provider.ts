import { Inject, Injectable } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { linkQualityConfig } from "../../config/link-quality.config";
import { LinkQualityRepository } from "../../state/link-quality.repository";
import { LinkStateRepository } from "../../state/link-state.repository";

/**
 * 연결 품질 표본을 남긴다.
 * 폴링 연결은 요청 하나가 표본 하나(실패면 유실), MQTT는 seq 빈 번호를 유실로 센다.
 * 폴링 연결에 seq 빈 번호를 쓰지 않는 것은 폴링 주기가 장비 갱신 주기보다 길면 유실이 없어도 빈 번호가 생기기 때문이다.
 */
@Injectable()
export class LinkQualityProvider {
  constructor(
    @Inject(linkQualityConfig.KEY)
    private readonly config: ConfigType<typeof linkQualityConfig>,
    private readonly linkQualityRepository: LinkQualityRepository,
    private readonly linkStateRepository: LinkStateRepository,
  ) {}

  async recordPoll(connectionId: string, succeeded: boolean): Promise<void> {
    await this.linkQualityRepository.add(
      connectionId,
      { at: new Date(), expected: 1, lost: succeeded ? 0 : 1 },
      this.config.windowMs,
    );
  }

  /**
   * 직전 수신이 연결이 UP이 되기 전이면(재시작 뒤 이력에서 되살린 상태, 끊김 뒤 첫 수신) 빈 번호를 유실로 세지 않는다.
   * 그 빈 번호는 끊겨 있던 동안의 것이라 지금의 통신 품질이 아니다.
   */
  async recordPush(
    connectionId: string,
    missed: number,
    previousReceivedTs: Date | null,
  ): Promise<void> {
    const link = await this.linkStateRepository.findById(connectionId);
    const upSince = link?.status === "UP" ? link.changedAt : null;
    const isGapWhileUp =
      previousReceivedTs !== null &&
      upSince !== null &&
      previousReceivedTs.getTime() >= upSince.getTime();
    const lost = isGapWhileUp ? missed : 0;
    await this.linkQualityRepository.add(
      connectionId,
      { at: new Date(), expected: 1 + lost, lost },
      this.config.windowMs,
    );
  }
}
