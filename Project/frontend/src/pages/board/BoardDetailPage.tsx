import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_ORIGIN, createComment, deleteComment, deletePost, getComments, getPost, getPosts, reportPost, toggleBookmark, updateComment } from "../../api";
import type { Comment, Post } from "../../types/board";
import { SPECIAL_BOARDS } from "../../data/BoardCategories";
import defaultAvatar from "../../assets/Roomie_logo.png";
import "./BoardDetailPage.css";

const getProfileImageSrc = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
};

const REPORT_REASONS = [
  "혐오/차별적 표현이에요",
  "스팸 홍보/도배성 글이에요",
  "허위매물/사기가 의심돼요",
  "청소년에게 유해한 내용이에요",
  "불법정보를 포함하고 있어요",
  "음란물이에요",
  "기타 불쾌한 표현이 있어요",
];

const formatMoveInBudgetValue = (value: number | null) => {
  if (value == null) return "-";
  return value >= 200 ? "200만원 이상" : `${value}만원`;
};

const formatMoveInMonthLabel = (value: number | null) => {
  if (value == null) return "-";
  if (value <= 0) return "즉시입주";
  if (value >= 3) return "3개월 이후";
  return `${value}개월`;
};

function Avatar({
  nickname,
  profileImageUrl,
  className,
}: {
  nickname: string | null | undefined;
  profileImageUrl: string | null | undefined;
  className: string;
}) {
  return <img className={className} src={getProfileImageSrc(profileImageUrl) ?? defaultAvatar} alt={nickname ?? ""} />;
}

interface FlatReply extends Comment {
  replyToNickname: string | null;
}

interface CommentThread {
  root: Comment;
  replies: FlatReply[];
}

