import { useEffect, useMemo, useRef, useState } from "react";
import { SEOUL_ZONES, getDongsForDistrict } from "../data/SeoulDistricts";
import "./RegionPicker.css";

export interface RegionToken {
  key: string;
  district: string;
  dong: string | null;
  label: string;
}

export const buildDistrictToken = (district: string): RegionToken => ({
  key: `${district}:전체`,
  district,
  dong: null,
  label: `${district} 전체`,
});

export const buildDongToken = (district: string, dong: string): RegionToken => ({
  key: `${district}:${dong}`,
  district,
  dong,
  label: `${district} ${dong}`,
});

export const ALL_DISTRICT_OPTIONS = SEOUL_ZONES.flatMap((zone) => zone.districts).sort((a, b) =>
  a.localeCompare(b, "ko")
);

// "강동구 천호동", "강동구" 같은 저장된 지역 문자열을 다시 RegionToken으로 복원할 때 사용
export const parseRegionToken = (region: string | null | undefined): RegionToken | null => {
  if (!region) return null;
  const district = ALL_DISTRICT_OPTIONS.find((d) => region.includes(d));
  if (!district) return null;
  const dong = getDongsForDistrict(district).find((d) => region.includes(d));
  return dong ? buildDongToken(district, dong) : buildDistrictToken(district);
};

interface RegionPickerProps {
  selected: RegionToken[];
  onChange: (tokens: RegionToken[]) => void;
  multiple?: boolean;
  triggerLabel?: string;
  placeholder?: string;
  emptyHint?: string;
  variant?: "dropdown" | "inline";
}

function RegionPicker({
  selected,
  onChange,
  multiple = true,
  triggerLabel = "지역",
  placeholder = "지역명 검색 예) 강남, 역삼동",
  emptyHint = "지역을 선택해주세요.",
  variant = "dropdown",
}: RegionPickerProps) {
  const isInline = variant === "inline";
  const [isOpen, setIsOpen] = useState(isInline);
  const [activeDistrict, setActiveDistrict] = useState(selected[0]?.district ?? ALL_DISTRICT_OPTIONS[0]);
  const [search, setSearch] = useState("");
  const fieldRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isInline) return;
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (fieldRef.current && !fieldRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isInline]);

  const visibleDistricts = useMemo(() => {
    const term = search.trim();
    if (!term) return ALL_DISTRICT_OPTIONS;
    return ALL_DISTRICT_OPTIONS.filter((district) => district.includes(term));
  }, [search]);

  const toggleToken = (regionToken: RegionToken) => {
    if (!multiple) {
      onChange([regionToken]);
      if (!isInline) setIsOpen(false);
      return;
    }
    const exists = selected.some((t) => t.key === regionToken.key);
    onChange(exists ? selected.filter((t) => t.key !== regionToken.key) : [...selected, regionToken]);
  };

  const removeToken = (key: string) => {
    onChange(selected.filter((t) => t.key !== key));
  };

  const panelBody = (
    <>
      <div className="region-picker-search">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={placeholder} />
      </div>

      <div className="region-picker-columns">
        <div className="region-picker-col region-picker-col-narrow">
          <div className="region-picker-col-header">시·도</div>
          <div className="region-picker-col-body">
            <div className="region-picker-row is-active">서울</div>
          </div>
        </div>

        <div className="region-picker-col region-picker-col-narrow">
          <div className="region-picker-col-header">시·구·군</div>
          <div className="region-picker-col-body">
            {visibleDistricts.map((district) => (
              <button
                key={district}
                type="button"
                className={`region-picker-row${activeDistrict === district ? " is-active" : ""}`}
                onClick={() => setActiveDistrict(district)}
              >
                {district}
              </button>
            ))}
          </div>
        </div>

        <div className="region-picker-col">
          <div className="region-picker-col-header">동·읍·면</div>
          <div className="region-picker-col-body">
            <button
              type="button"
              className={`region-picker-row${
                selected.some((t) => t.key === `${activeDistrict}:전체`) ? " is-selected" : ""
              }`}
              onClick={() => toggleToken(buildDistrictToken(activeDistrict))}
            >
              {activeDistrict} 전체
              {selected.some((t) => t.key === `${activeDistrict}:전체`) && <span aria-hidden="true"> ✓</span>}
            </button>
            {getDongsForDistrict(activeDistrict).map((dong) => {
              const key = `${activeDistrict}:${dong}`;
              const isSelected = selected.some((t) => t.key === key);
              return (
                <button
                  key={dong}
                  type="button"
                  className={`region-picker-row${isSelected ? " is-selected" : ""}`}
                  onClick={() => toggleToken(buildDongToken(activeDistrict, dong))}
                >
                  {dong}
                  {isSelected && <span aria-hidden="true"> ✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="region-picker-footer">
        {selected.length > 0 ? (
          <div className="region-picker-selected-chips">
            {selected.map((regionToken) => (
              <span key={regionToken.key} className="region-picker-selected-chip">
                {regionToken.label}
                <button
                  type="button"
                  onClick={() => removeToken(regionToken.key)}
                  aria-label={`${regionToken.label} 제거`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <span className="region-picker-footer-hint">{emptyHint}</span>
        )}
        <button type="button" className="region-picker-reset" onClick={() => onChange([])}>
          초기화
        </button>
      </div>
    </>
  );

  if (isInline) {
    return <div className="region-picker region-picker-inline">{panelBody}</div>;
  }

  return (
    <div className="region-picker" ref={fieldRef}>
      <button
        type="button"
        className={`region-picker-toggle${selected.length > 0 ? " is-active" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {triggerLabel}
        {selected.length > 0 && <span className="region-picker-badge">{selected.length}</span>}
        <span aria-hidden="true">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && <div className="region-picker-panel">{panelBody}</div>}
    </div>
  );
}

export default RegionPicker;
