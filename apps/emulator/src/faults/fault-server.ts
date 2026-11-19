import { createServer, IncomingMessage, ServerResponse } from "http";
import { Logger } from "../common/logger/logger";
import { FaultConfigParser } from "./fault-config.parser";
import { FaultSettings } from "./fault-settings";

/**
 * 장애 주입 API. 관제 웹이 바로 부르므로 CORS를 연다.
 * GET /faults, PUT /faults/{group}: 그룹별 통신 장애
 * GET /faults/devices, PUT /faults/plc-points/{no} { on }, PUT /faults/robots/{serial} { error }: 장비 값 주입
 */
export class FaultServer {
  private static readonly GROUP_PATH = /^\/faults\/([^/]+)$/;
  private static readonly PLC_POINT_PATH = /^\/faults\/plc-points\/([^/]+)$/;
  private static readonly ROBOT_PATH = /^\/faults\/robots\/([^/]+)$/;

  private readonly logger = new Logger("faults");
  private readonly parser = new FaultConfigParser();

  constructor(
    private readonly port: number,
    private readonly settings: FaultSettings,
  ) {}

  listen() {
    const server = createServer((request, response) => {
      void this.handle(request, response);
    });
    server.listen(this.port, () => this.logger.log(`listening :${this.port}`));
  }

  private async handle(request: IncomingMessage, response: ServerResponse) {
    const url = request.url ?? "";

    if (request.method === "OPTIONS") {
      this.send(response, 204, null);
      return;
    }

    if (request.method === "GET" && url === "/faults") {
      this.send(response, 200, this.settings.getAll());
      return;
    }

    if (request.method === "GET" && url === "/faults/devices") {
      this.send(response, 200, this.settings.getDevices());
      return;
    }

    const pointMatch = FaultServer.PLC_POINT_PATH.exec(url);
    if (request.method === "PUT" && pointMatch) {
      await this.putPlcPoint(request, response, pointMatch[1]);
      return;
    }

    const robotMatch = FaultServer.ROBOT_PATH.exec(url);
    if (request.method === "PUT" && robotMatch) {
      await this.putRobotError(request, response, robotMatch[1]);
      return;
    }

    const match = FaultServer.GROUP_PATH.exec(url);
    if (request.method === "PUT" && match) {
      await this.put(request, response, match[1]);
      return;
    }

    this.send(response, 404, { message: "not found" });
  }

  private async put(
    request: IncomingMessage,
    response: ServerResponse,
    groupText: string,
  ) {
    const group = this.parser.parseGroup(groupText);
    if (!group) {
      this.send(response, 404, { message: `unknown group ${groupText}` });
      return;
    }

    const body = await this.readJson(request);
    const parsed = this.parser.parse(body);
    if ("errors" in parsed) {
      this.send(response, 400, { message: parsed.errors });
      return;
    }

    this.settings.set(group, parsed.config);
    this.logger.log(`${group} ${JSON.stringify(parsed.config)}`);
    this.send(response, 200, parsed.config);
  }

  private async putPlcPoint(
    request: IncomingMessage,
    response: ServerResponse,
    pointText: string,
  ) {
    const pointNo = this.parser.parsePointNo(pointText);
    if (pointNo === null) {
      this.send(response, 404, { message: `unknown point ${pointText}` });
      return;
    }

    const on = this.parser.parseSwitch(await this.readJson(request), "on");
    if (on === null) {
      this.send(response, 400, { message: ["on은 true 또는 false"] });
      return;
    }

    this.settings.setPlcPoint(pointNo, on);
    this.logger.log(`PLC 점 ${pointNo} ${on ? "ON" : "OFF"}`);
    this.send(response, 200, this.settings.getDevices());
  }

  private async putRobotError(
    request: IncomingMessage,
    response: ServerResponse,
    serialText: string,
  ) {
    const serial = this.parser.parseSerial(serialText);
    if (serial === null) {
      this.send(response, 404, { message: `unknown robot ${serialText}` });
      return;
    }

    const error = this.parser.parseSwitch(
      await this.readJson(request),
      "error",
    );
    if (error === null) {
      this.send(response, 400, { message: ["error는 true 또는 false"] });
      return;
    }

    this.settings.setRobotError(serial, error);
    this.logger.log(`로봇 ${serial} 오류 ${error ? "넣음" : "뺌"}`);
    this.send(response, 200, this.settings.getDevices());
  }

  private async readJson(request: IncomingMessage): Promise<unknown> {
    const chunks: Buffer[] = [];
    for await (const chunk of request) {
      chunks.push(chunk as Buffer);
    }

    try {
      return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
    } catch {
      return null;
    }
  }

  private send(response: ServerResponse, status: number, body: unknown) {
    response.writeHead(status, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    response.end(body === null ? undefined : JSON.stringify(body));
  }
}
