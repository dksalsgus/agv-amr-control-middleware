import { Injectable } from "@nestjs/common";
import { MqttClientRepository } from "../repositories/mqtt-client.repository";
import { MqttHandlers } from "../repositories/mqtt-client.types";
import { MqttConnectionConfig } from "./mqtt-link.types";

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
