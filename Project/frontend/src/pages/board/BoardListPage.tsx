import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { API_ORIGIN, getPosts } from "../../api";
import type { Post } from "../../types/board";
import { SPECIAL_BOARDS } from "../../data/BoardCategories";
import { useAuth } from "../../context/AuthContext";
import Pagination from "../../components/Pagination";
import defaultAvatar from "../../assets/Roomie_logo.png";
import "./BoardListPage.css";

// 한 화면에서 스크롤 없이 다 보이도록, 목록에 한 번에 보여주는 글 개수를 제한한다.
const PAGE_SIZE = 20;

const getProfileImageSrc = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
};

function AuthorAvatar({ nickname, profileImageUrl }: { nickname: string; profileImageUrl: string | null }) {
  return <img className="board-table-avatar" src={getProfileImageSrc(profileImageUrl) ?? defaultAvatar} alt={nickname} />;
}

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
  const { user } = useAuth();

  const canWrite = Boolean(user?.isAdmin) || !SPECIAL_BOARDS.includes(boardType ?? "");

  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);

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

    // 한 글이 여러 게시판에 동시에(중복으로) 고정될 수 있다. 공지사항/이벤트도 다른 게시판과
    // 동일하게, 지금 보고 있는 그 게시판 안에서만 상단 고정으로 뜬다(더 이상 전역 노출 특례
    // 없음). 다만 "전체"(boardType 없음) 화면에서는 어느 게시판에든 고정된 글을 다 모아서
    // 보여준다. 문의 게시판은 이 컴포넌트를 아예 쓰지 않으니 자연히 대상에서 빠진다.
    const pinnedPosts = posts
      .filter((post) => {
        if (!post.pins || post.pins.length === 0) return false;
        if (!boardType) return true;
        return post.pins.some((pin) => pin.boardType === boardType);
      })
      .sort((a, b) => {
        const orderOf = (post: Post) => {
          if (boardType) {
            return post.pins.find((pin) => pin.boardType === boardType)?.pinOrder ?? 0;
          }
          // "전체"에서는 게시판마다 고정 순서가 따로 놀아서 하나로 합칠 기준이 없다. 그 글이
          // 가진 고정 순서 중 가장 작은 값(=어느 게시판에서든 가장 앞쪽인 순서)을 대표로 쓴다.
          return Math.min(...post.pins.map((pin) => pin.pinOrder));
        };
        // 순서가 같은 경우(정상적으로는 안 생기지만 혹시를 대비해) postId로 한 번 더 정렬해서,
        // 관리자 페이지와 항상 같은 순서로 보이게 한다.
        return orderOf(a) - orderOf(b) || a.postId - b.postId;
      });
    const pinnedIds = new Set(pinnedPosts.map((post) => post.postId));

    const rest = posts
      .filter((post) => {
        if (pinnedIds.has(post.postId)) return false; // 위 고정 목록에 이미 포함되므로 중복 방지
        if (!boardType) return true;
        return post.boardType === boardType;
      })
      // 최신 글이 맨 위로 오도록 작성일 기준 내림차순 정렬. (백엔드가 정렬 없이
      // 그냥 저장 순서대로 내려주고 있어서 프론트에서 한 번 더 정렬해준다.)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return [...pinnedPosts, ...rest];
  }, [posts, boardType]);

  // 게시판(필터)을 바꾸면 이전 게시판에서 보던 페이지 번호가 아니라 1페이지부터 다시 보여준다.
  useEffect(() => {
    setPage(0);
  }, [boardType]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  // 필터링 결과가 줄어들어 지금 페이지가 범위를 벗어나면(예: 마지막 페이지를 보다가
  // 다른 게시판으로 바꾼 경우) 마지막 유효 페이지로 되돌린다.
  const safePage = Math.min(page, totalPages - 1);
  const pagedPosts = filteredPosts.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  return (
    <div className="page board-list-page">
      <div className="board-list-header">
        <div>
          <h1>{boardType ?? "커뮤니티"}</h1>
          <p className="board-list-subtitle">
            {boardType === "공지사항"
              ? "서비스 공지·업데이트 소식을 확인하세요."
              : boardType === "이벤트"
              ? "진행 중이거나 예정된 이벤트를 확인하세요."
              : "자유롭게 이야기를 나눠보세요."}
          </p>
        </div>
        {canWrite && (
          <Link
            to={boardType ? `/board/write?type=${encodeURIComponent(boardType)}` : "/board/write"}
            className="btn btn-primary"
          >
            글쓰기
          </Link>
        )}
      </div>

      {error && <p className="mypage-error">{error}</p>}

      {posts === null && !error && <p className="board-empty">불러오는 중...</p>}

      {posts !== null && filteredPosts.length === 0 && (
        <p className="board-empty">등록된 게시글이 없어요.</p>
      )}

      {filteredPosts.length > 0 && (
        <div className="board-table-wrap">
          <table className="board-table">
            <colgroup>
              <col style={{ width: 84 }} />
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
                <th>추천</th>
              </tr>
            </thead>
            <tbody>
              {pagedPosts.map((post) => (
                <tr
                  key={post.postId}
                  className="board-table-row"
                  onClick={() => navigate(`/board/${post.postId}`)}
                >
                  {/* 관리자 페이지(게시글 관리)의 ID 열과 값을 일치시키기 위해, 화면에 다시 계산한
                      순번이 아니라 실제 게시글 고유 id(postId)를 그대로 보여준다. */}
                  <td className="board-table-number-cell">
                    {post.pins && post.pins.length > 0 ? (
                      <span className="board-table-pinned-badge">고정</span>
                    ) : (
                      post.postId
                    )}
                  </td>
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
                  <td>{post.recommendCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}

export default BoardListPage;
