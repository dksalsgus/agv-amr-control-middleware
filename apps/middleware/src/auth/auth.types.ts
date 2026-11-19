import { RoleCode } from "./role";

/** 토큰에 담는 사용자. sub는 users.id */
export type AuthUser = {
  sub: string;
  username: string;
  roles: RoleCode[];
};
