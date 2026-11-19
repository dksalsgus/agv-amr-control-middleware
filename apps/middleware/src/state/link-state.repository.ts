import { Injectable } from "@nestjs/common";
import { LinkState, LinkStateEntry } from "./link-state";

@Injectable()
export class LinkStateRepository {
  private readonly states = new Map<string, LinkState>();

  async findById(connectionId: string): Promise<LinkState | undefined> {
    return this.states.get(connectionId);
  }

  async findAll(): Promise<LinkStateEntry[]> {
    return Array.from(this.states.entries()).map(([connectionId, state]) => ({
      connectionId,
      state,
    }));
  }

  async save(connectionId: string, state: LinkState): Promise<void> {
    this.states.set(connectionId, state);
  }

  async remove(connectionId: string): Promise<void> {
    this.states.delete(connectionId);
  }
}
