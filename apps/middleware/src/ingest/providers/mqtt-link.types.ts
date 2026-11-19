/** vendors_connections.config의 MQTT 모양 */
export type MqttConnectionConfig = {
  url: string;
  topicPattern: string;
  qos: 0 | 1 | 2;
  username: string | null;
  password: string | null;
};
