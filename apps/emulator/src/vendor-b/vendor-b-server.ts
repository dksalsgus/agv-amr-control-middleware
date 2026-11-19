import { createServer, IncomingMessage, Server, ServerResponse } from "http";
import { RobotFleet } from "../simulation/robot-fleet";
import { VendorBPayloadBuilder } from "./vendor-b-payload";

/** 제조사 B REST 서버: GET /api/vehicles(전체), /api/vehicles/{id}(한 대) */
export class VendorBServer {
  private static readonly VEHICLE_PATH = /^\/api\/vehicles\/([^/]+)$/;

  private readonly payloadBuilder = new VendorBPayloadBuilder();
  private server: Server | null = null;

  constructor(
    private readonly port: number,
    private readonly fleet: RobotFleet,
  ) {}

  listen() {
    this.server = createServer((request, response) =>
      this.handle(request, response),
    );
    this.server.listen(this.port, () =>
      console.log(`[vendor-b] listening :${this.port}`),
    );
  }

  private handle(request: IncomingMessage, response: ServerResponse) {
    const url = request.url ?? "";

    if (request.method !== "GET") {
      this.send(response, 405, { message: "method not allowed" });
      return;
    }

    if (url === "/api/vehicles") {
      this.send(response, 200, { vehicles: this.buildAll() });
      return;
    }

    const match = VendorBServer.VEHICLE_PATH.exec(url);
    if (match) {
      this.sendOne(response, match[1]);
      return;
    }

    this.send(response, 404, { message: "not found" });
  }

  private sendOne(response: ServerResponse, vehicleId: string) {
    const robot = this.fleet.robots.find((item) => item.serial === vehicleId);
    if (!robot) {
      this.send(response, 404, { message: `unknown vehicle ${vehicleId}` });
      return;
    }

    this.send(
      response,
      200,
      this.payloadBuilder.build(robot, this.fleet.sampledAt),
    );
  }

  private buildAll() {
    return this.fleet.robots.map((robot) =>
      this.payloadBuilder.build(robot, this.fleet.sampledAt),
    );
  }

  private send(response: ServerResponse, status: number, body: unknown) {
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(JSON.stringify(body));
  }
}
