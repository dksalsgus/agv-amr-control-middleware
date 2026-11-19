import { Injectable } from "@nestjs/common";
import {
  MqttClientRepository,
  MqttRawMessage,
} from "../repositories/mqtt-client.repository";

/** vendors_connections.config의 MQTT 모양(설계 문서 5장) */
export type MqttConnectionConfig = {
  url: string;
  topicPattern: string;
  qos: 0 | 1 | 2;
  username: string | null;
  password: string | null;
};

/**
 * MQTT 연결 설정을 클라이언트 옵션으로 바꿔 수신 핸들러를 등록한다.
 */
@Injectable()
export class MqttLinkProvider {
  constructor(private readonly mqttClientRepository: MqttClientRepository) {}

  start(
    connectionId: string,
    config: MqttConnectionConfig,
    onMessage: (message: MqttRawMessage) => void,
  ) {
    this.mqttClientRepository.subscribe(
      connectionId,
      {
        url: config.url,
        topic: config.topicPattern,
        qos: config.qos,
        username: config.username,
        password: config.password,
      },
      onMessage,
    );
  }
}
