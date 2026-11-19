import { Injectable } from "@nestjs/common";

/** 전역 rev. 엔티티가 바뀔 때마다 1 올린다. */
@Injectable()
export class RevisionRepository {
  private rev = 0;

  async current(): Promise<number> {
    return this.rev;
  }

  async next(): Promise<number> {
    this.rev += 1;
    return this.rev;
  }
}
