import { Injectable } from "@nestjs/common";
import { LinkState } from "./link-state";

/** 연결별 상태(메모리) */
@Injectable()
export class LinkStateRepository {
  private readonly states = new Map<string, LinkState>();

  async findById(connectionId: string): Promise<LinkState | undefined> {
    return this.states.get(connectionId);
  }

  async save(connectionId: string, state: LinkState): Promise<void> {
    this.states.set(connectionId, state);
  }
}
