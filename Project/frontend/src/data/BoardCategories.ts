// 자유게시판 글 작성 시 고르는 카테고리. 공지사항/이벤트는 같은 게시판 양식을
// 그대로 쓰는 별도 게시판이라, 자유게시판 목록(FREE_BOARD_CATEGORIES)에서는 제외한다.
export const FREE_BOARD_CATEGORIES = ["고민상담", "잡담", "정보공유", "생활 꿀팁"];

export const SPECIAL_BOARDS = ["공지사항", "이벤트"];

// 커뮤니티 드롭다운의 "전체"(= /board, type 파라미터 없음)는 공지사항/이벤트를 뺀
// FREE_BOARD_CATEGORIES 4개만 모아 보여주는 뷰다. 관리자 페이지(AdminController의
// ALL_BOARD_LABEL)와 동일한 이름으로, 이 스코프에 직접 고정된 글만 "전체"에서 상단 고정으로
// 노출한다(개별 게시판에만 고정된 글은 그 게시판 안에서만 보임).
export const ALL_BOARD_LABEL = "전체";
