import { Fragment, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_ORIGIN, answerInquiry, deleteInquiry, deleteInquiryAnswer, getInquiries } from "../../api";
import { useAuth } from "../../context/AuthContext";
import type { Inquiry } from "../../types/inquiry";
import { renderRichText } from "../../utils/richText";
import Pagination from "../../components/Pagination";
import defaultAvatar from "../../assets/Roomie_logo.png";
import "../board/BoardListPage.css";
import "./InquiryListPage.css";

// 한 화면에서 스크롤 없이 다 보이도록, 목록에 한 번에 보여주는 문의 개수를 제한한다.
const PAGE_SIZE = 20;

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
  // 관리자용: 이미 등록된 답변을 보여줄지(false), 입력/수정 칸을 보여줄지(true)
  const [isEditingAnswer, setIsEditingAnswer] = useState(false);
  const [page, setPage] = useState(0);
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
        // 이미 답변이 있으면 읽기 모드로, 없으면 바로 입력 칸을 보여준다.
        setIsEditingAnswer(target?.status !== "ANSWERED");
      }
      return next;
    });
  };

  const handleAnswerSubmit = async (inquiryId: number) => {
    if (!token || !answerDraft.trim()) return;
    setIsSubmittingAnswer(true);
    try {
      const updated = await answerInquiry(token, inquiryId, answerDraft.trim());
      setAnswerDraft(updated.answer ?? "");
      setIsEditingAnswer(false);
      loadInquiries();
    } catch {
      setError("답변 등록에 실패했습니다.");
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleAnswerDelete = async (inquiryId: number) => {
    if (!token) return;
    if (!confirm("등록된 답변을 삭제할까요?")) return;
    try {
      await deleteInquiryAnswer(token, inquiryId);
      setAnswerDraft("");
      setIsEditingAnswer(true);
      loadInquiries();
    } catch {
      setError("답변 삭제에 실패했습니다.");
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

  const totalPages = Math.max(1, Math.ceil(inquiries.length / PAGE_SIZE));
  // 문의를 삭제하는 등 목록이 줄어들어 지금 페이지가 범위를 벗어나면 마지막 유효 페이지로 되돌린다.
  const safePage = Math.min(page, totalPages - 1);
  const pagedInquiries = inquiries.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

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
              {pagedInquiries.map((inquiry, index) => {
                const isOpen = openId === inquiry.inquiryId;
                const isAnswered = inquiry.status === "ANSWERED";
                const isAuthor = Boolean(user) && user!.userId === inquiry.userId;
                const displayNumber = inquiries.length - (safePage * PAGE_SIZE + index);
                return (
                  <Fragment key={inquiry.inquiryId}>
                    <tr
                      className="board-table-row"
                      onClick={() => toggle(inquiry.inquiryId)}
                      aria-expanded={isOpen}
                    >
                      <td className="board-table-number-cell">{displayNumber}</td>
                      <td>
                        <span className="inquiry-category-badge">{inquiry.category}</span>
                      </td>
                      <td className="board-table-title-cell">
                        <span>{inquiry.title}</span>
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
                          <div
                            className="inquiry-content-box"
                            dangerouslySetInnerHTML={{ __html: renderRichText(inquiry.content) }}
                          />
                          {isAnswered && !isAdmin && (
                            <div className="inquiry-answer">
                              <span className="inquiry-answer-label">답변</span>
                              <p>{inquiry.answer}</p>
                            </div>
                          )}
                          {!isAnswered && !isAdmin && (
                            <p className="inquiry-answer-pending">아직 답변이 등록되지 않았어요.</p>
                          )}
                          {isAdmin && isAnswered && !isEditingAnswer && (
                            <div className="inquiry-answer" onClick={(e) => e.stopPropagation()}>
                              <span className="inquiry-answer-label">답변 (관리자)</span>
                              <p>{inquiry.answer}</p>
                              <div className="inquiry-item-actions inquiry-item-actions-right">
                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  onClick={() => {
                                    setAnswerDraft(inquiry.answer ?? "");
                                    setIsEditingAnswer(true);
                                  }}
                                >
                                  답변 수정
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  onClick={() => handleAnswerDelete(inquiry.inquiryId)}
                                >
                                  답변 삭제
                                </button>
                              </div>
                            </div>
                          )}
                          {isAdmin && (!isAnswered || isEditingAnswer) && (
                            <div className="inquiry-answer" onClick={(e) => e.stopPropagation()}>
                              <span className="inquiry-answer-label">
                                {isAnswered ? "답변 수정 (관리자)" : "답변 작성 (관리자)"}
                              </span>
                              <textarea
                                className="inquiry-answer-textarea"
                                value={answerDraft}
                                onChange={(e) => setAnswerDraft(e.target.value)}
                                rows={4}
                                placeholder="답변을 입력해주세요."
                              />
                              <div className="inquiry-item-actions">
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  disabled={isSubmittingAnswer || !answerDraft.trim()}
                                  onClick={() => handleAnswerSubmit(inquiry.inquiryId)}
                                >
                                  {isAnswered ? "답변 수정 완료" : "답변 등록"}
                                </button>
                                {isAnswered && (
                                  <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => {
                                      setAnswerDraft(inquiry.answer ?? "");
                                      setIsEditingAnswer(false);
                                    }}
                                  >
                                    취소
                                  </button>
                                )}
                              </div>
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
          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}

export default InquiryListPage;
