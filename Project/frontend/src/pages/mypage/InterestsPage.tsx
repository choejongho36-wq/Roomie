import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_ORIGIN, getBookmarkedPosts } from "../../api";
import type { Post } from "../../types";
import "../board/BoardListPage.css";
import "./MyPageContent.css";

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

const formatShortDate = (dateString: string) => {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}.${day}`;
};

function InterestsPage() {
  const { token } = useAuth();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    getBookmarkedPosts(token)
      .then(setPosts)
      .catch(() => setError("찜목록을 불러오지 못했습니다."));
  }, [token]);

  return (
    <div className="mypage-panel">
      <h1 className="mypage-panel-title">관심 목록</h1>
      <p className="mypage-panel-desc">찜한 게시글을 최근에 찜한 순서대로 확인할 수 있어요.</p>

      {error && <p className="mypage-error">{error}</p>}

      {posts === null && !error && <p className="board-empty">불러오는 중...</p>}

      {posts !== null && posts.length === 0 && (
        <div className="mypage-empty">
          <p>아직 찜한 게시글이 없어요.</p>
        </div>
      )}

      {posts !== null && posts.length > 0 && (
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
              {posts.map((post, index) => (
                <tr key={post.postId} className="board-table-row">
                  {/* 찜한 순서(최신순)를 기준으로 번호를 매긴다. 백엔드가 이미
                      최근에 찜한 글을 앞쪽에 두고 내려주므로 그대로 순번만 매기면 된다. */}
                  <td className="board-table-number-cell">{posts.length - index}</td>
                  <td className="board-table-title-cell">
                    <Link to={`/board/${post.postId}`}>{post.title || post.region || "제목 없음"}</Link>
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

export default InterestsPage;
