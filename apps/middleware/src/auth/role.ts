/** 뒤로 갈수록 권한이 넓다. ADMIN은 OPERATOR가 할 수 있는 일을 모두 한다. */
export const ROLE_CODES = ["VIEWER", "OPERATOR", "ADMIN"] as const;
export type RoleCode = (typeof ROLE_CODES)[number];