// 답글의 답글도 전부 같은 레벨로 펼치고, 직속 부모가 원댓글이 아니면 @닉네임 멘션만 붙인다.
function buildThreads(comments: Comment[]): CommentThread[] {
  const byId = new Map(comments.map((c) => [c.commentId, c]));
  const rootIdOf = (c: Comment): number => {
    let cur = c;
    while (cur.parentCommentId && byId.has(cur.parentCommentId)) cur = byId.get(cur.parentCommentId)!;
    return cur.commentId;
  };

  const threads = new Map<number, CommentThread>();
  const order: number[] = [];
  for (const c of comments) {
    if (!c.parentCommentId) {
      threads.set(c.commentId, { root: c, replies: [] });
      order.push(c.commentId);
    }
  }

  for (const c of comments) {
    if (!c.parentCommentId) continue;
    const thread = threads.get(rootIdOf(c));
    if (!thread) continue;
    const parent = byId.get(c.parentCommentId);
    thread.replies.push({
      ...c,
      replyToNickname: parent ? parent.nickname : null,
    });
  }

  for (const id of order) {
    threads.get(id)!.replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  return order.map((id) => threads.get(id)!);
}

function CommentActions({
  targetId,
  userId,
  content,
  deleted,
  replyingTo,
  setReplyingTo,
  onEdit,
  onDelete,
  canManage,
}: {
  targetId: number;
  userId: number;
  content: string;
  deleted: boolean;
  replyingTo: number | null;
  setReplyingTo: (id: number | null) => void;
  onEdit: (id: number, content: string) => void;
  onDelete: (commentId: number) => void;
  canManage: (userId: number) => boolean;
}) {
  return (
    <div className="comment-actions">
      <button onClick={() => setReplyingTo(replyingTo === targetId ? null : targetId)}>답글</button>
      {!deleted && canManage(userId) && (
        <>
          <button onClick={() => onEdit(targetId, content)}>수정</button>
          <button onClick={() => onDelete(targetId)}>삭제</button>
        </>
      )}
    </div>
  );
}

function CommentThreadItem({
  thread,
  onReply,
  onEdit,
  onDelete,
  canManage,
}: {
  thread: CommentThread;
  onReply: (parentId: number, content: string) => void;
  onEdit: (commentId: number, content: string) => void;
  onDelete: (commentId: number) => void;
  canManage: (userId: number) => boolean;
}) {
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const submitReply = () => {
    if (!replyText.trim() || replyingTo == null) return;
    onReply(replyingTo, replyText);
    setReplyText("");
    setReplyingTo(null);
  };

  const startEdit = (id: number, content: string) => {
    setReplyingTo(null);
    setEditingId(id);
    setEditText(content);
  };

  const submitEdit = () => {
    if (!editText.trim() || editingId == null) return;
    onEdit(editingId, editText);
    setEditingId(null);
  };

  const replyForm = (targetId: number, targetNickname: string) =>
    replyingTo === targetId && (
      <div className="comment-reply-form">
        <input
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder={`${targetNickname}에게 답글 작성...`}
        />
        <button onClick={submitReply}>등록</button>
      </div>
    );

  const content = (id: number, text: string, deleted: boolean, mention?: string | null) =>
    editingId === id ? (
      <div className="comment-reply-form">
        <input value={editText} onChange={(e) => setEditText(e.target.value)} />
        <button onClick={submitEdit}>저장</button>
        <button onClick={() => setEditingId(null)}>취소</button>
      </div>
    ) : (
      <p className={`comment-content${deleted ? " comment-content-deleted" : ""}`}>
        {!deleted && mention && <span className="comment-mention">@{mention}</span>}
        {text}
      </p>
    );

  return (
    <li className="comment-thread">
      <div className="comment-item">
        <Avatar nickname={thread.root.nickname} profileImageUrl={thread.root.profileImageUrl} className="comment-avatar" />
        <div className="comment-body">
          <div className="comment-header">
            <span className="comment-nickname">{thread.root.nickname}</span>
            <span className="comment-date">{new Date(thread.root.createdAt).toLocaleString("ko-KR")}</span>
          </div>
          {content(thread.root.commentId, thread.root.content, thread.root.deleted)}
          <CommentActions
            targetId={thread.root.commentId}
            userId={thread.root.userId}
            content={thread.root.content}
            deleted={thread.root.deleted}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            onEdit={startEdit}
            onDelete={onDelete}
            canManage={canManage}
          />
          {replyForm(thread.root.commentId, thread.root.nickname)}
        </div>
      </div>

      {thread.replies.length > 0 && (
        <ul className="comment-replies">
          {thread.replies.map((reply) => (
            <li key={reply.commentId} className="comment-item">
              <Avatar nickname={reply.nickname} profileImageUrl={reply.profileImageUrl} className="comment-avatar" />
              <div className="comment-body">
                <div className="comment-header">
                  <span className="comment-nickname">{reply.nickname}</span>
                  <span className="comment-date">{new Date(reply.createdAt).toLocaleString("ko-KR")}</span>
                </div>
                {content(reply.commentId, reply.content, reply.deleted, reply.replyToNickname)}
                <CommentActions
                  targetId={reply.commentId}
                  userId={reply.userId}
                  content={reply.content}
                  deleted={reply.deleted}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  onEdit={startEdit}
                  onDelete={onDelete}
                  canManage={canManage}
                />
                {replyForm(reply.commentId, reply.nickname)}
              </div>
            </li>
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
  const [authorRecentPosts, setAuthorRecentPosts] = useState<Post[] | null>(null);
  const [infoModal, setInfoModal] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    message: string;
    confirmLabel?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  const loadComments = () => {
    getComments(Number(postId)).then(setComments);
  };

  useEffect(() => {
    getPost(Number(postId), token)
      .then(setPost)
      .catch(() => setError("게시글을 찾을 수 없습니다."));
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  useEffect(() => {
    if (!post) return;
    let isMounted = true;

    const fetchAuthorRecentPosts = async () => {
      try {
        const first = await getPosts(0);
        let all = first.content;
        for (let page = 1; page < first.totalPages; page++) {
          const next = await getPosts(page);
          all = all.concat(next.content);
        }
        const recent = all
          .filter((p) => p.userId === post.userId && p.postId !== post.postId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3);
        if (isMounted) setAuthorRecentPosts(recent);
      } catch {
        if (isMounted) setAuthorRecentPosts([]);
      }
    };

    fetchAuthorRecentPosts();

    return () => {
      isMounted = false;
    };
  }, [post]);

  const isAuthor = Boolean(post && user && post.userId === user.userId);

  const handleToggleBookmark = async () => {
    if (!post) return;
    if (!token) {
      setInfoModal("찜하려면 로그인이 필요해요.");
      return;
    }
    if (isAuthor) {
      setInfoModal("본인이 작성한 글은 찜할 수 없어요.");
      return;
    }
    try {
      const updated = await toggleBookmark(token, post.postId);
      setPost(updated);
    } catch {
      setInfoModal("찜 처리에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  const handleDeletePost = () => {
    if (!token || !post) return;
    setConfirmModal({
      message: "게시글을 삭제할까요?",
      onConfirm: async () => {
        await deletePost(token, post.postId);
        handleGoToList();
      },
    });
  };

  const handleGoToList = () => {
    if (!post) {
      navigate("/board");
      return;
    }
    // 자유게시판 글의 boardType은 "잡담" 같은 카테고리라, 그 값을 그대로 목록 필터로
    // 쓰면 "자유 게시판" 대신 카테고리 이름이 게시판인 것처럼 나온다. 공지사항/이벤트처럼
    // 별도 게시판인 경우만 그 타입으로 돌아가고, 나머지는 자유 게시판으로 돌아간다.
    const listType = post.boardType && SPECIAL_BOARDS.includes(post.boardType) ? post.boardType : "자유 게시판";
    navigate(`/board?type=${encodeURIComponent(listType)}`);
  };

  const handleReportPost = () => {
    if (!post) return;
    if (!token) {
      setInfoModal("신고하려면 로그인이 필요해요.");
      return;
    }
    if (isAuthor) {
      setInfoModal("본인이 작성한 글은 신고할 수 없어요.");
      return;
    }
    setReportReason(null);
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
    setReportReason(null);
  };

  const submitReport = async () => {
    if (!post || !token || !reportReason) return;
    try {
      await reportPost(token, post.postId, reportReason);
      closeReportModal();
      setInfoModal("신고가 접수됐어요. 운영팀이 확인 후 조치할게요.");
    } catch (err) {
      const message =
        axios.isAxiosError(err) && typeof err.response?.data === "string"
          ? err.response.data
          : "신고 처리에 실패했어요. 잠시 후 다시 시도해주세요.";
      closeReportModal();
      setInfoModal(message);
    }
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

  const handleEditComment = async (commentId: number, content: string) => {
    if (!token) return;
    await updateComment(token, commentId, content);
    loadComments();
  };

  const handleDeleteComment = (commentId: number) => {
    if (!token) return;
    setConfirmModal({
      message: "댓글을 삭제할까요?",
      onConfirm: async () => {
        await deleteComment(token, commentId);
        loadComments();
      },
    });
  };

  if (error) return <div className="page board-detail-page">{error}</div>;
  if (!post) return <div className="page board-detail-page">불러오는 중...</div>;

  const threads = buildThreads(comments);

  return (
    <div className="page board-detail-page">
      <div className="board-detail-header">
        {post.boardType && <span className="board-detail-board-type">{post.boardType}</span>}
        {!post.boardType && (
          <span className={`board-status board-status-${post.status.toLowerCase()}`}>
            {post.status === "RECRUITING" ? "모집중" : "모집완료"}
          </span>
        )}
        <h1>{post.title || post.region || "제목 없음"}</h1>
        <div className="board-detail-profile-row">
          <Avatar nickname={post.nickname} profileImageUrl={post.authorProfileImageUrl} className="board-detail-avatar" />
          <div className="board-detail-profile-info">
            <span className="board-detail-nickname">{post.nickname}</span>
            <span className="board-detail-date">
              {new Date(post.createdAt).toLocaleString("ko-KR")} · 조회 {post.viewCount}
            </span>
          </div>
          <button
            type="button"
            className={`board-detail-bookmark-button${post.bookmarked ? " is-active" : ""}${
              isAuthor ? " is-own-post" : ""
            }`}
            onClick={handleToggleBookmark}
            title={isAuthor ? "본인이 작성한 글은 찜할 수 없어요" : undefined}
          >
            <span aria-hidden="true">{post.bookmarked ? "🧡" : "🤍"}</span>
            찜 {post.bookmarkCount}
          </button>
        </div>
        {post.tags && (
          <div className="board-detail-tags">
            {post.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
              .map((tag) => (
                <span key={tag} className="board-detail-tag">
                  #{tag}
                </span>
              ))}
          </div>
        )}
      </div>

      {(post.region ||
        post.budgetMin != null ||
        post.budgetMax != null ||
        post.moveInDate ||
        post.moveInMonthMin != null ||
        post.moveInMonthMax != null ||
        post.roomType) && (
        <dl className="board-detail-info">
          {post.region && (
            <div>
              <dt>지역</dt>
              <dd>{post.region}</dd>
            </div>
          )}
          {(post.budgetMin != null || post.budgetMax != null) && (
            <div>
              <dt>예산</dt>
              <dd>
                {formatMoveInBudgetValue(post.budgetMin)} ~ {formatMoveInBudgetValue(post.budgetMax)}
              </dd>
            </div>
          )}
          {(post.moveInMonthMin != null || post.moveInMonthMax != null) && (
            <div>
              <dt>입주 시기</dt>
              <dd>
                {formatMoveInMonthLabel(post.moveInMonthMin)} ~ {formatMoveInMonthLabel(post.moveInMonthMax)}
              </dd>
            </div>
          )}
          {post.moveInDate && !post.moveInMonthMin && !post.moveInMonthMax && (
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
          {!post.boardType && (
            <div>
              <dt>모집 인원</dt>
              <dd>{post.recruitCount}명</dd>
            </div>
          )}
        </dl>
      )}

      <div className="board-detail-description" dangerouslySetInnerHTML={{ __html: post.description }} />

      <section className="board-detail-author-posts">
        <h2>{post.nickname}님의 최근 게시글</h2>
        {authorRecentPosts === null ? (
          <p className="board-detail-author-posts-empty">불러오는 중...</p>
        ) : authorRecentPosts.length > 0 ? (
          <ul className="board-detail-author-posts-list">
            {authorRecentPosts.map((p) => (
              <li key={p.postId}>
                <Link to={`/board/${p.postId}`} className="board-detail-author-posts-link">
                  <span className="board-detail-author-posts-title">{p.title || p.region || "제목 없음"}</span>
                  <span className="board-detail-author-posts-date">
                    {new Date(p.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="board-detail-author-posts-empty">최근에 작성한 다른 게시글이 없어요.</p>
        )}
      </section>

      <div className="board-detail-actions">
        {isAuthor ? (
          <>
            <Link to={`/board/edit/${post.postId}`} className="btn btn-outline">
              수정
            </Link>
            <button className="btn btn-outline" onClick={handleDeletePost}>
              삭제
            </button>
          </>
        ) : (
          <button className="btn btn-outline" onClick={handleReportPost}>
            신고
          </button>
        )}
        <button className="btn btn-outline" onClick={handleGoToList}>
          목록
        </button>
      </div>

      <section className="board-comments">
        <h2>댓글 {comments.length}</h2>

        {token ? (
          <div className="comment-write">
            <Avatar nickname={user?.nickname} profileImageUrl={user?.profileImageUrl} className="comment-avatar" />
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
          {threads.map((thread) => (
            <CommentThreadItem
              key={thread.root.commentId}
              thread={thread}
              onReply={handleReply}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              canManage={(userId) => Boolean(user) && userId === user!.userId}
            />
          ))}
        </ul>
      </section>

      {infoModal && (
        <div className="info-modal-backdrop" onClick={() => setInfoModal(null)}>
          <div className="info-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <p>{infoModal}</p>
            <button type="button" className="btn btn-primary" onClick={() => setInfoModal(null)}>
              확인
            </button>
          </div>
        </div>
      )}

      {isReportModalOpen && (
        <div className="info-modal-backdrop" onClick={closeReportModal}>
          <div
            className="info-modal report-reason-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="report-reason-title">신고 사유를 선택해주세요</h3>
            <ul className="report-reason-list">
              {REPORT_REASONS.map((reason) => (
                <li key={reason}>
                  <label className="report-reason-option">
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason}
                      checked={reportReason === reason}
                      onChange={() => setReportReason(reason)}
                    />
                    {reason}
                  </label>
                </li>
              ))}
            </ul>
            <div className="info-modal-actions">
              <button type="button" className="btn btn-outline" onClick={closeReportModal}>
                취소
              </button>
              <button type="button" className="btn btn-primary" disabled={!reportReason} onClick={submitReport}>
                신고하기
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="info-modal-backdrop" onClick={() => setConfirmModal(null)}>
          <div className="info-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <p>{confirmModal.message}</p>
            <div className="info-modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setConfirmModal(null)}>
                취소
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  const action = confirmModal.onConfirm;
                  setConfirmModal(null);
                  await action();
                }}
              >
                {confirmModal.confirmLabel ?? "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BoardDetailPage;
