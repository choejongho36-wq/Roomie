import { useEffect, useState } from "react";
import type { Post } from "./types";
import { getPosts } from "./api";

function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPosts()
      .then((data) => setPosts(data))
      .catch((err) => {
        console.error(err);
        setError("게시글을 불러오는데 실패했습니다.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>로딩 중...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>게시판</h1>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {posts.map((post) => (
          <li
            key={post.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <h3 style={{ margin: 0 }}>{post.title}</h3>
            <p style={{ color: "#666" }}>{post.content}</p>
            <small style={{ color: "#999" }}>
              조회수 {post.viewCount} · {new Date(post.createdAt).toLocaleString()}
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;