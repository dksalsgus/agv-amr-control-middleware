import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import {
  ModbusConfigDto,
  MqttConfigDto,
  RestConfigDto,
} from "./connection-config.dto";

const errorFields = async <T extends object>(
  dto: new () => T,
  plain: object,
): Promise<string[]> => {
  const errors = await validate(plainToInstance(dto, plain));
  return errors.map((error) => error.property);
};

describe("연결 config 검증", () => {
  it("올바른 REST config는 통과한다", async () => {
    const fields = await errorFields(RestConfigDto, {
      baseUrl: "http://emulator:8081",
      pollIntervalMs: 1000,
      mode: "bulk",
      timeoutMs: 800,
    });

    expect(fields).toEqual([]);
  });

  it("프로토콜 없는 baseUrl, 너무 짧은 주기, 모르는 mode는 막는다", async () => {
    const fields = await errorFields(RestConfigDto, {
      baseUrl: "emulator",
      pollIntervalMs: 10,
      mode: "stream",
      timeoutMs: 800,
    });

    expect(fields).toEqual(["baseUrl", "pollIntervalMs", "mode"]);
  });

  it("MQTT는 mqtt:// 주소와 0~2 QoS만 받는다", async () => {
    const fields = await errorFields(MqttConfigDto, {
      url: "http://broker",
      topicPattern: "a/+/state",
      qos: 3,
    });

    expect(fields).toEqual(["url", "qos"]);
  });

  it("Modbus 블록 크기는 한 요청 상한(125)을 넘지 못한다", async () => {
    const fields = await errorFields(ModbusConfigDto, {
      host: "emulator",
      port: 5020,
      unitId: 1,
      pollIntervalMs: 1000,
      baseAddress: 100,
      blockSize: 200,
    });

    expect(fields).toEqual(["blockSize"]);
  });
});
