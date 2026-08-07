import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createPost, getPost, updatePost } from "../../api";
import { FREE_BOARD_CATEGORIES, SPECIAL_BOARDS } from "../../data/BoardCategories";
import "./BoardWritePage.css";

// 서버 에러 응답이 문자열이 아니라 객체({timestamp, status, error, path} 같은 스프링 기본 에러
// 포맷 등)로 올 수 있어서, 그걸 그대로 화면에 렌더링하면 "Objects are not valid as a React
// child" 에러로 페이지 전체가 하얗게 죽어버린다. 항상 안전하게 문자열로 변환한다.
const extractErrorMessage = (err: unknown): string => {
  if (!err || typeof err !== "object" || !("response" in err)) {
    return "등록에 실패했습니다.";
  }
  const response = (err as { response?: { data?: unknown; status?: number } }).response;
  const data = response?.data;

  // 401(인증 만료)은 스프링 기본 에러의 "Unauthorized" 같은 기술적 문구보다
  // 사용자가 바로 이해할 수 있는 안내를 우선 보여준다.
  if (response?.status === 401) return "로그인이 만료됐어요. 다시 로그인해주세요.";
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    const maybeMessage = (data as Record<string, unknown>).message ?? (data as Record<string, unknown>).error;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
  }
  return "등록에 실패했습니다.";
};

function BoardWritePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { postId } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(postId);

  // 특정 게시판(예: ?type=잡담, ?type=공지사항) 목록에서 "글쓰기"로 들어온 경우 그 게시판이
  // 이미 정해진 것이므로, 게시판 선택 UI 없이 해당 게시판으로 바로 등록되게 고정한다.
  // "전체" 목록(type 없음)에서 들어온 경우에만 게시판을 직접 고르게 한다.
  const presetBoardType = searchParams.get("type");
  const isPresetValid = Boolean(presetBoardType) && [...FREE_BOARD_CATEGORIES, ...SPECIAL_BOARDS].includes(presetBoardType!);

  const [selectedBoard, setSelectedBoard] = useState<string | null>(isPresetValid ? presetBoardType : null);
  const [isBoardMenuOpen, setIsBoardMenuOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");

  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, underline: false });

  const contentRef = useRef<HTMLDivElement | null>(null);
  const boardMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isEdit || !postId) return;
    getPost(Number(postId)).then((post) => {
      setTitle(post.title ?? "");
      setSelectedBoard(post.boardType ?? null);
      setTags(post.tags ? post.tags.split(",").map((t) => t.trim()).filter(Boolean) : []);
      if (contentRef.current) {
        contentRef.current.innerHTML = post.description ?? "";
      }
    });
  }, [isEdit, postId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (boardMenuRef.current && !boardMenuRef.current.contains(event.target as Node)) {
        setIsBoardMenuOpen(false);
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

  // 수정 중이면 불러온 글의 boardType, 새 글이면 선택된(혹은 URL로 넘어온) 게시판 기준으로
  // 지금 쓰고 있는 게 공지사항/이벤트 글인지 판단해서 드롭다운 목록과 안내 문구를 바꾼다.
  const isSpecialBoard = SPECIAL_BOARDS.includes(selectedBoard ?? presetBoardType ?? "");
  const boardOptions = isSpecialBoard ? SPECIAL_BOARDS : FREE_BOARD_CATEGORIES;

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

  const handleAddTag = () => {
    const value = tagInput.trim();
    if (!value) return;
    if (tags.includes(value)) {
      setTagInput("");
      return;
    }
    setTags((prev) => [...prev, value]);
    setTagInput("");
  };

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // 한글 등 IME 조합 중에 발생하는 키다운은 무시 (조합 완료용 Enter와 실제 Enter가
    // 중복으로 잡혀 마지막 글자가 별도 태그로 추가되는 문제 방지)
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;

    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      handleAddTag();
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedBoard) {
      showError("게시판을 선택해주세요.");
      return;
    }
    if (!title.trim()) {
      showError("제목을 입력해주세요.");
      return;
    }
    const contentText = contentRef.current?.textContent?.trim() ?? "";
    if (!contentText) {
      showError("내용을 입력해주세요.");
      return;
    }
    if (!token) {
      showError("로그인이 필요합니다.");
      return;
    }

    setError("");

    const request = {
      title,
      region: null,
      budgetMin: null,
      budgetMax: null,
      moveInDate: null,
      moveInMonthMin: null,
      moveInMonthMax: null,
      roomType: null,
      recruitCount: null,
      description: contentRef.current?.innerHTML ?? "",
      tags: tags.length > 0 ? tags.join(",") : null,
      boardType: selectedBoard,
    };

    try {
      const saved = isEdit ? await updatePost(token, Number(postId), request) : await createPost(token, request);
      navigate(`/board/${saved.postId}`);
    } catch (err: unknown) {
      showError(extractErrorMessage(err));
    }
  };

  return (
    <div className="page board-write-page">
      <div className="board-write-header">
        <div>
          <h1>{isSpecialBoard ? "공지/이벤트 작성" : "글쓰기"}</h1>
          <p className="board-write-subtitle">
            {isPresetValid
              ? `'${selectedBoard}' 게시판에 글을 남겨보세요.`
              : isSpecialBoard
              ? "공지사항 또는 이벤트 게시판을 선택하고 작성해주세요."
              : "게시판을 선택하고 자유롭게 글을 남겨보세요."}
          </p>
        </div>

        {isPresetValid ? (
          <span className="board-write-board-locked">{selectedBoard}</span>
        ) : (
          <div className="board-write-board-select" ref={boardMenuRef}>
            <button
              type="button"
              className={`board-write-board-button${selectedBoard ? " is-selected" : ""}`}
              onClick={() => setIsBoardMenuOpen((prev) => !prev)}
            >
              {selectedBoard ?? "게시판을 선택해주세요"}
              <span aria-hidden="true">▾</span>
            </button>
            {isBoardMenuOpen && (
              <div className="board-write-board-menu">
                {boardOptions.map((board) => (
                  <button
                    key={board}
                    type="button"
                    className={`board-write-board-option${selectedBoard === board ? " is-active" : ""}`}
                    onClick={() => {
                      setSelectedBoard(board);
                      setIsBoardMenuOpen(false);
                    }}
                  >
                    {board}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="mypage-error">{error}</p>}

      <form onSubmit={handleSubmit} className="board-write-form">
        <input
          className="board-write-title-input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="제목을 입력해주세요."
        />

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

        <div className="board-write-tags">
          <input
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="태그를 입력하고 Enter를 눌러주세요."
          />
          {tags.length > 0 && (
            <div className="board-write-tag-list">
              {tags.map((tag) => (
                <span key={tag} className="board-write-tag-chip">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)} aria-label={`${tag} 태그 삭제`}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="board-write-actions">
          <button type="submit" className="btn btn-primary">
            등록
          </button>
        </div>
      </form>
    </div>
  );
}

export default BoardWritePage;
