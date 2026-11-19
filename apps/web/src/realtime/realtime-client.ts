import { tokenStorage } from "../auth/token-storage";
import { RealtimeStore } from "./realtime-store";
import { RealtimeView, ServerMessage } from "./realtime.types";

type Listener = () => void;

/** 미들웨어 WebSocket에 붙어 상태를 받는다. 끊기면 다시 붙어 epoch와 rev로 이어받는다. */
export class RealtimeClient {
  private static readonly PATH = "/ws";
  private static readonly RETRY_DELAYS_MS = [500, 1000, 2000, 5000];
  /** 서버 ping 주기(5초)의 3배 동안 아무것도 안 오면 끊긴 것으로 본다. */
  private static readonly SILENCE_LIMIT_MS = 15000;
  private static readonly LOGIN_PATH = "/login";

  private readonly store = new RealtimeStore();
  private readonly listeners = new Set<Listener>();
  private socket: WebSocket | null = null;
  private retryCount = 0;
  private retryTimer: number | null = null;
  private silenceTimer: number | null = null;
  private answered = false;
  private disconnectedAt: number | null = null;
  private running = false;

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.connect();
  }

  stop(): void {
    this.running = false;
    this.clearTimers();
    this.socket?.close();
    this.socket = null;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getView(): RealtimeView {
    return this.store.getView();
  }

  private connect(): void {
    this.store.setStatus("CONNECTING");
    this.emit();

    const socket = new WebSocket(this.toUrl());
    this.socket = socket;
    this.answered = false;

    socket.onopen = () => this.sendHello(socket);
    socket.onmessage = (event: MessageEvent<string>) =>
      this.handleMessage(socket, event.data);
    socket.onclose = () => this.handleClose(socket);
  }

  private sendHello(socket: WebSocket): void {
    const session = tokenStorage.find();
    const resume = this.store.getResumePoint();
    const data =
      resume.epoch === null
        ? { token: session?.accessToken }
        : {
            token: session?.accessToken,
            epoch: resume.epoch,
            lastRev: resume.rev,
          };
    this.send(socket, "hello", data);
    this.watchSilence(socket);
  }

  private handleMessage(socket: WebSocket, raw: string): void {
    this.watchSilence(socket);
    const message = JSON.parse(raw) as ServerMessage;

    switch (message.event) {
      case "snapshot":
        this.store.applySnapshot(message.data);
        this.markAnswered();
        break;
      case "delta": {
        const result = this.store.applyDelta(message.data);
        if (result === "GAP") {
          this.send(socket, "resync", { lastRev: this.store.getView().rev });
          return;
        }
        this.markAnswered();
        break;
      }
      case "ping":
        this.send(socket, "pong", { t: message.data.t });
        return;
      case "pong":
        return;
      case "error":
        this.handleServerError(message.data.message);
        return;
    }

    this.emit();
  }

  /** hello에 답이 오기 전의 오류는 토큰 문제다. 로그인 화면으로 보낸다. */
  private handleServerError(message: string | string[]): void {
    console.warn("WebSocket 오류", message);
    if (this.answered) {
      return;
    }
    this.stop();
    tokenStorage.clear();
    window.location.assign(RealtimeClient.LOGIN_PATH);
  }

  /** 첫 답을 받으면 연결이 복구된 것이다. 끊긴 시각부터 걸린 시간을 남긴다. */
  private markAnswered(): void {
    this.answered = true;
    this.retryCount = 0;
    this.store.setStatus("OPEN");
    if (this.disconnectedAt !== null) {
      this.store.setRecovery(Date.now() - this.disconnectedAt);
      this.disconnectedAt = null;
    }
  }

  private handleClose(socket: WebSocket): void {
    if (this.socket !== socket) {
      return;
    }
    this.socket = null;
    this.clearTimers();
    if (!this.running) {
      return;
    }

    this.disconnectedAt = this.disconnectedAt ?? Date.now();
    this.store.setStatus("DISCONNECTED");
    this.emit();

    const delays = RealtimeClient.RETRY_DELAYS_MS;
    const delay = delays[Math.min(this.retryCount, delays.length - 1)];
    this.retryCount += 1;
    this.retryTimer = window.setTimeout(() => this.connect(), delay);
  }

  /** 서버가 멈추면 close가 오지 않을 수 있어, 조용한 시간이 길면 직접 끊는다. */
  private watchSilence(socket: WebSocket): void {
    if (this.silenceTimer !== null) {
      window.clearTimeout(this.silenceTimer);
    }
    this.silenceTimer = window.setTimeout(
      () => socket.close(),
      RealtimeClient.SILENCE_LIMIT_MS,
    );
  }

  private clearTimers(): void {
    if (this.retryTimer !== null) {
      window.clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.silenceTimer !== null) {
      window.clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  private send(socket: WebSocket, event: string, data: unknown): void {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ event, data }));
    }
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private toUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}${RealtimeClient.PATH}`;
  }
}

export const realtimeClient = new RealtimeClient();
