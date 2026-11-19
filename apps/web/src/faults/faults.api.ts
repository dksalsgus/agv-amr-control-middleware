import { ApiRequestError } from "../api/api-request.error";
import { EMULATOR_BASE_PATH } from "./faults.constants";
import { DeviceFaults, FaultConfig, FaultGroup } from "./faults.types";

/** 에뮬레이터의 장애 주입 API. 미들웨어를 거치지 않고 에뮬레이터를 바로 부른다. */
export class FaultsApi {
  async findAll(): Promise<Record<FaultGroup, FaultConfig>> {
    return await this.request<Record<FaultGroup, FaultConfig>>(
      "GET",
      "/faults",
      undefined,
    );
  }

  async update(group: FaultGroup, config: FaultConfig): Promise<FaultConfig> {
    return await this.request<FaultConfig>("PUT", `/faults/${group}`, config);
  }

  async findDevices(): Promise<DeviceFaults> {
    return await this.request<DeviceFaults>(
      "GET",
      "/faults/devices",
      undefined,
    );
  }

  async setPlcPoint(pointNo: number, on: boolean): Promise<DeviceFaults> {
    return await this.request<DeviceFaults>(
      "PUT",
      `/faults/plc-points/${pointNo}`,
      { on },
    );
  }

  async setRobotError(serial: string, error: boolean): Promise<DeviceFaults> {
    return await this.request<DeviceFaults>("PUT", `/faults/robots/${serial}`, {
      error,
    });
  }

  private async request<T>(
    method: "GET" | "PUT",
    path: string,
    body: object | undefined,
  ): Promise<T> {
    const response = await fetch(`${EMULATOR_BASE_PATH}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = (await response.json().catch(() => null)) as unknown;
    if (!response.ok) {
      throw new ApiRequestError(
        response.status,
        this.toMessages(data, response),
      );
    }
    return data as T;
  }

  private toMessages(data: unknown, response: Response): string[] {
    const message = (data as { message?: string | string[] } | null)?.message;
    if (message === undefined) {
      return [response.statusText];
    }
    return Array.isArray(message) ? message : [message];
  }
}

export const faultsApi = new FaultsApi();
