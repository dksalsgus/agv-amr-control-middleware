import { apiClient } from "../api/api-client";

export class PlcPointsApi {
  /** 인터록 제어: PLC 점 값을 쓴다. 실제 값은 다음 폴링 뒤 WebSocket delta로 돌아온다. */
  async writeValue(id: string, value: boolean): Promise<void> {
    await apiClient.put<unknown>(
      `/plc-points/${encodeURIComponent(id)}/value`,
      { value },
    );
  }
}

export const plcPointsApi = new PlcPointsApi();
