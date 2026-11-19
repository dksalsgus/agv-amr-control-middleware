import { Injectable } from "@nestjs/common";
import {
  GetVendorsItemDto,
  GetVendorsResponseDto,
} from "./dto/get-vendors.response.dto";
import { VendorsProvider } from "./vendors.provider";

@Injectable()
export class VendorsService {
  constructor(private readonly vendorsProvider: VendorsProvider) {}

  async getVendors(): Promise<GetVendorsResponseDto> {
    const rows = await this.vendorsProvider.findAll();

    const vendors: GetVendorsItemDto[] = [];
    for (const row of rows) {
      vendors.push({ id: row.id, code: row.code, name: row.name });
    }

    return { vendors };
  }
}
