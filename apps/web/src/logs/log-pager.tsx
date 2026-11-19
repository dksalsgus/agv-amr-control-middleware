import { formatNumber } from "../common/utils/number.util";
import { Icon } from "../components/icon";
import { PAGE_SIZE } from "./logs.constants";
import { LoadStatus } from "./logs.types";
import { pageList } from "./logs.util";

type Props = {
  status: LoadStatus;
  page: number;
  total: number;
  onPage: (page: number, focus: string) => void;
};

const STATUS_TEXT: Record<Exclude<LoadStatus, "ok">, [string, string]> = {
  loading: ["불러오는 중…", "이력을 불러오는 중입니다."],
  empty: ["0건", "조건에 맞는 이력이 없습니다."],
  error: ["불러오기 실패", "이력을 불러오지 못했습니다."],
};

export const LogPager = ({ status, page, total, onPage }: Props) => {
  if (status !== "ok") {
    const [info, spoken] = STATUS_TEXT[status];
    return (
      <>
        <nav className="pager" aria-label="페이지 넘김">
          <span className="pager-info">{info}</span>
        </nav>
        <p className="sr-only" aria-live="polite">
          {spoken}
        </p>
      </>
    );
  }

  const last = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(total, page * PAGE_SIZE);
  const info = `${formatNumber(from)}–${formatNumber(to)} / 총 ${formatNumber(total)}건`;

  return (
    <>
      <nav className="pager" id="pager" aria-label="페이지 넘김">
        <span className="pager-info mono">{info}</span>
        <button
          type="button"
          className="btn btn-sm"
          data-act="prev"
          disabled={page <= 1}
          onClick={() => onPage(page - 1, '#pager [data-act="prev"]')}
        >
          <Icon name="prev" />
          이전
        </button>
        {pageList(page, last).map((item, index) =>
          item === "gap" ? (
            <span key={`gap-${index}`} className="page-gap" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className="btn btn-sm page-btn"
              data-page={item}
              aria-current={item === page ? "page" : undefined}
              aria-label={`${item}페이지`}
              onClick={() => onPage(item, `#pager [data-page="${item}"]`)}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          className="btn btn-sm"
          data-act="next"
          disabled={page >= last}
          onClick={() => onPage(page + 1, '#pager [data-act="next"]')}
        >
          다음
          <Icon name="next" />
        </button>
      </nav>
      <p className="sr-only" aria-live="polite">
        {info} 표시 중, {page}/{last}페이지
      </p>
    </>
  );
};
