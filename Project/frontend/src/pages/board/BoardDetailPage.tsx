import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createComment, deleteComment, deletePost, getComments, getPost } from "../../api";
import type { Comment, Post } from "../../types";
import "./BoardDetailPage.css";

interface CommentNode extends Comment {
  replies: CommentNode[];
}

function buildTree(comments: Comment[]): CommentNode[] {
  const nodes = new Map<number, CommentNode>(comments.map((c) => [c.commentId, { ...c, replies: [] }]));
  const roots: CommentNode[] = [];
  for (const node of nodes.values()) {
    if (node.parentCommentId && nodes.has(node.parentCommentId)) {
      nodes.get(node.parentCommentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function CommentItem({
  node,
  onReply,
  onDelete,
  canDelete,
}: {
  node: CommentNode;
  onReply: (parentId: number, content: string) => void;
  onDelete: (commentId: number) => void;
  canDelete: (userId: number) => boolean;
}) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  const submitReply = () => {
    if (!replyText.trim()) return;
    onReply(node.commentId, replyText);
    setReplyText("");
    setReplying(false);
  };

  return (
    <li className="comment-item">
      <div className="comment-header">
        <span className="comment-nickname">{node.nickname}</span>
        <span className="comment-date">{new Date(node.createdAt).toLocaleString("ko-KR")}</span>
      </div>
      <p className="comment-content">{node.content}</p>
      <div className="comment-actions">
        <button onClick={() => setReplying((v) => !v)}>답글</button>
        {canDelete(node.userId) && <button onClick={() => onDelete(node.commentId)}>삭제</button>}
      </div>
      {replying && (
        <div className="comment-reply-form">
          <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="답글 작성..." />
          <button onClick={submitReply}>등록</button>
        </div>
      )}
      {node.replies.length > 0 && (
        <ul className="comment-replies">
          {node.replies.map((reply) => (
            <CommentItem key={reply.commentId} node={reply} onReply={onReply} onDelete={onDelete} canDelete={canDelete} />
          ))}
        </ul>
      )}
    </li>
  );
}

function BoardDetailPage() {
  const { postId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");

  const loadComments = () => {
    getComments(Number(postId)).then(setComments);
  };

  useEffect(() => {
    getPost(Number(postId))
      .then(setPost)
      .catch(() => setError("게시글을 찾을 수 없습니다."));
    loadComments();
  }, [postId]);

  const isAuthor = Boolean(post && user && post.userId === user.userId);

  const handleDeletePost = async () => {
    if (!token || !post) return;
    if (!confirm("게시글을 삭제할까요?")) return;
    await deletePost(token, post.postId);
    navigate("/board");
  };

  const handleAddComment = async () => {
    if (!token || !newComment.trim()) return;
    await createComment(token, Number(postId), newComment, null);
    setNewComment("");
    loadComments();
  };

  const handleReply = async (parentId: number, content: string) => {
    if (!token) return;
    await createComment(token, Number(postId), content, parentId);
    loadComments();
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!token) return;
    if (!confirm("댓글을 삭제할까요?")) return;
    await deleteComment(token, commentId);
    loadComments();
  };

  if (error) return <div className="page board-detail-page">{error}</div>;
  if (!post) return <div className="page board-detail-page">불러오는 중...</div>;

  const tree = buildTree(comments);

  return (
    <div className="page board-detail-page">
      <div className="board-detail-header">
        <span className={`board-status board-status-${post.status.toLowerCase()}`}>
          {post.status === "RECRUITING" ? "모집중" : "모집완료"}
        </span>
        <h1>{post.region}</h1>
        <div className="board-detail-meta">
          <span>{post.nickname}</span>
          <span>{new Date(post.createdAt).toLocaleString("ko-KR")}</span>
        </div>
      </div>

      <dl className="board-detail-info">
        {(post.budgetMin || post.budgetMax) && (
          <div>
            <dt>예산</dt>
            <dd>
              {post.budgetMin ?? "-"} ~ {post.budgetMax ?? "-"}만원
            </dd>
          </div>
        )}
        {post.moveInDate && (
          <div>
            <dt>입주 예정일</dt>
            <dd>{post.moveInDate}</dd>
          </div>
        )}
        {post.roomType && (
          <div>
            <dt>방 종류</dt>
            <dd>{post.roomType}</dd>
          </div>
        )}
        <div>
          <dt>모집 인원</dt>
          <dd>{post.recruitCount}명</dd>
        </div>
      </dl>

      <p className="board-detail-description">{post.description}</p>

      {isAuthor && (
        <div className="board-detail-actions">
          <Link to={`/board/edit/${post.postId}`} className="btn btn-outline">
            수정
          </Link>
          <button className="btn btn-outline" onClick={handleDeletePost}>
            삭제
          </button>
        </div>
      )}

      <section className="board-comments">
        <h2>댓글 {comments.length}</h2>

        {token ? (
          <div className="comment-write">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 남겨보세요"
            />
            <button className="btn btn-primary" onClick={handleAddComment}>
              등록
            </button>
          </div>
        ) : (
          <p className="board-comment-login">댓글을 작성하려면 로그인이 필요합니다.</p>
        )}

        <ul className="comment-list">
          {tree.map((node) => (
            <CommentItem
              key={node.commentId}
              node={node}
              onReply={handleReply}
              onDelete={handleDeleteComment}
              canDelete={(userId) => Boolean(user) && userId === user!.userId}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

export default BoardDetailPage;
