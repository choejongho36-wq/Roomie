import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createPost, getPost, updatePost } from "../../api";
import "./BoardWritePage.css";

function BoardWritePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { postId } = useParams();
  const isEdit = Boolean(postId);

  const [region, setRegion] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [roomType, setRoomType] = useState("");
  const [recruitCount, setRecruitCount] = useState("1");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    getPost(Number(postId)).then((post) => {
      setRegion(post.region);
      setBudgetMin(post.budgetMin?.toString() ?? "");
      setBudgetMax(post.budgetMax?.toString() ?? "");
      setMoveInDate(post.moveInDate ?? "");
      setRoomType(post.roomType ?? "");
      setRecruitCount(post.recruitCount.toString());
      setDescription(post.description);
    });
  }, [isEdit, postId]);

  if (!token) {
    return (
      <div className="page board-write-page">
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const request = {
      region,
      budgetMin: budgetMin ? Number(budgetMin) : null,
      budgetMax: budgetMax ? Number(budgetMax) : null,
      moveInDate: moveInDate || null,
      roomType: roomType || null,
      recruitCount: Number(recruitCount),
      description,
    };
    try {
      const saved = isEdit
        ? await updatePost(token, Number(postId), request)
        : await createPost(token, request);
      navigate(`/board/${saved.postId}`);
    } catch (err: any) {
      setError(err.response?.data ?? "저장에 실패했습니다.");
    }
  };

  return (
    <div className="page board-write-page">
      <h1>{isEdit ? "게시글 수정" : "모집글 작성"}</h1>
      {error && <p className="mypage-error">{error}</p>}
      <form onSubmit={handleSubmit} className="board-write-form">
        <label>
          지역
          <input value={region} onChange={(e) => setRegion(e.target.value)} required />
        </label>
        <div className="board-write-row">
          <label>
            최소 예산
            <input type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
          </label>
          <label>
            최대 예산
            <input type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
          </label>
        </div>
        <div className="board-write-row">
          <label>
            입주 예정일
            <input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} />
          </label>
          <label>
            방 종류
            <input value={roomType} onChange={(e) => setRoomType(e.target.value)} />
          </label>
        </div>
        <label>
          모집 인원
          <input
            type="number"
            min={1}
            value={recruitCount}
            onChange={(e) => setRecruitCount(e.target.value)}
            required
          />
        </label>
        <label>
          내용
          <textarea
            rows={8}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="btn btn-primary">
          {isEdit ? "수정하기" : "등록하기"}
        </button>
      </form>
    </div>
  );
}

export default BoardWritePage;
