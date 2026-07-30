import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createPost, getPost, updatePost } from "../../api";
import RegionPicker, { type RegionToken, parseRegionToken } from "../../components/RegionPicker";
import "./BoardWritePage.css";

const BOARD_OPTIONS = ["모집게시판", "고민게시판"];

const DRAFT_STORAGE_KEY = "roomie_board_write_draft";

const BUDGET_MIN = 0;
const BUDGET_MAX = 200;
const BUDGET_STEP = 10;

const MOVE_IN_MIN = 0;
const MOVE_IN_MAX = 3;
const MOVE_IN_STEP = 1;

const formatBudgetLabel = (value: number) => (value >= BUDGET_MAX ? "200만원 이상" : `${value}만원`);

const formatMoveInLabel = (value: number) => {
  if (value <= 0) return "즉시입주";
  if (value >= MOVE_IN_MAX) return "3개월 이후";
  return `${value}개월`;
};

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

function DualRangeSlider({
  min,
  max,
  step,
  valueMin,
  valueMax,
  onChange,
  formatLabel,
}: {
  min: number;
  max: number;
  step: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  formatLabel: (value: number) => string;
}) {
  const range = max - min;
  const minPct = range === 0 ? 0 : ((valueMin - min) / range) * 100;
  const maxPct = range === 0 ? 100 : ((valueMax - min) / range) * 100;

  return (
    <div className="range-slider">
      <div className="range-slider-labels">
        <span>{formatLabel(valueMin)}</span>
        <span>{formatLabel(valueMax)}</span>
      </div>
      <div className="range-slider-track-wrap">
        <div className="range-slider-track" />
        <div className="range-slider-range" style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }} />
        <input
          type="range"
          className="range-slider-input"
          min={min}
          max={max}
          step={step}
          value={valueMin}
          onChange={(event) => {
            const next = Math.min(Number(event.target.value), valueMax - step);
            onChange(Math.max(min, next), valueMax);
          }}
        />
        <input
          type="range"
          className="range-slider-input"
          min={min}
          max={max}
          step={step}
          value={valueMax}
          onChange={(event) => {
            const next = Math.max(Number(event.target.value), valueMin + step);
            onChange(valueMin, Math.min(max, next));
          }}
        />
      </div>
    </div>
  );
}

function BoardWritePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { postId } = useParams();
  const isEdit = Boolean(postId);

  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [isBoardMenuOpen, setIsBoardMenuOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  const [regionTokens, setRegionTokens] = useState<RegionToken[]>([]);
  const region = regionTokens[0]
    ? regionTokens[0].dong
      ? `${regionTokens[0].district} ${regionTokens[0].dong}`
      : regionTokens[0].district
    : null;
  const [budgetMin, setBudgetMin] = useState(BUDGET_MIN);
  const [budgetMax, setBudgetMax] = useState(BUDGET_MAX);
  const [moveInMonthMin, setMoveInMonthMin] = useState(MOVE_IN_MIN);
  const [moveInMonthMax, setMoveInMonthMax] = useState(MOVE_IN_MAX);

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
      if (post.region) {
        const parsed = parseRegionToken(post.region);
        if (parsed) setRegionTokens([parsed]);
      }
      if (post.budgetMin !== null) setBudgetMin(post.budgetMin);
      if (post.budgetMax !== null) setBudgetMax(post.budgetMax);
      if (post.moveInMonthMin !== null) setMoveInMonthMin(post.moveInMonthMin);
      if (post.moveInMonthMax !== null) setMoveInMonthMax(post.moveInMonthMax);
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

  const getPayload = () => ({
    board: selectedBoard,
    title,
    content: contentRef.current?.innerHTML ?? "",
    tags,
  });

  const handleSaveDraft = () => {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(getPayload()));
    setError("");
    setStatusMessage("임시저장되었습니다. (이 브라우저에만 저장돼요)");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatusMessage("");

    if (!selectedBoard) {
      showError("게시판을 선택해주세요.");
      return;
    }
    if (!title.trim()) {
      showError("제목을 입력해주세요.");
      return;
    }
    const isRecruitBoard = selectedBoard === "모집게시판";
    if (isRecruitBoard && !region) {
      showError("지역을 선택해주세요.");
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
      region: isRecruitBoard ? region : null,
      budgetMin: isRecruitBoard ? budgetMin : null,
      budgetMax: isRecruitBoard ? budgetMax : null,
      moveInDate: null,
      moveInMonthMin: isRecruitBoard ? moveInMonthMin : null,
      moveInMonthMax: isRecruitBoard ? moveInMonthMax : null,
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
          <h1>글쓰기</h1>
          <p className="board-write-subtitle">게시판을 선택하고 자유롭게 글을 남겨보세요.</p>
        </div>

        <div className="board-write-board-select" ref={boardMenuRef}>
          <button
            type="button"
            className={`board-write-board-button${selectedBoard ? " is-selected" : ""}`}
            onClick={() => setIsBoardMenuOpen((prev) => !prev)}
          >
            {selectedBoard ?? "게시판을 선택하세요"}
            <span aria-hidden="true">▾</span>
          </button>
          {isBoardMenuOpen && (
            <div className="board-write-board-menu">
              {BOARD_OPTIONS.map((board) => (
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
      </div>

      {error && <p className="mypage-error">{error}</p>}
      {statusMessage && <p className="board-write-status">{statusMessage}</p>}

      <form onSubmit={handleSubmit} className="board-write-form">
        <input
          className="board-write-title-input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="제목을 입력해주세요."
        />

        {selectedBoard === "모집게시판" && (
          <div className="board-write-recruit-fields">
            <div className="board-write-field-row">
              <div className="board-write-field-label">지역</div>
              <RegionPicker
                selected={regionTokens}
                onChange={setRegionTokens}
                multiple={false}
                variant="inline"
              />
            </div>

            <div className="board-write-field-row">
              <div className="board-write-field-label">예산</div>
              <DualRangeSlider
                min={BUDGET_MIN}
                max={BUDGET_MAX}
                step={BUDGET_STEP}
                valueMin={budgetMin}
                valueMax={budgetMax}
                onChange={(next, nextMax) => {
                  setBudgetMin(next);
                  setBudgetMax(nextMax);
                }}
                formatLabel={formatBudgetLabel}
              />
            </div>

            <div className="board-write-field-row">
              <div className="board-write-field-label">입주 시기</div>
              <DualRangeSlider
                min={MOVE_IN_MIN}
                max={MOVE_IN_MAX}
                step={MOVE_IN_STEP}
                valueMin={moveInMonthMin}
                valueMax={moveInMonthMax}
                onChange={(next, nextMax) => {
                  setMoveInMonthMin(next);
                  setMoveInMonthMax(nextMax);
                }}
                formatLabel={formatMoveInLabel}
              />
            </div>
          </div>
        )}

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
          <button type="button" className="btn btn-outline" onClick={handleSaveDraft}>
            임시저장
          </button>
          <button type="submit" className="btn btn-primary">
            등록
          </button>
        </div>
      </form>
    </div>
  );
}

export default BoardWritePage;
