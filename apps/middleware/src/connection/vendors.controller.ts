import { Controller, Get } from "@nestjs/common";
import { ApiResult } from "../common/dto/api-result";
import { GetVendorsResponseDto } from "./dto/get-vendors.response.dto";
import { VendorsService } from "./vendors.service";

@Controller("vendors")
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  async getVendors(): Promise<ApiResult<GetVendorsResponseDto>> {
    const response = await this.vendorsService.getVendors();
    return ApiResult.ofSuccess(response);
  }
}
