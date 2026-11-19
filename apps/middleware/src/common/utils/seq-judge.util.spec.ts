import { ingestConfig } from "../../config/ingest.config";
import { SeqPoint } from "./seq-judge.types";
import { judgeSeq } from "./seq-judge.util";

const at = (seconds: number) => new Date(seconds * 1000);

describe("judgeSeq", () => {
  const { restartThresholdMs } = ingestConfig();
  const judge = (last: SeqPoint | null, next: SeqPoint) =>
    judgeSeq(last, next, restartThresholdMs);
  const last = { seq: 10, sourceTs: at(100) };

  it("처음 받은 값은 반영한다", () => {
    expect(judge(null, { seq: 1, sourceTs: at(1) })).toEqual({
      verdict: "FIRST",
      accept: true,
      missed: 0,
    });
  });

  it("seq = 마지막 + 1 이면 정상 반영", () => {
    expect(judge(last, { seq: 11, sourceTs: at(101) })).toEqual({
      verdict: "NORMAL",
      accept: true,
      missed: 0,
    });
  });

  it("seq > 마지막 + 1 이면 반영하고 건너뛴 개수를 유실로 센다", () => {
    expect(judge(last, { seq: 14, sourceTs: at(104) })).toEqual({
      verdict: "GAP",
      accept: true,
      missed: 3,
    });
  });

  it("seq = 마지막 이면 중복으로 버린다", () => {
    expect(judge(last, { seq: 10, sourceTs: at(100) })).toEqual({
      verdict: "DUPLICATE",
      accept: false,
      missed: 0,
    });
  });

  it("seq < 마지막 이면 순서 뒤바뀜으로 버린다", () => {
    expect(judge(last, { seq: 9, sourceTs: at(99) })).toEqual({
      verdict: "OUT_OF_ORDER",
      accept: false,
      missed: 0,
    });
  });

  it("seq < 마지막 이어도 sourceTs가 5초 이상 앞서면 장비 재시작으로 반영", () => {
    expect(judge(last, { seq: 1, sourceTs: at(105) })).toEqual({
      verdict: "RESTART",
      accept: true,
      missed: 0,
    });
  });

  it("sourceTs가 5초 미만으로 앞서면 재시작이 아니다", () => {
    const judgement = judge(last, {
      seq: 1,
      sourceTs: at(104.9),
    });

    expect(judgement.verdict).toBe("OUT_OF_ORDER");
  });
});
