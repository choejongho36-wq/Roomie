// 회원가입/비밀번호 변경/비밀번호 재설정에서 공통으로 쓰는 비밀번호 검증 규칙.
// 한 곳만 고치면 모든 화면에 똑같이 반영되도록 여기에 모아둔다.
export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export type PasswordRule = {
  key: string;
  label: string;
  test: (pw: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  { key: "length", label: "8자 이상 24자 이하", test: (pw) => pw.length >= 8 && pw.length <= 24 },
  { key: "letter", label: "영문 포함", test: (pw) => /[A-Za-z]/.test(pw) },
  { key: "number", label: "숫자 포함", test: (pw) => /[0-9]/.test(pw) },
  { key: "special", label: "특수문자 포함", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export const isPasswordValid = (pw: string): boolean => PASSWORD_RULES.every((rule) => rule.test(pw));
