import { Injectable } from "@nestjs/common";
import {
  MqttClientRepository,
  MqttHandlers,
} from "../repositories/mqtt-client.repository";

/** vendors_connections.config의 MQTT 모양 */
export type MqttConnectionConfig = {
  url: string;
  topicPattern: string;
  qos: 0 | 1 | 2;
  username: string | null;
  password: string | null;
};

/** MQTT 연결 설정으로 수신 핸들러를 등록한다. */
@Injectable()
export class MqttLinkProvider {
  constructor(private readonly mqttClientRepository: MqttClientRepository) {}

  async start(
    connectionId: string,
    config: MqttConnectionConfig,
    handlers: MqttHandlers,
  ): Promise<void> {
    await this.mqttClientRepository.subscribe(
      connectionId,
      {
        url: config.url,
        topic: config.topicPattern,
        qos: config.qos,
        username: config.username,
        password: config.password,
      },
      handlers,
    );
  }

  async stop(connectionId: string): Promise<void> {
    await this.mqttClientRepository.unsubscribe(connectionId);
  }
}
