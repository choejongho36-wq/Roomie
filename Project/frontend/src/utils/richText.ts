// 문의 게시판 글쓰기 에디터에서 쓰는 아주 가벼운 서식 표기: **굵게**, *기울임*, ++밑줄++
function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderRichText(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\+\+([^+]+)\+\+/g, "<u>$1</u>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return html;
}
