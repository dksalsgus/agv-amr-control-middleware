import { Injectable } from "@nestjs/common";

export type RestRawMessage = {
  body: unknown;
};

/**
 * REST 장비에 GET 요청을 보낸다. 제한 시간을 넘기면 예외를 던진다.
 */
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
