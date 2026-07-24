import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPosts } from "../../api";
import type { Post } from "../../types";
import "./BoardListPage.css";

function BoardListPage() {
  const [page, setPage] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    getPosts(page)
      .then((res) => {
        setPosts(res.content);
        setTotalPages(res.totalPages);
      })
      .catch(() => setError("게시글을 불러오지 못했습니다."));
  }, [page]);

  return (
    <div className="page board-list-page">
      <div className="board-list-header">
        <h1>모집 게시판</h1>
        <Link to="/board/write" className="btn btn-primary">
          글쓰기
        </Link>
      </div>

      {error && <p className="mypage-error">{error}</p>}

      {posts.length === 0 && !error && <p className="board-empty">등록된 게시글이 없어요.</p>}

      <ul className="board-list">
        {posts.map((post) => (
          <li key={post.postId} className="board-list-item">
            <Link to={`/board/${post.postId}`}>
              <div className="board-list-item-top">
                <span className="board-list-region">{post.region}</span>
                <span className={`board-status board-status-${post.status.toLowerCase()}`}>
                  {post.status === "RECRUITING" ? "모집중" : "모집완료"}
                </span>
              </div>
              <p className="board-list-desc">{post.description}</p>
              <div className="board-list-meta">
                <span>{post.nickname}</span>
                <span>{new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="board-pagination">
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            이전
          </button>
          <span>
            {page + 1} / {totalPages}
          </span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            다음
          </button>
        </div>
      )}
    </div>
  );
}

export default BoardListPage;
