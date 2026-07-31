import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { API_ORIGIN, getPosts } from "../../api";
import type { Post } from "../../types";
import defaultAvatar from "../../assets/Roomie_logo.png";
import "./BoardListPage.css";

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

  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState("");

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
      .filter((post) => !boardType || post.boardType === boardType)
      // 최신 글이 맨 위로 오도록 작성일 기준 내림차순 정렬. (백엔드가 정렬 없이
      // 그냥 저장 순서대로 내려주고 있어서 프론트에서 한 번 더 정렬해준다.)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts, boardType]);

  return (
    <div className="page board-list-page">
      <div className="board-list-header">
        <div>
          <h1>{boardType ?? "커뮤니티"}</h1>
          <p className="board-list-subtitle">
            {boardType === "고민 게시판"
              ? "함께 나누고 싶은 고민을 이야기해보세요."
              : "자유롭게 이야기를 나눠보세요."}
          </p>
        </div>
        <Link to="/board/write" className="btn btn-primary">
          글쓰기
        </Link>
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
              {filteredPosts.map((post, index) => (
                <tr
                  key={post.postId}
                  className="board-table-row"
                  onClick={() => navigate(`/board/${post.postId}`)}
                >
                  {/* 게시글 고유 id(postId)는 게시판 구분 없이 전체 글에 걸쳐 매겨지는 값이라
                      그대로 쓰면 모집/고민 게시판 번호가 섞이고, 삭제해도 auto-increment라
                      숫자가 줄어들지 않고 구멍이 남는다. 그래서 지금 이 목록(현재 게시판/필터
                      기준)에서의 순서로 매번 다시 계산해서 보여준다. */}
                  <td className="board-table-number-cell">{filteredPosts.length - index}</td>
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
