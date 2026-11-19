import { Injectable } from "@nestjs/common";
import { GetVendorsResponseDto } from "./dto/get-vendors.response.dto";
import { GetVendorsItemDto } from "./dto/get-vendors.item.dto";
import { VendorsProvider } from "./vendors.provider";
import {
  VENDOR_CONNECTION_DEFAULTS,
  VENDOR_PROTOCOLS,
} from "../ingest/providers/connection.constants";

@Injectable()
export class VendorsService {
  constructor(private readonly vendorsProvider: VendorsProvider) {}

  async getVendors(): Promise<GetVendorsResponseDto> {
    const rows = await this.vendorsProvider.findAll();

    const vendors: GetVendorsItemDto[] = [];
    for (const row of rows) {
      vendors.push({
        id: row.id,
        code: row.code,
        name: row.name,
        connectionDefaults: this.toConnectionDefaults(row.code),
      });
    }

    return { vendors };
  }

  /** 지원 프로토콜마다 기본 접속 정보. 기본값이 없는 프로토콜은 빈 객체 */
  private toConnectionDefaults(
    vendorCode: string,
  ): Record<string, Record<string, unknown>> {
    const defaults = VENDOR_CONNECTION_DEFAULTS[vendorCode] ?? {};
    const result: Record<string, Record<string, unknown>> = {};
    for (const protocol of VENDOR_PROTOCOLS[vendorCode] ?? []) {
      result[protocol] = defaults[protocol] ?? {};
    }

    return result;
  }
}
