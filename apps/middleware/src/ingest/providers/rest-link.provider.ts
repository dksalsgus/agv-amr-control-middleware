import { Injectable } from "@nestjs/common";
import { RestClientRepository } from "../repositories/rest-client.repository";
import { RestRawMessage } from "../repositories/rest-client.types";
import { RestConnectionConfig } from "./rest-link.types";

/** REST 장비를 한 번 폴링한다. bulk는 전체 목록 1회, each는 차량마다 1회. */
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
    return await Promise.all(requests);
  }
}
