import { createServer, IncomingMessage, ServerResponse } from "http";
import { Logger } from "../common/logger/logger";
import { FaultConfigParser } from "./fault-config.parser";
import { FaultSettings } from "./fault-settings";

/** 장애 주입 API: GET /faults, PUT /faults/{group}. 관제 웹이 바로 부르므로 CORS를 연다. */
export class FaultServer {
  private static readonly GROUP_PATH = /^\/faults\/([^/]+)$/;

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
