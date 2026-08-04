import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { API_ORIGIN, getPosts } from "../../api";
import type { Post } from "../../types/board";
import { FREE_BOARD_CATEGORIES, SPECIAL_BOARDS } from "../../data/BoardCategories";
import { useAuth } from "../../context/AuthContext";
import Pagination from "../../components/Pagination";
import defaultAvatar from "../../assets/Roomie_logo.png";
import "./BoardListPage.css";

const FREE_BOARD_LABEL = "자유 게시판";
// 한 화면에서 스크롤 없이 다 보이도록, 목록에 한 번에 보여주는 글 개수를 제한한다.
const PAGE_SIZE = 6;

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
    return posts
      .filter((post) => {
        if (!boardType) return true;
        // "자유 게시판"은 별도 boardType 값이 아니라, 공지사항/이벤트를 뺀
        // 카테고리(고민상담·잡담 등)로 분류된 글 전체를 묶어서 보여준다.
        if (boardType === FREE_BOARD_LABEL) {
          return !post.boardType || FREE_BOARD_CATEGORIES.includes(post.boardType);
        }
        return post.boardType === boardType;
      })
      // 최신 글이 맨 위로 오도록 작성일 기준 내림차순 정렬. (백엔드가 정렬 없이
      // 그냥 저장 순서대로 내려주고 있어서 프론트에서 한 번 더 정렬해준다.)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
            to={boardType && SPECIAL_BOARDS.includes(boardType) ? `/board/write?type=${encodeURIComponent(boardType)}` : "/board/write"}
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
              {pagedPosts.map((post) => (
                <tr
                  key={post.postId}
                  className="board-table-row"
                  onClick={() => navigate(`/board/${post.postId}`)}
                >
                  {/* 관리자 페이지(게시글 관리)의 ID 열과 값을 일치시키기 위해, 화면에 다시 계산한
                      순번이 아니라 실제 게시글 고유 id(postId)를 그대로 보여준다. */}
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
          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}

export default BoardListPage;
