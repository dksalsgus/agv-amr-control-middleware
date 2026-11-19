import { Injectable } from "@nestjs/common";
import { VendorRow, VendorsRepository } from "../settings/vendors.repository";

@Injectable()
export class VendorsProvider {
  constructor(private readonly vendorsRepository: VendorsRepository) {}

  async findAll(): Promise<VendorRow[]> {
    return await this.vendorsRepository.findAll();
  }
}
