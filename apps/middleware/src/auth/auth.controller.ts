import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { Public } from "../common/decorators/public.decorator";
import { ApiResult } from "../common/dto/api-result";
import { AuthService } from "./auth.service";
import { PostLoginRequestDto } from "./dto/post-login.request.dto";
import { PostLoginResponseDto } from "./dto/post-login.response.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(200)
  async postLogin(
    @Body() request: PostLoginRequestDto,
  ): Promise<ApiResult<PostLoginResponseDto>> {
    const response = await this.authService.login(request);
    return ApiResult.ofSuccess(response);
  }
}
