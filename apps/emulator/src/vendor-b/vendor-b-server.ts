import { createServer, IncomingMessage, ServerResponse } from "http";
import { rollPct } from "../common/utils/chance.util";
import { FaultSettings } from "../faults/fault-settings";
import { PolledFaultPicker } from "../faults/polled-fault-picker";
import { RobotFleet } from "../simulation/robot-fleet";
import { VendorBPayloadBuilder } from "./vendor-b-payload";
import { VendorBVehicle } from "./vendor-b-payload.types";
import { Logger } from "../common/logger/logger";

/** 제조사 B REST 서버: GET /api/vehicles(전체), /api/vehicles/{id}(한 대) */
export class VendorBServer {
  private static readonly VEHICLE_PATH = /^\/api\/vehicles\/([^/]+)$/;

  private readonly logger = new Logger("vendor-b");
  private readonly payloadBuilder = new VendorBPayloadBuilder();
  private readonly picker = new PolledFaultPicker<VendorBVehicle[]>();

  constructor(
    private readonly port: number,
    private readonly fleet: RobotFleet,
    private readonly faults: FaultSettings,
  ) {}

  listen() {
    const server = createServer((request, response) =>
      this.handle(request, response),
    );
    server.listen(this.port, () => this.logger.log(`listening :${this.port}`));
  }

  /** 시뮬레이션이 한 걸음 갈 때마다 응답할 차량 목록을 쌓아 둔다. */
  refresh() {
    const sampledAt = this.fleet.sampledAt;
    this.picker.push(
      sampledAt,
      this.fleet.robots.map((robot) =>
        this.payloadBuilder.build(robot, sampledAt),
      ),
    );
  }

  /** 끊김은 응답 없이 소켓을 닫고, 유실은 503으로 답한다. */
  private handle(request: IncomingMessage, response: ServerResponse) {
    const fault = this.faults.get("B");
    if (fault.disconnected) {
      request.socket.destroy();
      return;
    }
    if (rollPct(fault.lossPct)) {
      this.send(response, 503, { message: "unavailable" });
      return;
    }

    if (request.method !== "GET") {
      this.send(response, 405, { message: "method not allowed" });
      return;
    }

    const vehicles = this.picker.pick(fault, Date.now()) ?? [];
    const url = request.url ?? "";
    if (url === "/api/vehicles") {
      this.send(response, 200, { vehicles });
      return;
    }

    const match = VendorBServer.VEHICLE_PATH.exec(url);
    if (match) {
      this.sendOne(response, vehicles, match[1]);
      return;
    }

    this.send(response, 404, { message: "not found" });
  }

  private sendOne(
    response: ServerResponse,
    vehicles: VendorBVehicle[],
    vehicleId: string,
  ) {
    const vehicle = vehicles.find((item) => item.vehicleId === vehicleId);
    if (!vehicle) {
      this.send(response, 404, { message: `unknown vehicle ${vehicleId}` });
      return;
    }

    this.send(response, 200, vehicle);
  }

  private send(response: ServerResponse, status: number, body: unknown) {
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(JSON.stringify(body));
  }
}
