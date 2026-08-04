import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createInquiry, getInquiry, updateInquiry } from "../../api";
import "../board/BoardWritePage.css";

const CATEGORY_OPTIONS = ["버그", "신고", "문의", "제안"];

function InquiryWritePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { inquiryId } = useParams();
  const isEdit = Boolean(inquiryId);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);

  const presetCategory = (location.state as { category?: string } | null)?.category ?? null;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(presetCategory);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [error, setError] = useState("");

  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, underline: false });

  useEffect(() => {
    if (!isEdit || !token) return;
    getInquiry(token, Number(inquiryId)).then((inquiry) => {
      setTitle(inquiry.title);
      setSelectedCategory(inquiry.category ?? null);
      setIsSecret(inquiry.secret);
      if (contentRef.current) {
        contentRef.current.innerHTML = inquiry.content ?? "";
      }
    });
  }, [isEdit, inquiryId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // 브라우저에 따라 execCommand의 볼드/이탤릭/밑줄 토글이 인라인 span과 <b>/<i>/<u> 태그를
    // 섞어 쓰면서 꼬이는 경우가 있어, 항상 시맨틱 태그만 쓰도록 강제한다.
    document.execCommand("styleWithCSS", false, false as unknown as string);

    const syncActiveFormats = () => {
      if (!contentRef.current) return;
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      if (!contentRef.current.contains(selection.anchorNode)) return;
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
      });
    };

    document.addEventListener("selectionchange", syncActiveFormats);
    return () => document.removeEventListener("selectionchange", syncActiveFormats);
  }, []);

  if (!token) {
    return (
      <div className="page board-write-page">
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  const showError = (message: string) => {
    setError(message);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const applyStyle = (command: string, value?: string) => {
    contentRef.current?.focus();
    document.execCommand(command, false, value);
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategory) {
      showError("분류를 선택해주세요.");
      return;
    }

    const content = contentRef.current?.innerHTML ?? "";
    setError("");
    try {
      if (isEdit) {
        await updateInquiry(token, Number(inquiryId), { title, category: selectedCategory, content, secret: isSecret });
      } else {
        await createInquiry(token, { title, category: selectedCategory, content, secret: isSecret });
      }
      navigate("/inquiry");
    } catch (err: any) {
      showError(err.response?.data ?? "저장에 실패했습니다.");
    }
  };

  return (
    <div className="page board-write-page">
      <div className="board-write-header">
        <div>
          <h1>{isEdit ? "문의 수정" : "문의 하기"}</h1>
          <p className="board-write-subtitle">궁금한 점을 자유롭게 남겨주세요.</p>
        </div>

        <div className="board-write-board-select" ref={categoryMenuRef}>
          <button
            type="button"
            className={`board-write-board-button${selectedCategory ? " is-selected" : ""}`}
            onClick={() => setIsCategoryMenuOpen((prev) => !prev)}
          >
            {selectedCategory ?? "분류를 선택하세요"}
            <span aria-hidden="true">▾</span>
          </button>
          {isCategoryMenuOpen && (
            <div className="board-write-board-menu">
              {CATEGORY_OPTIONS.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`board-write-board-option${selectedCategory === category ? " is-active" : ""}`}
                  onClick={() => {
                    setSelectedCategory(category);
                    setIsCategoryMenuOpen(false);
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && <p className="mypage-error">{error}</p>}

      <form onSubmit={handleSubmit} className="board-write-form">
        <input
          className="board-write-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력해주세요."
          maxLength={100}
          required
        />

        <label className="inquiry-secret-checkbox">
          <input type="checkbox" checked={isSecret} onChange={(e) => setIsSecret(e.target.checked)} />
          비밀글로 작성 (작성자 본인과 관리자만 내용을 볼 수 있어요)
        </label>

        <div className="board-write-toolbar">
          <button
            type="button"
            className={`board-write-toolbar-button${activeFormats.bold ? " is-active" : ""}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyStyle("bold")}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className={`board-write-toolbar-button${activeFormats.italic ? " is-active" : ""}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyStyle("italic")}
          >
            <em>I</em>
          </button>
          <button
            type="button"
            className={`board-write-toolbar-button${activeFormats.underline ? " is-active" : ""}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyStyle("underline")}
          >
            <span style={{ textDecoration: "underline" }}>U</span>
          </button>
        </div>

        <div
          ref={contentRef}
          className="board-write-content"
          contentEditable
          data-placeholder="내용을 입력해주세요."
          suppressContentEditableWarning
        />

        <div className="board-write-actions">
          <button type="submit" className="btn btn-primary">
            등록
          </button>
        </div>
      </form>
    </div>
  );
}

export default InquiryWritePage;
