import { Inject, UseFilters, UsePipes, ValidationPipe } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { SchedulerRegistry } from "@nestjs/schedule";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from "@nestjs/websockets";
import { WebSocket } from "ws";
import { WsExceptionsFilter } from "../common/filters/ws-exceptions.filter";
import { realtimeConfig } from "../config/realtime.config";
import { DeltaMessageDto } from "./dto/delta.message.dto";
import { HelloMessageDto } from "./dto/hello.message.dto";
import { ResyncMessageDto } from "./dto/resync.message.dto";
import { RealtimeService } from "./realtime.service";
import { RealtimeReply } from "./realtime.types";

/** 화면 실시간 채널. 메시지는 { event, data } JSON */
@WebSocketGateway({ path: "/ws" })
@UsePipes(new ValidationPipe({ whitelist: true }))
@UseFilters(new WsExceptionsFilter())
export class RealtimeGateway implements OnGatewayInit, OnGatewayDisconnect {
  private static readonly DELTA_JOB = "realtime-delta";

  /** hello를 보낸 화면과 그 화면에 마지막으로 보낸 rev */
  private readonly sentRevs = new Map<WebSocket, number>();
  private pushing = false;

  constructor(
    @Inject(realtimeConfig.KEY)
    private readonly config: ConfigType<typeof realtimeConfig>,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly realtimeService: RealtimeService,
  ) {}

  afterInit(): void {
    const interval = setInterval(
      () => void this.pushDeltas(),
      this.config.deltaIntervalMs,
    );
    this.schedulerRegistry.addInterval(RealtimeGateway.DELTA_JOB, interval);
  }

  handleDisconnect(client: WebSocket): void {
    this.sentRevs.delete(client);
  }

  @SubscribeMessage("hello")
  async hello(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() message: HelloMessageDto,
  ): Promise<void> {
    this.reply(client, await this.realtimeService.hello(message));
  }

  @SubscribeMessage("resync")
  async resync(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() message: ResyncMessageDto,
  ): Promise<void> {
    this.reply(client, await this.realtimeService.resync(message.lastRev));
  }

  /** 답을 보낸 뒤에 rev를 기록해야 다음 delta가 답보다 먼저 가지 않는다. */
  private reply(client: WebSocket, reply: RealtimeReply): void {
    client.send(JSON.stringify(reply));
    this.sentRevs.set(client, reply.data.rev);
  }

  /** 같은 rev에서 출발하는 화면들은 delta 하나를 함께 쓴다. */
  private async pushDeltas(): Promise<void> {
    if (this.pushing) {
      return;
    }

    this.pushing = true;
    try {
      const deltas = new Map<number, DeltaMessageDto | null>();
      for (const [client, sentRev] of this.sentRevs) {
        if (!deltas.has(sentRev)) {
          deltas.set(sentRev, await this.realtimeService.getDelta(sentRev));
        }

        const delta = deltas.get(sentRev);
        if (!delta || client.readyState !== WebSocket.OPEN) {
          continue;
        }

        client.send(JSON.stringify({ event: "delta", data: delta }));
        this.sentRevs.set(client, delta.rev);
      }
    } finally {
      this.pushing = false;
    }
  }
}
