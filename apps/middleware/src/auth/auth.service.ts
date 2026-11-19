import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PostLoginRequestDto } from "./dto/post-login.request.dto";
import { PostLoginResponseDto } from "./dto/post-login.response.dto";
import { AuthTokenProvider } from "./providers/auth-token.provider";
import { AuthUserProvider } from "./providers/auth-user.provider";

@Injectable()
export class AuthService {
  constructor(
    private readonly authUserProvider: AuthUserProvider,
    private readonly authTokenProvider: AuthTokenProvider,
  ) {}

  /** 아이디와 비밀번호 중 무엇이 틀렸는지는 알려 주지 않는다. */
  async login(request: PostLoginRequestDto): Promise<PostLoginResponseDto> {
    const user = await this.authUserProvider.findByCredentials(
      request.username,
      request.password,
    );
    if (!user) {
      throw new UnauthorizedException("아이디 또는 비밀번호가 틀렸습니다.");
    }

    return {
      accessToken: await this.authTokenProvider.sign(user),
      expiresIn: await this.authTokenProvider.getTtlSeconds(),
      username: user.username,
      role: user.role,
    };
  }
}
