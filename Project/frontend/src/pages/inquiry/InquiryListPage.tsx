import { Fragment, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_ORIGIN, deleteInquiry, getInquiries } from "../../api";
import { useAuth } from "../../context/AuthContext";
import type { Inquiry } from "../../types";
import { renderRichText } from "../../utils/richText";
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

  const loadInquiries = () => {
    getInquiries()
      .then(setInquiries)
      .catch(() => setError("문의 목록을 불러오지 못했습니다."));
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const toggle = (inquiryId: number) => {
    setOpenId((prev) => (prev === inquiryId ? null : inquiryId));
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
      <div className="board-floating-menu">
        <Link to="/inquiry" className="board-floating-menu-button">
          문의
        </Link>
        <Link to="/mypage/interests" className="board-floating-menu-button">
          찜목록
        </Link>
        <Link to="/mypage/chat" className="board-floating-menu-button">
          채팅목록
        </Link>
      </div>

      <div className="board-list-header">
        <div>
          <h1>문의 게시판</h1>
          <p className="board-list-subtitle">궁금한 점을 남겨주시면 답변해드릴게요.</p>
        </div>
        <Link to="/inquiry/write" className="btn btn-primary">
          문의하기
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
                          {isAnswered ? (
                            <div className="inquiry-answer">
                              <span className="inquiry-answer-label">답변</span>
                              <p>{inquiry.answer}</p>
                            </div>
                          ) : (
                            <p className="inquiry-answer-pending">아직 답변이 등록되지 않았어요.</p>
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
