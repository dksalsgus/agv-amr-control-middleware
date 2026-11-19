import {
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
} from "@nestjs/websockets";
import { SnapshotMessageDto } from "./dto/snapshot.message.dto";
import { RealtimeService } from "./realtime.service";

/** 화면 실시간 채널. 메시지는 { event, data } JSON */
@WebSocketGateway({ path: "/ws" })
export class RealtimeGateway {
  constructor(private readonly realtimeService: RealtimeService) {}

  @SubscribeMessage("hello")
  async hello(): Promise<WsResponse<SnapshotMessageDto>> {
    const snapshot = await this.realtimeService.getSnapshot();
    return { event: "snapshot", data: snapshot };
  }
}
