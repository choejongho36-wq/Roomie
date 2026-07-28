import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createInquiry, getInquiry, updateInquiry } from "../../api";
import "../board/BoardWritePage.css";

const DRAFT_STORAGE_KEY = "roomie_inquiry_write_draft";

const FORMAT_BUTTONS = [
  { label: <strong>B</strong>, title: "굵게", marker: "**" },
  { label: <em>I</em>, title: "기울임", marker: "*" },
  { label: <span style={{ textDecoration: "underline" }}>U</span>, title: "밑줄", marker: "++" },
];

function InquiryWritePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { inquiryId } = useParams();
  const isEdit = Boolean(inquiryId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    getInquiry(Number(inquiryId)).then((inquiry) => {
      setTitle(inquiry.title);
      setContent(inquiry.content);
    });
  }, [isEdit, inquiryId]);

  if (!token) {
    return (
      <div className="page board-write-page">
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  const applyFormat = (marker: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end);
    const next = content.slice(0, start) + marker + selected + marker + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + marker.length;
      el.setSelectionRange(cursor, cursor + selected.length);
    });
  };

  const handleSaveDraft = () => {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ title, content }));
    setError("");
    setStatusMessage("임시저장되었습니다. (이 브라우저에만 저장돼요)");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage("");
    setError("");
    try {
      if (isEdit) {
        await updateInquiry(token, Number(inquiryId), { title, content });
      } else {
        await createInquiry(token, { title, content });
      }
      navigate("/inquiry");
    } catch (err: any) {
      setError(err.response?.data ?? "저장에 실패했습니다.");
    }
  };

  return (
    <div className="page board-write-page">
      <div className="board-write-header">
        <div>
          <h1>{isEdit ? "문의 수정" : "문의하기"}</h1>
          <p className="board-write-subtitle">궁금한 점을 자유롭게 남겨주세요.</p>
        </div>
      </div>

      {error && <p className="mypage-error">{error}</p>}
      {statusMessage && <p className="board-write-status">{statusMessage}</p>}

      <form onSubmit={handleSubmit} className="board-write-form">
        <input
          className="board-write-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력해주세요."
          maxLength={100}
          required
        />

        <div className="board-write-toolbar">
          {FORMAT_BUTTONS.map((btn) => (
            <button
              key={btn.marker}
              type="button"
              className="board-write-toolbar-button"
              title={btn.title}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyFormat(btn.marker)}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          className="board-write-content"
          rows={10}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력해주세요."
          maxLength={2000}
          required
        />

        <div className="board-write-actions">
          <button type="button" className="btn btn-outline" onClick={handleSaveDraft}>
            임시저장
          </button>
          <button type="submit" className="btn btn-primary">
            {isEdit ? "수정하기" : "등록하기"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default InquiryWritePage;
