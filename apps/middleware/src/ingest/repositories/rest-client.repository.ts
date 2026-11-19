import { Injectable } from "@nestjs/common";
import { RestRawMessage } from "./rest-client.types";

@Injectable()
export class RestClientRepository {
  async get(url: string, timeoutMs: number): Promise<RestRawMessage> {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`GET ${url} → ${response.status}`);
    }

    const body: unknown = await response.json();
    return { body };
  }
}
