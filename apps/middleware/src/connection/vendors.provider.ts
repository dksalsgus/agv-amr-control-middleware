import { Injectable } from "@nestjs/common";
import { VendorsRepository } from "../settings/vendors.repository";
import { VendorRow } from "../settings/vendors.types";

@Injectable()
export class VendorsProvider {
  constructor(private readonly vendorsRepository: VendorsRepository) {}

  async findAll(): Promise<VendorRow[]> {
    return await this.vendorsRepository.findAll();
  }
}
