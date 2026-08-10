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

전체 아키텍처 다이어그램은 [`Project/docs/architecture.drawio`](Project/docs/architecture.drawio)에서 draw.io로 확인할 수 있습니다.

## 실행 방법

```bash
cd Project
# .env 파일에 DB, JWT, 카카오, Groq, 메일 등 환경변수 설정 필요
docker-compose up -d
```

- 프론트엔드: `http://localhost` (기본 포트 80)
- 백엔드 API: `http://localhost/api`
