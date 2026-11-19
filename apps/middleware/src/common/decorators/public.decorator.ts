import { SetMetadata } from "@nestjs/common";
import { IS_PUBLIC_KEY } from "../../auth/auth.constants";

/** 토큰 없이 부를 수 있는 API */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
