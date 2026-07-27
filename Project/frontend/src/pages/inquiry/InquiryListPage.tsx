import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteInquiry, getInquiries } from "../../api";
import { useAuth } from "../../context/AuthContext";
import type { Inquiry } from "../../types";
import { renderRichText } from "../../utils/richText";
import "./InquiryListPage.css";

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
    <div className="page inquiry-list-page">
      <div className="inquiry-list-header">
        <h1>문의 게시판</h1>
      </div>

      {error && <p className="mypage-error">{error}</p>}

      {inquiries.length === 0 && !error && (
        <p className="inquiry-empty">등록된 문의가 없어요.</p>
      )}

      <ul className="inquiry-list">
        {inquiries.map((inquiry) => {
          const isOpen = openId === inquiry.inquiryId;
          const isAnswered = inquiry.status === "ANSWERED";
          const isAuthor = Boolean(user) && user!.userId === inquiry.userId;
          return (
            <li key={inquiry.inquiryId} className="inquiry-item">
              <button
                type="button"
                className="inquiry-item-header"
                onClick={() => toggle(inquiry.inquiryId)}
                aria-expanded={isOpen}
              >
                <span className={`inquiry-status inquiry-status-${isAnswered ? "answered" : "pending"}`}>
                  {isAnswered ? "답변완료" : "답변대기"}
                </span>
                <span className="inquiry-item-title">{inquiry.title}</span>
                <span className="inquiry-item-meta">
                  <span>{inquiry.nickname}</span>
                  <span>{new Date(inquiry.createdAt).toLocaleDateString("ko-KR")}</span>
                </span>
                <span className={`inquiry-arrow ${isOpen ? "inquiry-arrow-open" : ""}`}>⌄</span>
              </button>

              {isOpen && (
                <div className="inquiry-item-body">
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
                        onClick={() => handleEdit(inquiry.inquiryId)}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => handleDelete(inquiry.inquiryId)}
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="inquiry-list-footer">
        {token ? (
          <Link to="/inquiry/write" className="btn btn-primary">
            문의하기
          </Link>
        ) : (
          <Link to="/inquiry/write" className="btn btn-primary">
            로그인하고 문의하기
          </Link>
        )}
      </div>
    </div>
  );
}

export default InquiryListPage;
