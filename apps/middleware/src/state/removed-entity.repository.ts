import { Injectable } from "@nestjs/common";
import { EntityKind, RemovedEntity } from "./removed-entity";

/** 지워진 엔티티 기록(메모리). 다시 등록되면 지운다. */
@Injectable()
export class RemovedEntityRepository {
  private readonly entities = new Map<string, RemovedEntity>();

  async save(entity: RemovedEntity): Promise<void> {
    this.entities.set(this.toKey(entity.kind, entity.id), entity);
  }

  async remove(kind: EntityKind, id: string): Promise<void> {
    this.entities.delete(this.toKey(kind, id));
  }

  async findAfter(rev: number): Promise<RemovedEntity[]> {
    return Array.from(this.entities.values()).filter(
      (entity) => entity.rev > rev,
    );
  }

  private toKey(kind: EntityKind, id: string): string {
    return `${kind}:${id}`;
  }
}
