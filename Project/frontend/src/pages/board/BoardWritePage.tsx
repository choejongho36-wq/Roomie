import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createPost, getPost, updatePost } from "../../api";
import { SEOUL_ZONES, getDistrictsForZone } from "../../data/SeoulDistricts";
import "./BoardWritePage.css";

const BOARD_OPTIONS = ["모집게시판", "고민게시판"];

const FONT_SIZE_OPTIONS = [
  { value: "2", label: "작게" },
  { value: "3", label: "보통" },
  { value: "5", label: "크게" },
  { value: "7", label: "아주 크게" },
];

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

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

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
  const [images, setImages] = useState<ImageItem[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [budgetMin, setBudgetMin] = useState(BUDGET_MIN);
  const [budgetMax, setBudgetMax] = useState(BUDGET_MAX);
  const [moveInMonthMin, setMoveInMonthMin] = useState(MOVE_IN_MIN);
  const [moveInMonthMax, setMoveInMonthMax] = useState(MOVE_IN_MAX);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
        setRegion(post.region);
        const zone = SEOUL_ZONES.find((z) => z.districts.includes(post.region));
        if (zone) setSelectedZone(zone.zone);
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
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!token) {
    return (
      <div className="page board-write-page">
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  const applyStyle = (command: string, value?: string) => {
    contentRef.current?.focus();
    document.execCommand(command, false, value);
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

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newImages: ImageItem[] = Array.from(files).map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
    event.target.value = "";
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((image) => image.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((image) => image.id !== id);
    });
  };

  const getPayload = () => ({
    board: selectedBoard,
    title,
    content: contentRef.current?.innerHTML ?? "",
    tags,
    imageCount: images.length,
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
      setError("게시판을 선택해주세요.");
      return;
    }
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }
    const isRecruitBoard = selectedBoard === "모집게시판";
    if (isRecruitBoard && !region) {
      setError("지역을 선택해주세요.");
      return;
    }
    const contentText = contentRef.current?.textContent?.trim() ?? "";
    if (!contentText) {
      setError("내용을 입력해주세요.");
      return;
    }
    if (!token) {
      setError("로그인이 필요합니다.");
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
      // 이미지 업로드는 아직 백엔드 연동 전이라 개수만 안내합니다.
      if (images.length > 0) {
        setStatusMessage(
          `게시글이 등록됐어요. (이미지 ${images.length}장은 아직 업로드 연동 전이라 저장되지 않았어요)`
        );
      }
      navigate(`/board/${saved.postId}`);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: string } }).response?.data
          : undefined;
      setError(message ?? "등록에 실패했습니다.");
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
              <div className="board-write-region-picker">
                <div className="board-write-zone-tabs">
                  {SEOUL_ZONES.map((zone) => (
                    <button
                      key={zone.zone}
                      type="button"
                      className={`board-write-zone-tab${selectedZone === zone.zone ? " is-active" : ""}`}
                      onClick={() => setSelectedZone(zone.zone)}
                    >
                      {zone.zone}
                    </button>
                  ))}
                </div>
                <div className="board-write-district-chips">
                  {selectedZone ? (
                    getDistrictsForZone(selectedZone).map((district) => (
                      <button
                        key={district}
                        type="button"
                        className={`board-write-district-chip${region === district ? " is-selected" : ""}`}
                        onClick={() => setRegion(district)}
                      >
                        {district}
                      </button>
                    ))
                  ) : (
                    <span className="board-write-region-hint">권역을 먼저 선택해주세요.</span>
                  )}
                </div>
              </div>
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
            className="board-write-toolbar-button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyStyle("bold")}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className="board-write-toolbar-button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyStyle("italic")}
          >
            <em>I</em>
          </button>
          <button
            type="button"
            className="board-write-toolbar-button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyStyle("underline")}
          >
            <span style={{ textDecoration: "underline" }}>U</span>
          </button>
          <select
            className="board-write-toolbar-select"
            defaultValue="3"
            onMouseDown={(event) => event.preventDefault()}
            onChange={(event) => applyStyle("fontSize", event.target.value)}
          >
            {FONT_SIZE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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

        <div className="board-write-images">
          <div className="board-write-image-list">
            {images.map((image) => (
              <div key={image.id} className="board-write-image-item">
                <img src={image.previewUrl} alt="첨부 이미지 미리보기" />
                <button type="button" onClick={() => removeImage(image.id)} aria-label="이미지 삭제">
                  ×
                </button>
              </div>
            ))}
            <button type="button" className="board-write-image-add" onClick={() => fileInputRef.current?.click()}>
              + 이미지 추가
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleImageSelect} />
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
