# Roomie

생활 성향 설문을 기반으로 잘 맞는 룸메이트를 찾아주고, 매칭 이후에는 함께 사는 생활(청소·공과금·규칙 등)까지 관리할 수 있는 룸메이트 매칭 서비스입니다.

## 주요 기능

- **회원가입 / 로그인**: 이메일 인증, 카카오 소셜 로그인(OAuth2)
- **성향 설문 & 매칭**: 생활 패턴 설문 응답을 바탕으로 AI(Groq LLM)가 호환도를 계산해 룸메이트를 추천
- **매칭 관리**: 매칭 요청 발송/수락, 매칭된 페어(MatchedPair) 관리
- **실시간 채팅**: WebSocket 기반 1:1 채팅
- **프로필 게시판 / 커뮤니티**: 룸메이트 모집글 작성, 게시글·댓글, 북마크·신고
- **하우스 관리**: 매칭된 룸메이트끼리 청소 당번, 공과금 정산, 생활 규칙, 생활용품, 사진 앨범, 계약서 공유
- **마이페이지**: 활동 내역, 관심사, 프로필 관리
- **1:1 문의 / 알림**
- **관리자 페이지**: 운영자용 서버사이드 렌더링 대시보드(Thymeleaf)

## 기술 스택

**Frontend**
- React 19, TypeScript, Vite
- TailwindCSS, React Router

**Backend**
- Spring Boot(Java 21), Spring Security + JWT + OAuth2 Client(카카오)
- Spring Data JPA, WebSocket, Thymeleaf(관리자 페이지)
- Groq LLM API 연동(설문 매칭·추천), Spring Mail(이메일 인증)

**Infra**
- MySQL(Amazon RDS)
- Docker Compose, Nginx(리버스 프록시), AWS EC2


## 사전 준비 사항

로컬에서 `docker-compose up`으로 실행하려면 아래가 준비되어 있어야 합니다.

- **Docker / Docker Compose**
- **MySQL 접속 정보**: 직접 구축했거나 Amazon RDS 등에서 발급받은 MySQL 인스턴스 (이 프로젝트는 DB 컨테이너를 직접 띄우지 않고 외부 MySQL에 연결하는 구조)
- **카카오 개발자 앱**: [Kakao Developers](https://developers.kakao.com)에서 앱 등록 후 REST API 키(Client ID) 발급, Redirect URI 등록
- **Groq API 키**: [console.groq.com](https://console.groq.com)에서 발급 (설문 매칭·추천 기능에 사용)
- **메일 발송 계정**: Gmail 등 SMTP 계정 + 앱 비밀번호 (이메일 인증 발송용)

`Project/.env`에 아래 환경변수를 설정해야 합니다.

| `DB_URL` | MySQL 접속 URL (`jdbc:mysql://...`) | ✅ |
| `DB_USERNAME` / `DB_PASSWORD` | DB 계정 정보 | ✅ |
| `JWT_SECRET` | JWT 서명용 비밀키 | ✅ |
| `KAKAO_CLIENT_ID` | 카카오 REST API 키 | ✅ |
| `KAKAO_CLIENT_SECRET` | 카카오 클라이언트 시크릿 | (기본값 `not-used`) |
| `GROQ_API_KEY` | Groq API 키 | ✅ |
| `GROQ_MODEL` | 사용할 Groq 모델명 | (기본값 `openai/gpt-oss-20b`) |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | 이메일 발송 계정 | ✅ |
| `CORS_ALLOWED_ORIGINS` | CORS 허용 origin | (기본값 `http://localhost:5174`) |
| `FRONTEND_URL` | 프론트엔드 base URL (OAuth 리다이렉트 등에 사용) | (기본값 `http://localhost`) |
| `FRONTEND_PORT` | 프론트엔드 컨테이너 노출 포트 | 선택 (기본값 `80`) |

## 실행 방법

```bash
cd Project
# .env 파일에 위 환경변수 설정 필요
docker-compose up -d
```

- 프론트엔드: `http://localhost:5174` (기본 포트 80)
- 백엔드 API: `http://localhost/api`
