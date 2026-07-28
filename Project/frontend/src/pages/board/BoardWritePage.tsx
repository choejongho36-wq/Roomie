import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
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

interface ImageItem {
  id: string;
  // 새로 첨부한 이미지는 File이 있지만, 기존 글을 수정하러 들어와서 본문에서
  // 복원한 이미지는 원본 File이 없다(이미 base64로 저장된 데이터만 있음).
  file?: File;
  previewUrl: string;
}

const INLINE_IMAGES_ROLE = "inline-images";
const MAX_IMAGE_WIDTH = 900;
const IMAGE_JPEG_QUALITY = 0.82;

// 첨부한 이미지를 캔버스로 리사이즈해서 base64 data URL로 변환한다. 백엔드에 별도
// 이미지 업로드 API가 없어서, 본문 description(HTML 텍스트) 안에 이미지를 통째로
// 심어 넣는 방식으로 저장한다. 원본 그대로 넣으면 용량이 너무 커지니 가로 폭을
// 줄이고 JPEG로 압축한다.
const resizeImageToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("이미지를 읽지 못했습니다."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_WIDTH / img.width);
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", IMAGE_JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

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
  // 이미지 리사이즈(비동기) 처리가 몇 개 남았는지. 0보다 크면 등록 버튼을 잠시 막아서,
  // 이미지가 본문에 다 심어지기 전에 제출돼버리는 문제를 방지한다.
  const [pendingImageCount, setPendingImageCount] = useState(0);
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const boardMenuRef = useRef<HTMLDivElement | null>(null);
  // 이미지 리사이즈는 비동기라서, 등록 버튼을 누르는 시점에 아직 본문에 안 심어진
  // 이미지가 있을 수 있다. 제출 전에 이 작업들이 다 끝나길 기다리기 위한 저장소.
  const pendingImageWorkRef = useRef<Promise<void>[]>([]);
  // 이미지가 리사이즈되는 도중에 사용자가 썸네일에서 그 이미지를 지워버리면,
  // 리사이즈가 끝난 뒤 뒤늦게 본문에 삽입되어 "지웠는데 다시 생기는" 문제가
  // 생길 수 있어 취소된 이미지 id를 기록해둔다.
  const cancelledImageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isEdit || !postId) return;
    getPost(Number(postId)).then((post) => {
      setTitle(post.title ?? "");
      setSelectedBoard(post.boardType ?? null);
      setTags(post.tags ? post.tags.split(",").map((t) => t.trim()).filter(Boolean) : []);
      if (contentRef.current) {
        contentRef.current.innerHTML = post.description ?? "";
        updateEmptyState();
        // 본문 안에 이미 심어져 있는 이미지들을 찾아서, 아래 썸네일 목록에도
        // 다시 보여준다. (수정 화면에 들어왔을 때 "이미지가 없어졌다"고 보이는
        // 문제 방지 — 실제로는 본문 안에 그대로 있고, 썸네일 목록만 비어있던 것)
        const existingImages = Array.from(
          contentRef.current.querySelectorAll<HTMLImageElement>(`[data-role="${INLINE_IMAGES_ROLE}"] img[data-image-id]`)
        ).map((img) => ({
          id: img.getAttribute("data-image-id") ?? img.src,
          previewUrl: img.src,
        }));
        if (existingImages.length > 0) setImages(existingImages);
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
    return () => {
      // file이 있는(=새로 첨부해서 createObjectURL로 만든) 이미지만 해제한다.
      // 수정 화면에서 본문으로부터 복원한 이미지는 data URL이라 해제 대상이 아니다.
      images.forEach((image) => {
        if (image.file) URL.revokeObjectURL(image.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // 본문(contentEditable) 맨 위에 이미지 전용 컨테이너를 하나 두고, 그 안에 이미지를
  // 순서대로 쌓는다. 이 영역은 contentEditable=false로 막아서 타이핑 중 실수로
  // 이미지 사이에 글자가 끼어들지 않게 한다.
  const ensureInlineImageContainer = (): HTMLElement | null => {
    const el = contentRef.current;
    if (!el) return null;
    let container = el.querySelector<HTMLElement>(`:scope > [data-role="${INLINE_IMAGES_ROLE}"]`);
    if (!container) {
      container = document.createElement("div");
      container.setAttribute("data-role", INLINE_IMAGES_ROLE);
      container.contentEditable = "false";
      el.insertBefore(container, el.firstChild);
    }
    return container;
  };

  // 이미지 컨테이너를 본문 안에 숨겨서 넣어두기 때문에, CSS :empty만으로는 "실제
  // 글자가 있는지"를 판단할 수 없다(:empty/:only-child는 텍스트 노드를 신경 안 써서
  // 이미지만 있고 글자가 없을 때도, 이미지+글자가 같이 있을 때도 구분이 안 됨).
  // 그래서 실제 텍스트 유무를 JS로 직접 확인해서 플레이스홀더 표시 여부를 클래스로 제어한다.
  const updateEmptyState = () => {
    const el = contentRef.current;
    if (!el) return;
    const hasText = (el.textContent ?? "").trim().length > 0;
    el.classList.toggle("is-empty", !hasText);
  };

  const insertImageIntoContent = (imageId: string, dataUrl: string) => {
    const container = ensureInlineImageContainer();
    if (!container) return;
    const img = document.createElement("img");
    img.src = dataUrl;
    img.alt = "첨부 이미지";
    img.setAttribute("data-image-id", imageId);
    container.appendChild(img);
    updateEmptyState();
  };

  const removeImageFromContent = (imageId: string) => {
    const el = contentRef.current;
    if (!el) return;
    const img = el.querySelector<HTMLImageElement>(`img[data-image-id="${imageId}"]`);
    if (!img) return;
    const container = img.parentElement;
    img.remove();
    if (container && container.getAttribute("data-role") === INLINE_IMAGES_ROLE && container.childElementCount === 0) {
      container.remove();
    }
    updateEmptyState();
  };

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const selectedFiles = Array.from(files);
    event.target.value = "";

    const newImages: ImageItem[] = selectedFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
    setPendingImageCount((count) => count + newImages.length);

    // 선택한 순서대로 본문 위쪽에 이미지가 쌓이도록 순차적으로 처리하고,
    // 등록 버튼이 이 작업을 기다릴 수 있도록 Promise를 저장해둔다.
    const work = (async () => {
      for (const image of newImages) {
        try {
          const dataUrl = await resizeImageToDataUrl(image.file as File);
          if (cancelledImageIdsRef.current.has(image.id)) {
            cancelledImageIdsRef.current.delete(image.id);
          } else {
            insertImageIntoContent(image.id, dataUrl);
          }
        } catch {
          showError("이미지를 본문에 넣지 못했어요. 다른 이미지를 시도해주세요.");
        } finally {
          setPendingImageCount((count) => Math.max(0, count - 1));
        }
      }
    })();
    pendingImageWorkRef.current.push(work);
  };

  const removeImage = (id: string) => {
    cancelledImageIdsRef.current.add(id);
    setImages((prev) => {
      const target = prev.find((image) => image.id === id);
      if (target?.file) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((image) => image.id !== id);
    });
    removeImageFromContent(id);
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

    // 이미지 리사이즈가 아직 끝나지 않았으면 본문에 이미지가 안 심어진 상태로
    // 그대로 등록될 수 있어서, 제출 전에 진행 중인 작업을 전부 기다린다.
    if (pendingImageWorkRef.current.length > 0) {
      await Promise.all(pendingImageWorkRef.current);
      pendingImageWorkRef.current = [];
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
          onInput={updateEmptyState}
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
          <button type="submit" className="btn btn-primary" disabled={pendingImageCount > 0}>
            {pendingImageCount > 0 ? "이미지 처리 중..." : "등록"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BoardWritePage;
