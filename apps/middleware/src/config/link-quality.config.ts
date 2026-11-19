import { registerAs } from "@nestjs/config";

export const linkQualityConfig = registerAs("linkQuality", () => ({
  /** 유실률을 내는 최근 구간. 연결이 UP이 된 뒤의 표본만 쓴다. */
  windowMs: 30000,
  /** 유실률이 이 이상이면 LINK_LOSS 알람. 과제에 기준이 없어 임의로 5%로 정했다. */
  alarmLossPct: 5,
  /** 열린 알람은 유실률이 이 아래로 내려가야 푼다. 기준 근처에서 열렸다 닫혔다 하지 않게 한다. */
  clearLossPct: 2,
  /** 기대 건수가 이보다 적으면 판정하지 않는다. 표본이 적을 때 한두 건으로 알람이 열리지 않게 한다. */
  minExpected: 20,
}));
