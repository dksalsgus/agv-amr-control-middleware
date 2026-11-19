import { registerAs } from "@nestjs/config";

export const authConfig = registerAs("auth", () => ({
  jwtSecret: process.env.JWT_SECRET ?? "local-dev-secret",
  tokenTtlSeconds: 12 * 60 * 60,
}));
