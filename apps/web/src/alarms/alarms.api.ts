import { apiClient } from "../api/api-client";

export class AlarmsApi {
  /** 이미 풀린 알람이면 404. 확인 결과는 WebSocket delta로 화면에 돌아온다. */
  async ack(id: string): Promise<void> {
    await apiClient.post<unknown>(`/alarms/${encodeURIComponent(id)}/ack`);
  }
}

export const alarmsApi = new AlarmsApi();
