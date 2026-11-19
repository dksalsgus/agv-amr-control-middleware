import { Injectable } from "@nestjs/common";

/**
 * 전역 리비전(rev) 카운터. 엔티티가 바뀔 때마다 1씩 올린다(설계 문서 6장).
 */
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
