import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { API_ORIGIN, getPosts } from "../../api";
import type { Post } from "../../types";
import { regionMatchesDistrict, regionMatchesDong } from "../../data/SeoulDistricts";
import RegionPicker, { type RegionToken } from "../../components/RegionPicker";
import "./BoardListPage.css";

const getProfileImageSrc = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
};

const getInitial = (nickname: string | null | undefined) => (nickname || "?").trim().charAt(0) || "?";

function AuthorAvatar({ nickname, profileImageUrl }: { nickname: string; profileImageUrl: string | null }) {
  const src = getProfileImageSrc(profileImageUrl);
  if (src) {
    return <img className="board-table-avatar" src={src} alt={nickname} />;
  }
  return (
    <div className="board-table-avatar board-table-avatar-fallback" aria-hidden="true">
      {getInitial(nickname)}
    </div>
  );
}

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
  { id: "immediate", label: "즉시입주", min: 0, max: 0 },
  { id: "within-1m", label: "1개월 이내", min: 0, max: 1 },
  { id: "within-3m", label: "3개월 이내", min: 0, max: 3 },
  { id: "after-3m", label: "3개월 이후", min: 3, max: Infinity },
  { id: "undecided", label: "날짜 협의", min: 0, max: 0 },
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

const moveInMatchesBucket = (post: Post, bucketId: string): boolean => {
  if (post.moveInMonthMin != null || post.moveInMonthMax != null) {
    if (bucketId === "undecided") return false;
    const bucket = MOVE_IN_BUCKETS.find((b) => b.id === bucketId);
    if (!bucket) return false;
    const postMin = post.moveInMonthMin ?? 0;
    const postMax = post.moveInMonthMax ?? Infinity;
    return postMin <= bucket.max && postMax >= bucket.min;
  }
  if (post.moveInDate) {
    return getMoveInBucketId(post.moveInDate) === bucketId;
  }
  return bucketId === "undecided";
};

const budgetOverlapsBucket = (post: Post, bucket: BudgetBucket): boolean => {
  const min = post.budgetMin ?? post.budgetMax;
  const max = post.budgetMax ?? post.budgetMin;
  if (min === null || min === undefined || max === null || max === undefined) return false;
  return min <= bucket.max && max >= bucket.min;
};

const toggleValue = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

const formatShortDate = (dateString: string) => {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}.${day}`;
};

function BoardListPage() {

  const [searchParams] = useSearchParams();
  const boardType = searchParams.get("type");
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState("");

  const [selectedRegions, setSelectedRegions] = useState<RegionToken[]>([]);
  const [selectedBudgets, setSelectedBudgets] = useState<string[]>([]);
  const [selectedMoveIns, setSelectedMoveIns] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);

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
      if (boardType && post.boardType !== boardType) return false;
      if (selectedDistricts.length > 0) {
        const matches = selectedDistricts.some((district) => regionMatchesDistrict(post.region, district));

      if (selectedRegions.length > 0) {
        const matches = selectedRegions.some((regionToken) =>
          regionToken.dong
            ? regionMatchesDong(post.region, regionToken.dong)
            : regionMatchesDistrict(post.region, regionToken.district)
        );

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
        const matches = selectedMoveIns.some((id) => moveInMatchesBucket(post, id));
        if (!matches) return false;
      }

      return true;
   }});

  }, [posts, boardType,selectedRegions, selectedDistricts, selectedBudgets, selectedMoveIns]);

  const hasActiveFilters =
    selectedRegions.length > 0 || selectedBudgets.length > 0 || selectedMoveIns.length > 0;

  const resetFilters = () => {
    setSelectedRegions([]);
    setSelectedBudgets([]);
    setSelectedMoveIns([]);
    setSelectedDistricts([]);
  };

  return (
    <div className="page board-list-page">
      <div className="board-list-header">
        <div>
          <h1>{boardType ?? "커뮤니티"}</h1>
          <p className="board-list-subtitle">
            {boardType === "고민게시판"
              ? "함께 나누고 싶은 고민을 이야기해보세요."
              : "원하는 조건으로 룸메이트 모집글을 찾아보세요."}
          </p>
        </div>
        <Link to="/board/write" className="btn btn-primary">
          글쓰기
        </Link>
      </div>

      {boardType !== "고민게시판" && (
        <div className="board-filter-panel">
          <div className="board-filter-row board-filter-row-region">
            <div className="board-filter-row-label">지역</div>
            <div className="board-filter-row-options">
              <RegionPicker selected={selectedRegions} onChange={setSelectedRegions} variant="inline" />
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
      )}

      {error && <p className="mypage-error">{error}</p>}

      {posts === null && !error && <p className="board-empty">불러오는 중...</p>}

      {posts !== null && filteredPosts.length === 0 && (
        <p className="board-empty">
          {hasActiveFilters ? "조건에 맞는 게시글이 없어요." : "등록된 게시글이 없어요."}
        </p>
      )}

      {filteredPosts.length > 0 && (
        <div className="board-table-wrap">
          <table className="board-table">
            <colgroup>
              <col style={{ width: 70 }} />
              <col />
              <col style={{ width: 140 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 70 }} />
              <col style={{ width: 60 }} />
            </colgroup>
            <thead>
              <tr>
                <th>번호</th>
                <th>제목</th>
                <th>작성자</th>
                <th>작성일</th>
                <th>조회수</th>
                <th>찜</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => (
                <tr
                  key={post.postId}
                  className="board-table-row"
                  onClick={() => navigate(`/board/${post.postId}`)}
                >
                  <td className="board-table-number-cell">{post.postId}</td>
                  <td className="board-table-title-cell">
                    <Link to={`/board/${post.postId}`} onClick={(e) => e.stopPropagation()}>
                      {post.title || post.region || "제목 없음"}
                    </Link>
                  </td>
                  <td className="board-table-author-cell">
                    <span className="board-table-author">
                      <AuthorAvatar nickname={post.nickname} profileImageUrl={post.authorProfileImageUrl} />
                      {post.nickname}
                    </span>
                  </td>
                  <td>{formatShortDate(post.createdAt)}</td>
                  <td>{post.viewCount}</td>
                  <td>{post.bookmarkCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BoardListPage;
