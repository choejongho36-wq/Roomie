import { useParams } from "react-router-dom";
import "./HousePage.css";

// 아직 실제 하우스 기능(정산/청소관리 등)은 없고, 매칭 페어에서 넘어오는 자리만 만들어둔 페이지
function HousePage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="house-page">
      <h1>House</h1>
      <p>여기에 정산/청소관리 같은 하우스 기능이 들어갈 예정이에요.</p>
      {id && <p className="house-page-pair-id">연결된 매칭 페어 ID: {id}</p>}
    </div>
  );
}

export default HousePage;