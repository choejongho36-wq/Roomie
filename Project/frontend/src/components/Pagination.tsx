import "./Pagination.css";

interface PaginationProps {
  /** 0-base 현재 페이지 */
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

// 페이지 번호가 많아지면 "1 ... 4 5 6 ... 12"처럼 현재 페이지 주변 + 처음/끝만 보여주고
// 나머지는 "..."으로 줄인다. 게시판 목록이 한 화면에 다 들어오도록 항목 수를 줄인 대신,
// 그 뒤에 남는 글들을 이 페이지네이션으로 넘겨볼 수 있게 한다.
const buildPageNumbers = (current: number, total: number): (number | "ellipsis")[] => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i);
  }
  const pages = new Set<number>([0, total - 1, current, current - 1, current + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 0 && p < total)
    .sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) {
      result.push("ellipsis");
    }
    result.push(p);
  });
  return result;
};

function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="페이지 이동">
      <button
        type="button"
        className="pagination-arrow"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        aria-label="이전 페이지"
      >
        ‹
      </button>

      {buildPageNumbers(page, totalPages).map((p, i) =>
        p === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className="pagination-ellipsis">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            className={`pagination-page${p === page ? " is-active" : ""}`}
            onClick={() => onChange(p)}
          >
            {p + 1}
          </button>
        )
      )}

      <button
        type="button"
        className="pagination-arrow"
        disabled={page === totalPages - 1}
        onClick={() => onChange(page + 1)}
        aria-label="다음 페이지"
      >
        ›
      </button>
    </nav>
  );
}

export default Pagination;
