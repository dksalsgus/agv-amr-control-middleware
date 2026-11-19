export type MqttRawMessage = {
  topic: string;
  payload: Buffer;
};

export type MqttSubscribeOptions = {
  url: string;
  topic: string;
  qos: 0 | 1 | 2;
  username: string | null;
  password: string | null;
};

export type MqttHandlers = {
  onMessage: (message: MqttRawMessage) => Promise<void>;
  onLinkChange: (up: boolean) => Promise<void>;
};
