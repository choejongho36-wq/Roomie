import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getPosts } from "../../api";
import type { Post } from "../../types";
import { SEOUL_ZONES, regionMatchesDistrict } from "../../data/SeoulDistricts";
import "./BoardListPage.css";

interface BudgetBucket {
  id: string;
  label: string;
  min: number;
  max: number;
}

const BUDGET_BUCKETS: BudgetBucket[] = [
  { id: "under-50", label: "50만원 이하", min: 0, max: 50 },
  { id: "50-100", label: "50~100만원", min: 50, max: 100 },
  { id: "100-150", label: "100~150만원", min: 100, max: 150 },
  { id: "over-150", label: "150만원 이상", min: 150, max: Infinity },
];

const MOVE_IN_BUCKETS = [
  { id: "immediate", label: "즉시입주" },
  { id: "within-1m", label: "1개월 이내" },
  { id: "within-3m", label: "3개월 이내" },
  { id: "after-3m", label: "3개월 이후" },
  { id: "undecided", label: "날짜 협의" },
];

const getMoveInBucketId = (moveInDate: string | null): string => {
  if (!moveInDate) return "undecided";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(moveInDate);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "immediate";
  if (diffDays <= 30) return "within-1m";
  if (diffDays <= 90) return "within-3m";
  return "after-3m";
};

const budgetOverlapsBucket = (post: Post, bucket: BudgetBucket): boolean => {
  const min = post.budgetMin ?? post.budgetMax;
  const max = post.budgetMax ?? post.budgetMin;
  if (min === null || min === undefined || max === null || max === undefined) return false;
  return min <= bucket.max && max >= bucket.min;
};

const toggleValue = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

function BoardListPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState("");

  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [selectedBudgets, setSelectedBudgets] = useState<string[]>([]);
  const [selectedMoveIns, setSelectedMoveIns] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchAllPosts = async () => {
      try {
        const first = await getPosts(0);
        let all = first.content;
        for (let page = 1; page < first.totalPages; page++) {
          const next = await getPosts(page);
          all = all.concat(next.content);
        }
        if (isMounted) setPosts(all);
      } catch {
        if (isMounted) setError("게시글을 불러오지 못했습니다.");
      }
    };

    fetchAllPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    return posts.filter((post) => {
      if (selectedDistricts.length > 0) {
        const matches = selectedDistricts.some((district) => regionMatchesDistrict(post.region, district));
        if (!matches) return false;
      }

      if (selectedBudgets.length > 0) {
        const matches = selectedBudgets.some((id) => {
          const bucket = BUDGET_BUCKETS.find((b) => b.id === id);
          return bucket ? budgetOverlapsBucket(post, bucket) : false;
        });
        if (!matches) return false;
      }

      if (selectedMoveIns.length > 0) {
        if (!selectedMoveIns.includes(getMoveInBucketId(post.moveInDate))) return false;
      }

      return true;
    });
  }, [posts, selectedDistricts, selectedBudgets, selectedMoveIns]);

  const hasActiveFilters =
    selectedDistricts.length > 0 || selectedBudgets.length > 0 || selectedMoveIns.length > 0;

  const resetFilters = () => {
    setSelectedDistricts([]);
    setSelectedBudgets([]);
    setSelectedMoveIns([]);
  };

  return (
    <div className="page board-list-page">
      <div className="board-list-header">
        <div>
          <h1>모집 게시판</h1>
          <p className="board-list-subtitle">원하는 조건으로 룸메이트 모집글을 찾아보세요.</p>
        </div>
        <Link to="/board/write" className="btn btn-primary">
          글쓰기
        </Link>
      </div>

      <div className="board-filter-panel">
        <div className="board-filter-row">
          <div className="board-filter-row-label">지역</div>
          <div className="board-filter-row-options">
            {SEOUL_ZONES.map((zone) => (
              <div key={zone.zone} className="board-filter-zone-group">
                <span className="board-filter-zone-label">{zone.zone}</span>
                {zone.districts.map((district) => (
                  <button
                    key={district}
                    type="button"
                    className={`board-filter-chip-toggle${
                      selectedDistricts.includes(district) ? " is-selected" : ""
                    }`}
                    onClick={() => setSelectedDistricts((prev) => toggleValue(prev, district))}
                  >
                    {district}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="board-filter-row">
          <div className="board-filter-row-label">예산</div>
          <div className="board-filter-row-options">
            {BUDGET_BUCKETS.map((bucket) => (
              <button
                key={bucket.id}
                type="button"
                className={`board-filter-chip-toggle${selectedBudgets.includes(bucket.id) ? " is-selected" : ""}`}
                onClick={() => setSelectedBudgets((prev) => toggleValue(prev, bucket.id))}
              >
                {bucket.label}
              </button>
            ))}
          </div>
        </div>

        <div className="board-filter-row">
          <div className="board-filter-row-label">입주 시기</div>
          <div className="board-filter-row-options">
            {MOVE_IN_BUCKETS.map((bucket) => (
              <button
                key={bucket.id}
                type="button"
                className={`board-filter-chip-toggle${selectedMoveIns.includes(bucket.id) ? " is-selected" : ""}`}
                onClick={() => setSelectedMoveIns((prev) => toggleValue(prev, bucket.id))}
              >
                {bucket.label}
              </button>
            ))}
          </div>
        </div>

        <div className="board-filter-footer">
          {hasActiveFilters ? (
            <>
              선택한 필터로 게시글을 찾고 있어요.
              <button type="button" className="board-filter-reset" onClick={resetFilters}>
                필터 초기화
              </button>
            </>
          ) : (
            "필터를 선택하여 원하는 게시글을 빠르게 찾아보세요."
          )}
        </div>
      </div>

      {error && <p className="mypage-error">{error}</p>}

      {posts === null && !error && <p className="board-empty">불러오는 중...</p>}

      {posts !== null && filteredPosts.length === 0 && (
        <p className="board-empty">
          {hasActiveFilters ? "조건에 맞는 게시글이 없어요." : "등록된 게시글이 없어요."}
        </p>
      )}

      {filteredPosts.length > 0 && (
        <ul className="board-list">
          {filteredPosts.map((post) => (
            <li key={post.postId} className="board-list-item">
              <Link to={`/board/${post.postId}`}>
                <div className="board-list-item-top">
                  <span className="board-list-region">{post.title || post.region || "제목 없음"}</span>
                  {post.boardType ? (
                    <span className="board-status">{post.boardType}</span>
                  ) : (
                    <span className={`board-status board-status-${post.status.toLowerCase()}`}>
                      {post.status === "RECRUITING" ? "모집중" : "모집완료"}
                    </span>
                  )}
                </div>
                <p className="board-list-desc">{stripHtml(post.description)}</p>
                <div className="board-list-meta">
                  <span>{post.nickname}</span>
                  <span>{new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default BoardListPage;
