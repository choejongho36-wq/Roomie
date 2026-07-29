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

// 지금은 서울만 지원하지만, 나중에 다른 시/도가 추가될 걸 감안해서
// "시·도" 단위를 처음부터 구조에 넣어둠 (여기 배열에 항목만 추가하면 확장 가능)
export const CITIES = ["서울"];

export const ALL_DISTRICT_OPTIONS = SEOUL_ZONES.flatMap((zone) => zone.districts).sort((a, b) =>
  a.localeCompare(b, "ko")
);

// "강동구 천호동", "강동구" 같은 저장된 지역 문자열을 다시 RegionToken으로 복원할 때 사용
export const parseRegionToken = (region: string | null | undefined): RegionToken | null => {
  if (!region) return null;
  const district = ALL_DISTRICT_OPTIONS.find((d) => region.includes(d));
  if (!district) return null;
  const dong = getNormalizedDongsForDistrict(district).find((d) => region.includes(d));
  return dong ? buildDongToken(district, dong) : buildDistrictToken(district);
};

// 시/도를 넣으면 그 지역의 구/군 목록을 반환. 지금은 서울만 데이터가 있지만,
// 나중에 다른 시/도가 추가되면 이 함수 안에 분기만 추가하면 됨 (컴포넌트 쪽은 안 건드려도 됨)
const getDistrictsForCity = (city: string): string[] => {
  if (city === "서울") return ALL_DISTRICT_OPTIONS;
  return [];
};

// "대치1동", "대치2동", "대치4동"처럼 같은 법정동(예: 대치동)을 행정 편의상
// 여러 행정동으로 나눠놓은 경우를 하나로 합쳐서 보여줌
// (실제 행정구역 데이터 자체는 건드리지 않고, 화면에 보여줄 때만 합쳐서 표시)
//
// ⚠️ 의도적으로 안 합쳐지는 예외 있음: "종로1·2·3·4가동", "금호2·3가동" 같은
// "숫자+가+동" 패턴은 겉보기엔 비슷해 보여도 성격이 다름 — 종로1가/종로2가는
// 관리상 나뉜 같은 동네가 아니라, 애초에 서로 다른 법정동(고유 지명)임.
// 그래서 "종로동"으로 합치면 존재하지도 않는 지명을 만들어내는 셈이 되므로
// 이 정규식은 일부러 이 패턴은 건드리지 않고 원본 그대로 남겨둠 (버그 아님)
const normalizeDongName = (dong: string): string => dong.replace(/\d+(동|읍|면)$/, "$1");

const getNormalizedDongsForDistrict = (district: string): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const dong of getDongsForDistrict(district)) {
    const normalized = normalizeDongName(dong);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return result;
};

interface RegionEntry {
  token: RegionToken;
  district: string;
  dong: string | null;
}

// 검색 대상 전체 목록: 구 단위(전체) + 모든 동을 한 번만 평탄화해서 만들어둠 (모듈 로드 시 1회만 계산)
const ALL_ENTRIES: RegionEntry[] = ALL_DISTRICT_OPTIONS.flatMap((district) => {
  const districtEntry: RegionEntry = { token: buildDistrictToken(district), district, dong: null };
  const dongEntries: RegionEntry[] = getNormalizedDongsForDistrict(district).map((dong) => ({
    token: buildDongToken(district, dong),
    district,
    dong,
  }));
  return [districtEntry, ...dongEntries];
});

// 검색어를 공백 기준으로 쪼개서, 각 조각이 "구 + 동" 문자열에 전부 포함되는 항목만 남김
// 예) "강남구 역삼동" -> ["강남구", "역삼동"] 둘 다 포함해야 매칭
// 예) "역삼동" -> 어느 구 소속이든 "역삼동"이 이름에 포함되면 매칭
const searchEntries = (term: string): RegionEntry[] => {
  const parts = term.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return [];
  return ALL_ENTRIES.filter((entry) => {
    const haystack = `${entry.district} ${entry.dong ?? ""}`;
    return parts.every((part) => haystack.includes(part));
  });
};

interface RegionPickerProps {
  selected: RegionToken[];
  onChange: (tokens: RegionToken[]) => void;
  multiple?: boolean;
  triggerLabel?: string;
  placeholder?: string;
  emptyHint?: string;
  variant?: "dropdown" | "inline";
  maxSelect?: number;
}

