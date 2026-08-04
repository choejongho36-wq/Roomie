import { Fragment, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_ORIGIN, answerInquiry, deleteInquiry, getInquiries } from "../../api";
import { useAuth } from "../../context/AuthContext";
import type { Inquiry } from "../../types/inquiry";
import defaultAvatar from "../../assets/Roomie_logo.png";
import "../board/BoardListPage.css";
import "./InquiryListPage.css";

const formatShortDate = (dateString: string) => {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}.${day}`;
};

const getProfileImageSrc = (url: string | null) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
};

function InquiryListPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [answerDraft, setAnswerDraft] = useState("");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const isAdmin = Boolean(user?.isAdmin);

  const loadInquiries = () => {
    if (!token) return;
    getInquiries(token)
      .then(setInquiries)
      .catch(() => setError("문의 목록을 불러오지 못했습니다."));
  };

  useEffect(() => {
    loadInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <div className="page board-list-page">
        <p className="board-empty">문의 게시판은 로그인 후 이용할 수 있어요.</p>
      </div>
    );
  }

  const toggle = (inquiryId: number) => {
    setOpenId((prev) => {
      const next = prev === inquiryId ? null : inquiryId;
      if (next !== null) {
        const target = inquiries.find((i) => i.inquiryId === next);
        setAnswerDraft(target?.answer ?? "");
      }
      return next;
    });
  };

  const handleAnswerSubmit = async (inquiryId: number) => {
    if (!token || !answerDraft.trim()) return;
    setIsSubmittingAnswer(true);
    try {
      await answerInquiry(token, inquiryId, answerDraft.trim());
      loadInquiries();
    } catch {
      setError("답변 등록에 실패했습니다.");
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleEdit = (inquiryId: number) => {
    navigate(`/inquiry/edit/${inquiryId}`);
  };

  const handleDelete = async (inquiryId: number) => {
    if (!token) return;
    if (!confirm("문의를 삭제할까요?")) return;
    await deleteInquiry(token, inquiryId);
    loadInquiries();
  };

  return (
    <div className="page board-list-page">
      <div className="board-list-header">
        <div>
          <h1>문의 게시판</h1>
          <p className="board-list-subtitle">궁금한 점을 남겨주시면 답변해드릴게요.</p>
        </div>
        <Link to="/inquiry/write" className="btn btn-primary">
          문의 하기
        </Link>
      </div>

      {error && <p className="mypage-error">{error}</p>}

      {inquiries.length === 0 && !error && <p className="board-empty">등록된 문의가 없어요.</p>}

      {inquiries.length > 0 && (
        <div className="board-table-wrap">
          <table className="board-table inquiry-table">
            <colgroup>
              <col style={{ width: 70 }} />
              <col style={{ width: 80 }} />
              <col />
              <col style={{ width: 140 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 110 }} />
            </colgroup>
            <thead>
              <tr>
                <th>번호</th>
                <th>분류</th>
                <th>제목</th>
                <th>작성자</th>
                <th>작성일</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry, index) => {
                const isOpen = openId === inquiry.inquiryId;
                const isAnswered = inquiry.status === "ANSWERED";
                const isAuthor = Boolean(user) && user!.userId === inquiry.userId;
                const isLocked = inquiry.secret && inquiry.content === null;
                return (
                  <Fragment key={inquiry.inquiryId}>
                    <tr
                      className="board-table-row"
                      onClick={() => toggle(inquiry.inquiryId)}
                      aria-expanded={isOpen}
                    >
                      <td className="board-table-number-cell">{inquiries.length - index}</td>
                      <td>
                        <span className="inquiry-category-badge">{inquiry.category}</span>
                      </td>
                      <td className="board-table-title-cell">
                        <span>
                          {inquiry.secret && <span aria-label="비밀글" title="비밀글">🔒 </span>}
                          {inquiry.title}
                        </span>
                      </td>
                      <td className="board-table-author-cell">
                        <span className="board-table-author">
                          <img
                            className="board-table-avatar"
                            src={getProfileImageSrc(inquiry.profileImageUrl) ?? defaultAvatar}
                            alt={inquiry.nickname}
                          />
                          {inquiry.nickname}
                        </span>
                      </td>
                      <td>{formatShortDate(inquiry.createdAt)}</td>
                      <td>
                        <span
                          className={`inquiry-status inquiry-status-${isAnswered ? "answered" : "pending"}`}
                        >
                          {isAnswered ? "답변완료" : "답변대기"}
                        </span>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr className="inquiry-detail-row">
                        <td colSpan={6}>
                          {isLocked ? (
                            <p className="inquiry-content-box inquiry-content-locked">
                              🔒 비밀글이에요. 작성자 본인과 관리자만 볼 수 있어요.
                            </p>
                          ) : (
                            <div
                              className="inquiry-content-box"
                              dangerouslySetInnerHTML={{ __html: inquiry.content ?? "" }}
                            />
                          )}
                          {!isLocked && isAnswered && !isAdmin && (
                            <div className="inquiry-answer">
                              <span className="inquiry-answer-label">답변</span>
                              <p>{inquiry.answer}</p>
                            </div>
                          )}
                          {!isLocked && !isAnswered && !isAdmin && (
                            <p className="inquiry-answer-pending">아직 답변이 등록되지 않았어요.</p>
                          )}
                          {isAdmin && (
                            <div className="inquiry-answer" onClick={(e) => e.stopPropagation()}>
                              <span className="inquiry-answer-label">
                                {isAnswered ? "답변 (관리자)" : "답변 작성 (관리자)"}
                              </span>
                              <textarea
                                className="inquiry-answer-textarea"
                                value={answerDraft}
                                onChange={(e) => setAnswerDraft(e.target.value)}
                                rows={4}
                                placeholder="답변을 입력해주세요."
                              />
                              <button
                                type="button"
                                className="btn btn-primary"
                                disabled={isSubmittingAnswer || !answerDraft.trim()}
                                onClick={() => handleAnswerSubmit(inquiry.inquiryId)}
                              >
                                {isAnswered ? "답변 수정" : "답변 등록"}
                              </button>
                            </div>
                          )}
                          {isAuthor && (
                            <div className="inquiry-item-actions">
                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(inquiry.inquiryId);
                                }}
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(inquiry.inquiryId);
                                }}
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default InquiryListPage;
