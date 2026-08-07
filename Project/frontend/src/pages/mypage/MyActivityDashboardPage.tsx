import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyPosts, getMyComments, deleteComment, deletePost, API_ORIGIN } from "../../api";
import type { Post, MyComment } from "../../types/board";
import defaultAvatar from "../../assets/Roomie_logo.png";
import "./MyActivityDashboardPage.css";

const getProfileImageSrc = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(
    date.getDate()
  ).padStart(2, "0")}`;
};

type Tab = "posts" | "comments";

function MyActivityDashboardPage() {
  const { token, user } = useAuth();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [comments, setComments] = useState<MyComment[] | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("posts");
  const [selectedPostIds, setSelectedPostIds] = useState<Set<number>>(new Set());
  const [selectedCommentIds, setSelectedCommentIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!token) return;
    getMyPosts(token)
      .then(setPosts)
      .catch(() => setError("작성한 글을 불러오지 못했습니다."));
    getMyComments(token)
      .then(setComments)
      .catch(() => setError("작성한 댓글을 불러오지 못했습니다."));
  }, [token]);

  const loading = posts === null || comments === null;

  const allPostsSelected = posts !== null && posts.length > 0 && selectedPostIds.size === posts.length;

  const toggleSelectAllPosts = () => {
    if (!posts) return;
    setSelectedPostIds(allPostsSelected ? new Set() : new Set(posts.map((p) => p.postId)));
  };

  const toggleSelectPost = (postId: number) => {
    setSelectedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const handleDeleteSelectedPosts = async () => {
    if (!token || selectedPostIds.size === 0) return;
    setDeleting(true);
    setError("");
    try {
      await Promise.all([...selectedPostIds].map((id) => deletePost(token, id)));
      setPosts((prev) => (prev ? prev.filter((p) => !selectedPostIds.has(p.postId)) : prev));
      setSelectedPostIds(new Set());
    } catch {
      setError("게시글 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const allCommentsSelected = comments !== null && comments.length > 0 && selectedCommentIds.size === comments.length;

  const toggleSelectAllComments = () => {
    if (!comments) return;
    setSelectedCommentIds(allCommentsSelected ? new Set() : new Set(comments.map((c) => c.commentId)));
  };

  const toggleSelectComment = (commentId: number) => {
    setSelectedCommentIds((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const handleDeleteSelectedComments = async () => {
    if (!token || selectedCommentIds.size === 0) return;
    setDeleting(true);
    setError("");
    try {
      await Promise.all([...selectedCommentIds].map((id) => deleteComment(token, id)));
      setComments((prev) => (prev ? prev.filter((c) => !selectedCommentIds.has(c.commentId)) : prev));
      setSelectedCommentIds(new Set());
    } catch {
      setError("댓글 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mypage-panel">
      <div className="activity-header">
        <div className="activity-header-text">
          <h1 className="mypage-panel-title">내 활동</h1>
          <p className="mypage-panel-desc">내가 작성한 글과 댓글을 한눈에 확인할 수 있어요.</p>
        </div>

        <div className="activity-stats">
          <div className="activity-stat-card">
            <span className="activity-stat-number">{posts?.length ?? "-"}</span>
            <span className="activity-stat-label">작성한 글</span>
          </div>
          <div className="activity-stat-card">
            <span className="activity-stat-number">{comments?.length ?? "-"}</span>
            <span className="activity-stat-label">작성한 댓글</span>
          </div>
        </div>
      </div>

      {error && <p className="mypage-error">{error}</p>}

      <div className="activity-tabs">
        <button
          type="button"
          className={`activity-tab${tab === "posts" ? " activity-tab-active" : ""}`}
          onClick={() => setTab("posts")}
        >
          내가 쓴 글 {posts !== null && `(${posts.length})`}
        </button>
        <button
          type="button"
          className={`activity-tab${tab === "comments" ? " activity-tab-active" : ""}`}
          onClick={() => setTab("comments")}
        >
          내가 쓴 댓글 {comments !== null && `(${comments.length})`}
        </button>
      </div>

      {loading && !error && <p className="board-empty">불러오는 중...</p>}

      {!loading && tab === "posts" && (
        posts!.length === 0 ? (
          <div className="mypage-empty">
            <p>아직 작성한 글이 없어요.</p>
            <Link to="/board/write" className="activity-empty-cta">
              첫 글 작성하러 가기
            </Link>
          </div>
        ) : (
          <>
            <div className="activity-row-toolbar">
              <label className="activity-row-select-all">
                <input type="checkbox" checked={allPostsSelected} onChange={toggleSelectAllPosts} />
                전체선택
              </label>
              <button
                type="button"
                className="activity-row-delete-btn"
                onClick={handleDeleteSelectedPosts}
                disabled={selectedPostIds.size === 0 || deleting}
              >
                {deleting ? "삭제 중..." : `삭제${selectedPostIds.size > 0 ? ` (${selectedPostIds.size})` : ""}`}
              </button>
            </div>
            <div className="activity-row-list">
              {posts!.map((post) => (
                <div key={post.postId} className="activity-row-row">
                  <input
                    type="checkbox"
                    className="activity-row-checkbox"
                    checked={selectedPostIds.has(post.postId)}
                    onChange={() => toggleSelectPost(post.postId)}
                  />
                  <Link to={`/board/${post.postId}`} className="activity-row-card">
                    <span className="activity-row-date">
                      {formatDate(post.createdAt)}
                      {post.boardType ? ` · ${post.boardType}` : ""}
                    </span>
                    <p className="activity-row-content">{post.title || post.region || "제목 없음"}</p>
                    <span className="activity-row-source">
                      조회 {post.viewCount} · 북마크 {post.bookmarkCount}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </>
        )
      )}

      {!loading && tab === "comments" && (
        comments!.length === 0 ? (
          <div className="mypage-empty">
            <p>아직 작성한 댓글이 없어요.</p>
          </div>
        ) : (
          <>
            <div className="activity-row-toolbar">
              <label className="activity-row-select-all">
                <input type="checkbox" checked={allCommentsSelected} onChange={toggleSelectAllComments} />
                전체선택
              </label>
              <button
                type="button"
                className="activity-row-delete-btn"
                onClick={handleDeleteSelectedComments}
                disabled={selectedCommentIds.size === 0 || deleting}
              >
                {deleting ? "삭제 중..." : `삭제${selectedCommentIds.size > 0 ? ` (${selectedCommentIds.size})` : ""}`}
              </button>
            </div>
            <ul className="activity-comment-list">
              {comments!.map((comment) => (
                <li key={comment.commentId} className="activity-comment-item">
                  <input
                    type="checkbox"
                    className="activity-row-checkbox"
                    checked={selectedCommentIds.has(comment.commentId)}
                    onChange={() => toggleSelectComment(comment.commentId)}
                  />
                  <img
                    className="activity-comment-avatar"
                    src={getProfileImageSrc(user?.profileImageUrl) ?? defaultAvatar}
                    alt={user?.nickname ?? ""}
                  />
                  <div className="activity-comment-body">
                    <div className="activity-comment-header">
                      <span className="activity-comment-nickname">{user?.nickname}</span>
                      <span className="activity-comment-date">{new Date(comment.createdAt).toLocaleString("ko-KR")}</span>
                    </div>
                    <p className="activity-comment-content">{comment.content}</p>
                    <Link to={`/board/${comment.postId}`} className="activity-comment-source">
                      게시글: {comment.postTitle || "제목 없음"}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )
      )}
    </div>
  );
}

export default MyActivityDashboardPage;
