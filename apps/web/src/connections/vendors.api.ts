import { apiClient } from "../api/api-client";
import { VendorItem } from "./connections.types";

export class VendorsApi {
  async findAll(): Promise<VendorItem[]> {
    const response = await apiClient.get<{ vendors: VendorItem[] }>("/vendors");
    return response.vendors;
  }
}

export const vendorsApi = new VendorsApi();
