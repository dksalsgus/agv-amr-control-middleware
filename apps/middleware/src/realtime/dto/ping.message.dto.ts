import { IsNumber } from "class-validator";

/** t는 보낸 쪽 시각(ms). pong은 같은 t를 돌려준다. */
export class PingMessageDto {
  @IsNumber()
  t!: number;
}
