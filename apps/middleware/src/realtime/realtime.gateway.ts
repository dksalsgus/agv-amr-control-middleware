import { Inject, UseFilters, UsePipes, ValidationPipe } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { Interval } from "@nestjs/schedule";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
  WsResponse,
} from "@nestjs/websockets";
import { WebSocket } from "ws";
import { AuthService } from "../auth/auth.service";
import { WsExceptionsFilter } from "../common/filters/ws-exceptions.filter";
import {
  REALTIME_DELTA_INTERVAL_MS,
  REALTIME_PING_INTERVAL_MS,
  realtimeConfig,
} from "../config/realtime.config";
import { DeltaMessageDto } from "./dto/delta.message.dto";
import { HelloMessageDto } from "./dto/hello.message.dto";
import { PingMessageDto } from "./dto/ping.message.dto";
import { ResyncMessageDto } from "./dto/resync.message.dto";
import { RealtimeService } from "./realtime.service";
import { RealtimeReply } from "./realtime.types";

/** 화면 실시간 채널. 메시지는 { event, data } JSON */
@WebSocketGateway({ path: "/ws" })
@UsePipes(new ValidationPipe({ whitelist: true }))
@UseFilters(new WsExceptionsFilter())
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  /** 토큰을 확인한 hello를 보낸 화면과 그 화면에 마지막으로 보낸 rev */
  private readonly sentRevs = new Map<WebSocket, number>();
  /** 화면별 마지막 pong 시각(ms) */
  private readonly lastPongAts = new Map<WebSocket, number>();
  private pushing = false;

  constructor(
    @Inject(realtimeConfig.KEY)
    private readonly config: ConfigType<typeof realtimeConfig>,
    private readonly realtimeService: RealtimeService,
    private readonly authService: AuthService,
  ) {}

  handleConnection(client: WebSocket): void {
    this.lastPongAts.set(client, Date.now());
  }

  handleDisconnect(client: WebSocket): void {
    this.sentRevs.delete(client);
    this.lastPongAts.delete(client);
  }

  @SubscribeMessage("hello")
  async hello(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() message: HelloMessageDto,
  ): Promise<void> {
    await this.authService.authenticate(message.token);
    this.reply(client, await this.realtimeService.hello(message));
  }

  @SubscribeMessage("resync")
  async resync(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() message: ResyncMessageDto,
  ): Promise<void> {
    if (!this.sentRevs.has(client)) {
      throw new WsException("hello를 먼저 보내야 합니다.");
    }

    this.reply(client, await this.realtimeService.resync(message.lastRev));
  }

  @SubscribeMessage("ping")
  async ping(
    @MessageBody() message: PingMessageDto,
  ): Promise<WsResponse<PingMessageDto>> {
    return { event: "pong", data: { t: message.t } };
  }

  @SubscribeMessage("pong")
  async pong(@ConnectedSocket() client: WebSocket): Promise<void> {
    this.lastPongAts.set(client, Date.now());
  }

  /** 답을 보낸 뒤에 rev를 기록해야 다음 delta가 답보다 먼저 가지 않는다. */
  private reply(client: WebSocket, reply: RealtimeReply): void {
    client.send(JSON.stringify(reply));
    this.sentRevs.set(client, reply.data.rev);
  }

  /** 같은 rev에서 출발하는 화면들은 delta 하나를 함께 쓴다. */
  @Interval(REALTIME_DELTA_INTERVAL_MS)
  async pushDeltas(): Promise<void> {
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
        const isClientReady =
          client.readyState === WebSocket.OPEN &&
          client.bufferedAmount <= this.config.maxBufferedBytes;
        if (!delta || !isClientReady) {
          continue;
        }

        client.send(JSON.stringify({ event: "delta", data: delta }));
        this.sentRevs.set(client, delta.rev);
      }
    } finally {
      this.pushing = false;
    }
  }

  /** pong이 maxMissedPongs번 연속 없으면 끊는다. close가 오면 handleDisconnect가 정리한다. */
  @Interval(REALTIME_PING_INTERVAL_MS)
  pingClients(): void {
    const now = Date.now();
    const timeoutMs = REALTIME_PING_INTERVAL_MS * this.config.maxMissedPongs;

    for (const [client, lastPongAt] of this.lastPongAts) {
      if (now - lastPongAt > timeoutMs) {
        client.terminate();
        continue;
      }

      client.send(JSON.stringify({ event: "ping", data: { t: now } }));
    }
  }
}
