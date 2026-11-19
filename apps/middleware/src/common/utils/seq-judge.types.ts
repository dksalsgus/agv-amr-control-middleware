export type SeqPoint = {
  seq: number;
  sourceTs: Date;
};

export type SeqVerdict =
  | "FIRST"
  | "NORMAL"
  | "GAP"
  | "DUPLICATE"
  | "OUT_OF_ORDER"
  | "RESTART";

export type SeqJudgement = {
  verdict: SeqVerdict;
  accept: boolean;
  missed: number;
};
