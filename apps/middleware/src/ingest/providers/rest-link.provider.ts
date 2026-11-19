import { Injectable } from "@nestjs/common";
import {
  RestClientRepository,
  RestRawMessage,
} from "../repositories/rest-client.repository";

/** vendors_connections.config의 REST 모양(설계 문서 5장) */
export type RestConnectionConfig = {
  baseUrl: string;
  pollIntervalMs: number;
  mode: "bulk" | "each";
  timeoutMs: number;
};

/**
 * REST 장비를 한 번 폴링한다. bulk는 전체 목록 한 번, each는 차량마다 한 번 호출한다.
 */
@Injectable()
export class RestLinkProvider {
  constructor(private readonly restClientRepository: RestClientRepository) {}

  async poll(
    config: RestConnectionConfig,
    externalIds: string[],
  ): Promise<RestRawMessage[]> {
    if (config.mode === "bulk") {
      const url = `${config.baseUrl}/api/vehicles`;
      return [await this.restClientRepository.get(url, config.timeoutMs)];
    }

    const requests = externalIds.map((externalId) => {
      const url = `${config.baseUrl}/api/vehicles/${externalId}`;
      return this.restClientRepository.get(url, config.timeoutMs);
    });
    return Promise.all(requests);
  }
}
