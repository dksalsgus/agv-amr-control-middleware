import { PlcPointValue } from "../../state/plc-point-state";

export type PlcPointChange = {
  pointId: string;
  current: PlcPointValue;
};
