// 자유게시판 글 작성 시 고르는 카테고리. 공지사항/이벤트는 같은 게시판 양식을
// 그대로 쓰는 별도 게시판이라, 자유게시판 목록(FREE_BOARD_CATEGORIES)에서는 제외한다.
export const FREE_BOARD_CATEGORIES = ["고민상담", "잡담", "정보공유", "생활 꿀팁"];

export const SPECIAL_BOARDS = ["공지사항", "이벤트"];

export const CATEGORY_OPTIONS = [...FREE_BOARD_CATEGORIES, ...SPECIAL_BOARDS];
