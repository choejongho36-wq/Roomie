import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createInquiry, getInquiry, updateInquiry } from "../../api";
import "./InquiryWritePage.css";

const FORMAT_BUTTONS = [
  { label: "B", title: "굵게", marker: "**", className: "inquiry-editor-bold" },
  { label: "I", title: "기울임", marker: "*", className: "inquiry-editor-italic" },
  { label: "U", title: "밑줄", marker: "++", className: "inquiry-editor-underline" },
];

function InquiryWritePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { inquiryId } = useParams();
  const isEdit = Boolean(inquiryId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
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
      <div className="page inquiry-write-page">
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="page inquiry-write-page">
      <h1>{isEdit ? "문의 수정" : "문의하기"}</h1>
      {error && <p className="mypage-error">{error}</p>}
      <form onSubmit={handleSubmit} className="inquiry-write-form">
        <label>
          제목
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required />
        </label>
        <label>
          내용
          <div className="inquiry-editor">
            <div className="inquiry-editor-toolbar">
              {FORMAT_BUTTONS.map((btn) => (
                <button
                  key={btn.marker}
                  type="button"
                  className={btn.className}
                  title={btn.title}
                  onClick={() => applyFormat(btn.marker)}
                >
                  {btn.label}
                </button>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={2000}
              required
            />
          </div>
        </label>
        <button type="submit" className="btn btn-primary">
          {isEdit ? "수정하기" : "등록하기"}
        </button>
      </form>
    </div>
  );
}

export default InquiryWritePage;
