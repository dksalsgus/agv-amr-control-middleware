type Props = { visible: number; total: number };

/** 맵 아래 범례와 표시 대수 */
export const MapLegend = ({ visible, total }: Props) => (
  <div className="map-foot">
    <span className="legend-item">
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <circle
          cx="6"
          cy="6"
          r="5"
          fill="none"
          stroke="#A8B3BF"
          strokeWidth="1.5"
        />
      </svg>
      A 원
    </span>
    <span className="legend-item">
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <rect
          x="1.5"
          y="1.5"
          width="9"
          height="9"
          fill="none"
          stroke="#A8B3BF"
          strokeWidth="1.5"
        />
      </svg>
      B 사각
    </span>
    <span className="legend-item">
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <path
          d="M6 0.8 L11.2 6 L6 11.2 L0.8 6 Z"
          fill="none"
          stroke="#A8B3BF"
          strokeWidth="1.5"
        />
      </svg>
      C 마름모
    </span>
    <span className="legend-sep" aria-hidden="true" />
    <span className="legend-item">
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <circle cx="6" cy="6" r="5" fill="#A3B4C6" />
        <circle cx="6" cy="6" r="2" fill="#10161C" />
      </svg>
      가운데 점 = 적재
    </span>
    <span className="legend-item">
      <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
        <circle cx="5" cy="6" r="4" fill="#A3B4C6" />
        <path d="M9 6 H15" stroke="#E7ECF1" strokeWidth="1.5" />
      </svg>
      바늘 = 방향
    </span>
    <span className="legend-item">
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <circle
          cx="6"
          cy="6"
          r="4.6"
          fill="#6E7A87"
          fillOpacity="0.5"
          stroke="#A8B3BF"
          strokeWidth="1.2"
          strokeDasharray="2 2"
        />
      </svg>
      점선 = STALE
    </span>
    <span className="legend-item">
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <circle cx="6" cy="6" r="3" fill="#FF5B61" />
        <circle
          cx="6"
          cy="6"
          r="5.2"
          fill="none"
          stroke="#FF5B61"
          strokeWidth="1.2"
        />
      </svg>
      고리 = 오류
    </span>
    <span className="map-hint">
      맵 선택 후 <kbd>←</kbd>
      <kbd>→</kbd> 이동 · <kbd>Esc</kbd> 해제
    </span>
    <span className="map-count mono">
      표시 {visible} / {total}대
    </span>
  </div>
);