function RegionPicker({
  selected,
  onChange,
  multiple = true,
  triggerLabel = "지역",
  placeholder = "지역명 검색 예) 강남, 역삼동, 강남구 역삼동",
  emptyHint = "지역을 선택해주세요.",
  variant = "dropdown",
  maxSelect,
}: RegionPickerProps) {
  const isInline = variant === "inline";
  const [isOpen, setIsOpen] = useState(isInline);
  const [activeCity, setActiveCity] = useState(CITIES[0]);
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

  const searchResults = useMemo(() => searchEntries(search), [search]);
  const isSearching = search.trim().length > 0;

  // 검색 결과를 구별로 묶어서, 리스트에 소제목처럼 구 이름이 한 번씩만 보이게 함
  const groupedResults = useMemo(() => {
    const groups: { district: string; entries: RegionEntry[] }[] = [];
    for (const entry of searchResults) {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.district === entry.district) {
        lastGroup.entries.push(entry);
      } else {
        groups.push({ district: entry.district, entries: [entry] });
      }
    }
    return groups;
  }, [searchResults]);

  const isMaxReached = multiple && typeof maxSelect === "number" && selected.length >= maxSelect;

  const toggleToken = (regionToken: RegionToken) => {
    if (!multiple) {
      onChange([regionToken]);
      if (!isInline) setIsOpen(false);
      return;
    }
    const exists = selected.some((t) => t.key === regionToken.key);
    if (exists) {
      onChange(selected.filter((t) => t.key !== regionToken.key));
      return;
    }
    if (isMaxReached) return;
    onChange([...selected, regionToken]);
  };

  const removeToken = (key: string) => {
    onChange(selected.filter((t) => t.key !== key));
  };

  const renderEntryButton = (entry: RegionEntry, label: string) => {
    const isSelected = selected.some((t) => t.key === entry.token.key);
    const disabled = !isSelected && isMaxReached;
    return (
      <button
        key={entry.token.key}
        type="button"
        className={`region-picker-row${isSelected ? " is-selected" : ""}`}
        onClick={() => toggleToken(entry.token)}
        disabled={disabled}
      >
        {label}
        {isSelected && <span className="region-picker-check" aria-hidden="true">✓</span>}
      </button>
    );
  };

  const panelBody = (
    <>
      <div className="region-picker-search">
        <svg className="region-picker-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className="region-picker-search-input"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={placeholder}
        />
        {search && (
          <button type="button" className="region-picker-search-clear" onClick={() => setSearch("")} aria-label="검색어 지우기">
            ×
          </button>
        )}
      </div>

      {isSearching ? (
        <div className="region-picker-results">
          {groupedResults.length === 0 ? (
            <p className="region-picker-no-result">검색 결과가 없어요. 다른 동/구 이름으로 시도해보세요.</p>
          ) : (
            groupedResults.map((group) => (
              <div key={group.district} className="region-picker-result-group">
                <div className="region-picker-result-group-title">{group.district}</div>
                <div className="region-picker-result-group-body">
                  {group.entries.map((entry) =>
                    renderEntryButton(entry, entry.dong ?? `${entry.district} 전체`)
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="region-picker-columns">
          <div className="region-picker-col region-picker-col-city">
            <div className="region-picker-col-header">시·도</div>
            <div className="region-picker-col-body">
              {CITIES.map((city) => (
                <button
                  key={city}
                  type="button"
                  className={`region-picker-row${activeCity === city ? " is-active" : ""}`}
                  onClick={() => {
                    setActiveCity(city);
                    const firstDistrict = getDistrictsForCity(city)[0];
                    if (firstDistrict) setActiveDistrict(firstDistrict);
                  }}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          <div className="region-picker-col region-picker-col-narrow">
            <div className="region-picker-col-header">구·군</div>
            <div className="region-picker-col-body">
              {getDistrictsForCity(activeCity).map((district) => (
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
              {renderEntryButton(
                { token: buildDistrictToken(activeDistrict), district: activeDistrict, dong: null },
                `${activeDistrict} 전체`
              )}
              {getNormalizedDongsForDistrict(activeDistrict).map((dong) =>
                renderEntryButton(
                  { token: buildDongToken(activeDistrict, dong), district: activeDistrict, dong },
                  dong
                )
              )}
            </div>
          </div>
        </div>
      )}

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
        {selected.length > 0 && (
          <button type="button" className="region-picker-reset" onClick={() => onChange([])}>
            전체 삭제
          </button>
        )}
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