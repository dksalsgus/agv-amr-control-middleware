import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

/** 전역 rev. 엔티티가 바뀔 때마다 1 올린다. 재시작하면 rev가 이어지지 않으므로 epoch로 구분한다. */
@Injectable()
export class RevisionRepository {
  private readonly epoch = randomUUID();
  private rev = 0;

  async findEpoch(): Promise<string> {
    return this.epoch;
  }

  async current(): Promise<number> {
    return this.rev;
  }

  async next(): Promise<number> {
    this.rev += 1;
    return this.rev;
  }
}
