import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import "./RentRangeDropdown.css";

interface RentRangeDropdownProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  triggerLabel?: string;
}

// 지역 드롭다운(RegionPicker) 옆에 붙는 "월세" 필터. 네이티브 range input 2개를 겹쳐서
// 투 썸(two-thumb) 슬라이더처럼 보이게 만드는 흔한 방식이라, 아무 조치가 없으면 두 손잡이가
// 서로 지나쳐서 min > max가 될 수 있다. handleMinChange/handleMaxChange에서 상대편 값을
// step만큼 넘지 못하게 클램프해서 항상 minValue <= maxValue - step을 보장한다.
function RentRangeDropdown({ min, max, step = 5, value, onChange, triggerLabel = "월세" }: RentRangeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const [minValue, maxValue] = value;

  const isFiltered = minValue !== min || maxValue !== max;

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (fieldRef.current && !fieldRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMinChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Math.min(Number(event.target.value), maxValue - step);
    onChange([Math.max(min, next), maxValue]);
  };

  const handleMaxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Math.max(Number(event.target.value), minValue + step);
    onChange([minValue, Math.min(max, next)]);
  };

  const reset = () => onChange([min, max]);

  const minPercent = ((minValue - min) / (max - min)) * 100;
  const maxPercent = ((maxValue - min) / (max - min)) * 100;

  return (
    <div className="rent-range-dropdown" ref={fieldRef}>
      <button
        type="button"
        className={`rent-range-toggle${isFiltered ? " is-active" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {triggerLabel}
        <span aria-hidden="true">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="rent-range-panel">
          <div className="rent-range-slider">
            <div className="rent-range-slider-labels">
              <span>{minValue}만 원</span>
              <span>{maxValue === max ? `${max}만 원 이상` : `${maxValue}만 원`}</span>
            </div>
            <div className="rent-range-slider-track-wrap">
              <div className="rent-range-slider-track" />
              <div
                className="rent-range-slider-range"
                style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
              />
              <input
                type="range"
                className="rent-range-slider-input"
                min={min}
                max={max}
                step={step}
                value={minValue}
                onChange={handleMinChange}
                aria-label="희망 월세 최소값"
              />
              <input
                type="range"
                className="rent-range-slider-input"
                min={min}
                max={max}
                step={step}
                value={maxValue}
                onChange={handleMaxChange}
                aria-label="희망 월세 최대값"
              />
            </div>
          </div>

          <div className="rent-range-footer">
            <span className="rent-range-footer-hint">설문에서 응답한 희망 월세 기준으로 필터링돼요.</span>
            {isFiltered && (
              <button type="button" className="rent-range-reset" onClick={reset}>
                전체 삭제
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RentRangeDropdown;
