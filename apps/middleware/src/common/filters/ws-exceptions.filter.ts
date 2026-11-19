import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { WebSocket } from "ws";

/** ws 어댑터는 Nest 기본 필터의 emit이 화면에 가지 않아 직접 error 메시지로 보낸다. */
@Catch()
export class WsExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<WebSocket>();
    const message = this.getMessage(exception);
    client.send(JSON.stringify({ event: "error", data: { message } }));
  }

  private getMessage(exception: unknown): string | string[] {
    if (exception instanceof WsException) {
      return exception.message;
    }
    if (!(exception instanceof HttpException)) {
      return "Internal server error";
    }

    const response = exception.getResponse();
    if (typeof response === "string") {
      return response;
    }

    const message = (response as { message?: string | string[] }).message;
    return message ?? exception.message;
  }
}
