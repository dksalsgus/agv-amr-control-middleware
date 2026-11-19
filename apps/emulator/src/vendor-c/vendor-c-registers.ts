import { radianToDecidegree } from "../common/utils/angle.util";
import {
  toUint16,
  toUint32Words,
  toUint48Words,
} from "../common/utils/register.util";
import { Robot, RobotMode } from "../simulation/robot";
import { VENDOR_C_BLOCK_SIZE } from "../config";

const OP_STATE_CODE: Record<RobotMode, number> = {
  IDLE: 0,
  DRIVING: 1,
  CHARGING: 2,
};

/**
 * 제조사 C 차량 한 대를 레지스터 16개로 바꾼다 (설계 문서 4장 C열).
 * +0~1 seq(uint32), +2~4 발생 시각(uint48 ms), +5~6 x·y(int16 cm), +7 방향(0.1도),
 * +8 속도(cm/s), +9 배터리(%), +10 상태(0~4), +11 오류 코드(0이면 없음), +12 비트0 적재
 */
export class VendorCRegisterEncoder {
  encode(robot: Robot, sampledAt: Date): number[] {
    const registers = new Array<number>(VENDOR_C_BLOCK_SIZE).fill(0);
    const ms = sampledAt.getTime();

    [registers[0], registers[1]] = toUint32Words(robot.seq);
    [registers[2], registers[3], registers[4]] = toUint48Words(ms);

    registers[5] = toUint16(Math.round(robot.x * 100));
    registers[6] = toUint16(Math.round(robot.y * 100));
    registers[7] = radianToDecidegree(robot.theta);
    registers[8] = Math.round(robot.speed * 100);
    registers[9] = Math.round(robot.batteryPct);
    registers[10] = OP_STATE_CODE[robot.mode];
    registers[11] = 0;
    registers[12] = robot.loaded ? 1 : 0;

    return registers;
  }
}
