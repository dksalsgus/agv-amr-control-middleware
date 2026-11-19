/** vendors_connections.config의 REST 모양 */
export type RestConnectionConfig = {
  baseUrl: string;
  pollIntervalMs: number;
  mode: "bulk" | "each";
  timeoutMs: number;
};
