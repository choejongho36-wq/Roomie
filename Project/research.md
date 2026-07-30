# Roomie 프로젝트 리서치 문서

> 작성일: 2026-07-30
> 작성 방식: 코드베이스 전수 조사 (백엔드/프론트엔드 소스, 설정 파일, 배포 스크립트, git 이력 직접 분석)
> 목적: 프로젝트 현황을 한눈에 파악하고, 신규 합류자/의사결정자가 참고할 수 있는 기술 스냅샷 제공

---

## 0. 저장소 구조에 대한 중요한 사실

작업 디렉토리(`c:\Roomie\project`)는 **git 저장소의 최상단이 아니다.** 실제 git 루트는 한 단계 위인 `C:\Roomie`이며, 구조는 다음과 같다.

```
C:\Roomie\                      ← git 루트 (origin 리모트 존재)
├── .git/
├── .github/workflows/deploy.yml   ← EC2 배포 워크플로우
├── .gitignore                     ← .env, roomie-key.pem, CLAUDE.md 등을 무시
├── README.md                      ← 팀 커밋 컨벤션 문서 (CLAUDE.md가 참조하는 파일)
├── roomie-key.pem                 ← EC2 SSH 프라이빗 키 (gitignore 처리됨, 커밋 이력 없음)
├── uploads/                       ← 로컬 업로드 파일 저장소(레포 밖)
└── Project/                       ← ★ 지금 작업 중인 "project" 폴더 (본 문서의 대상)
    ├── CLAUDE.md                  ← gitignore 처리되어 팀과 공유되지 않는 로컬 전용 파일
    ├── docker-compose.yml
    ├── .env                       ← 실제 운영 DB 자격 증명 포함 (아래 §6.1 참고)
    ├── backend/
    └── frontend/
```

- 현재 브랜치: `AKI` (원격 브랜치가 다수 존재: `main`, `AKI`, `RWH`, `young`, `Roomie_wh`, `Hyeongjun79-patch-1/2`, `fix/board-list-filter-build` 등 — 팀원별/기능별 브랜치가 혼재)
- 커밋 수: 전체 309개, 병합(Merge) 커밋이 잦은 것으로 보아 여러 명이 각자 브랜치에서 작업 후 PR로 합치는 방식으로 운영 중
- `CLAUDE.md`가 참조하는 "팀 커밋 컨벤션"은 `C:\Roomie\README.md`에 실제로 존재하며, `feat/fix/docs/style/refactor/test/chore/design/merge` 타입 접두사와 "Squash and merge" 정책을 규정하고 있음

---

## 1. 프로젝트 개요

**Roomie**는 생활 성향 기반 룸메이트 매칭 웹 서비스다. 핵심 가치 흐름은 다음과 같다.

1. 회원가입(자체 로그인 또는 카카오 소셜 로그인)
2. 20문항 생활 성향 설문 응답 (청결도, 취침시간, 흡연, 소음 민감도 등)
3. 설문 답변 벡터를 기반으로 한 **호환도 점수(0~100) 알고리즘**으로 다른 사용자와 매칭
4. AI(LLM) 기반 한 줄 성향 요약 제공
5. 매칭된 상대와 실시간 1:1 채팅
6. 부가 기능: 룸메이트 모집/자유게시판(커뮤니티), 북마크, 알림, 1:1 문의(고객센터)

## 2. 기술 스택 요약

| 영역 | 기술 |
|---|---|
| 백엔드 | Java 21, Spring Boot **4.1.0** (최신 메이저 버전), Spring Security, Spring Data JPA, Spring WebSocket, Spring OAuth2 Client |
| DB | MySQL (AWS RDS), Hibernate `ddl-auto=update` (스키마 마이그레이션 도구 없음, SQL 파일도 없음) |
| 인증 | 자체 JWT(jjwt 0.12.6, HMAC-SHA) + 카카오 OAuth2 로그인 |
| 실시간 통신 | Spring 순정 WebSocket(`/ws/chat`), STOMP/SockJS 미사용 |
| AI | Groq(OpenAI 호환) Chat Completions API — 설문 요약 한 줄 생성 |
| 프론트엔드 | React 19, TypeScript 6, Vite 8, react-router-dom v7, axios |
| 스타일링 | 컴포넌트별 순수 CSS 파일 (Tailwind/CSS-in-JS/UI 프레임워크 없음), CSS 커스텀 프로퍼티로 라이트/다크 테마 |
| 배포 | Docker Compose (backend/frontend 2개 컨테이너) + nginx 리버스 프록시, GitHub Actions → EC2 SSH 배포(`workflow_dispatch` 수동 트리거) |
| 테스트 | 백엔드: JUnit 5, 테스트 클래스 **2개**뿐. 프론트엔드: 테스트 프레임워크 **자체가 없음** |

---

## 3. 백엔드 아키텍처

### 3.1 도메인 모델의 설계 특징

`domain/` 패키지의 모든 엔티티(`User`, `Post`, `Comment`, `ChatMessage`, `Notification`, `Inquiry`, `PostBookmark`, `PostView`, `SurveyResult`)에는 **JPA 연관관계 어노테이션이 단 하나도 없다** (`@ManyToOne`, `@OneToMany` 등 전무). 모든 외래키는 순수 `Long` 컬럼이며, 서비스 계층에서 `userRepository.findAllById(...)` + `Collectors.toMap`으로 수동 조인을 수행한다.

- **장점**: N+1 문제, Hibernate 프록시/지연로딩 관련 버그를 원천 차단
- **단점**: ORM 레벨의 참조 무결성이 없고, DB 외래키 제약도 스키마 파일이 없어 확인 불가

주요 엔티티:
- **User**: `loginId/email/nickname` 각각 unique, `provider`(LOCAL/KAKAO), `tags`(콤마 구분 문자열), `nicknameChangedAt`(닉네임 변경 쿨다운용)
- **Post**: `description` 컬럼이 `MEDIUMTEXT` — 게시글 본문에 이미지를 **base64로 인라인 삽입**하기 때문에 용량을 넓혀둔 것 (§6.3 참고)
- **SurveyResult**: `answers`(JSON 문자열), `vector`(0~1 정규화 값, JSON 문자열) — 이력 다건 저장이 가능한 구조이지만 실제로는 매번 `deleteByUserId` 후 재삽입하여 **항상 1건만 유지**됨
- **PostBookmark / PostView**: `(post_id, user_id)` 복합 유니크 제약으로 중복 방지

### 3.2 인증/보안

- **로컬 로그인**: `AuthController` → `AuthService`. 비밀번호는 BCrypt 해시. 로그인 성공 시 `jwtProvider.createToken(user.getLoginId())` 호출
  - `JwtProvider`의 메서드명은 `createToken(String email)` / `getEmail(token)`이지만, 실제로 넘겨지는 값은 **loginId**다. 모든 컨트롤러가 `findByLoginId(authentication.getName())` 방식으로 일관되게 사용하고 있어 기능적 버그는 아니지만, 네이밍이 실제 동작과 어긋나 코드를 처음 보는 사람이 혼란을 겪기 쉽다.
- **JWT**: HMAC-SHA 대칭키 서명, payload에는 `sub`/`iat`/`exp`만 존재 (역할/권한 클레임 없음). 만료 24시간(`jwt.expiration-ms`, 기본값). `JwtAuthenticationFilter`가 유효한 토큰이면 **권한(authority) 없이** `UsernamePasswordAuthenticationToken`을 세팅 — 앱 전체에 역할 기반 접근 제어(RBAC)가 존재하지 않는다.
- **카카오 OAuth2**: `CustomOAuth2UserService`가 카카오 프로필을 정규화하고, `(provider, providerId)`로 기존 회원을 조회. 동일 이메일이 이미 다른 계정(로컬 또는 타 provider)에 존재하면 자동 병합하지 않고 `OAuth2AuthenticationException("email_already_exists")`를 던져 계정 탈취/혼동을 방지한다. 로그인 성공 시에도 **동일한 자체 JWT 발급 방식**을 그대로 사용해 이후 API 호출은 완전히 통합된 흐름을 탄다.
- **SecurityConfig 인가 규칙**: CSRF 비활성화, 세션은 `IF_REQUIRED`(카카오 OAuth state 저장 때문에 완전 STATELESS 불가), `anyRequest().permitAll()`이 기본값이라 명시적으로 나열되지 않은 경로는 전부 공개된다.
- **WebSocket 인증**: 브라우저 네이티브 WebSocket은 핸드셰이크에 커스텀 헤더를 못 붙이므로, JWT를 쿼리파라미터(`?token=`)로 전달하고 `ChatHandshakeInterceptor`에서 검증한다.

### 3.3 실시간 채팅

- Spring 순정 `WebSocketHandler` 기반 (`/ws/chat`), STOMP 미사용
- `ChatWebSocketHandler`는 `ConcurrentHashMap<Long userId, WebSocketSession>`으로 연결을 메모리에 보관 — 코드 주석에 `ponytail:` 태그로 **단일 인스턴스 전제**임을 명시 (수평 확장 시 Redis 등 pub/sub 필요)
- 메시지는 항상 DB에 먼저 저장된 후 발신자·수신자(접속 중이면)에게 echo. 수신자가 오프라인이면 추후 REST 이력 조회로만 확인 가능
- 알림 생성 실패가 소켓 전체를 죽이지 않도록 별도 try/catch로 격리 — "과거에 이 부분 실패가 소켓 전체를 끊어먹었다"는 주석이 남아있어 실제 장애 대응 이력으로 보임

### 3.4 매칭/호환도 알고리즘 (핵심 로직)

`CompatibilityCalculator.score(a, b)` — 두 사용자의 20문항(1~5점) 답변을 받아 0~100 점수를 산출:

1. 문항별 절대값 차이(`|a-b|`, 0~4)를 계산
2. **흡연 문항(13번)은 예외 처리**: 정도 차이를 무시하고 "흡연자(1~4)/비흡연자(5)" 이분법으로만 판정 — 경계가 다르면 무조건 최대 차이(4) 부여
3. 문항별 가중치 부여 (청결/취침시간/소음/야간생활/코골이=3, 대부분=2, 전화/벌레/야식=1, **흡연=12**로 압도적으로 높게 설정 — "흡연 여부가 갈리면 크게 벌어지도록" 의도적 설계)
4. `점수 = round((1 - Σ(가중치×차이/4) / Σ가중치) × 100)`

코드 주석에 따르면 이전에는 **코사인 유사도** 방식을 썼으나 "정반대 성향인데도 높은 점수가 나오는" 문제가 있어 가중 거리 기반으로 교체했다는 이력이 남아있다. 다만 `SurveyResult.vector`(코사인 유사도 시절의 정규화 벡터)는 여전히 계산·저장되지만 **현재 알고리즘에서는 전혀 사용되지 않는** 죽은 데이터다.

추천 피드(`CompatibilityService.recommendForUser`)는 전체 사용자에 대해 매번 즉석으로 O(n) 페어와이즈 계산 후 점수 내림차순 정렬만 하는 구조 — 캐싱/사전계산 없음, 협업 필터링이나 ML 모델은 없다. AI 요소는 오직 "설문 요약 한 줄"(`SurveySummaryService`, Groq LLM 호출)에만 쓰인다.

### 3.5 REST API 개요

| 그룹 | 대표 엔드포인트 | 인증 |
|---|---|---|
| Auth | `POST /api/auth/signup`, `/login`, `GET /check-email\|check-login-id\|check-nickname` | 공개 |
| User | `GET/PUT /api/users/me`, `.../profile-image`, `.../tags`, `.../nickname`, `.../password` | 인증 필요 |
| Survey | `POST/GET /api/surveys`, `GET /api/surveys/me/summary` | 인증 필요 |
| Recommendation | `GET /api/recommendations`, `GET /api/recommendations/{userId}/comparison` | 인증 필요 |
| Post(게시판) | `GET /api/posts`(공개), `POST/PUT/DELETE /api/posts/{id}`(인증), `.../bookmark` | 혼합 |
| Comment | `GET/POST /api/posts/{id}/comments`, `PUT/DELETE /api/comments/{id}` | 혼합 |
| Chat | `GET /api/chat/conversations`, `GET /api/chat/{userId}/messages`, WS `/ws/chat` | 인증 필요 |
| Notification | `GET /api/notifications`, `PATCH .../read` | 인증 필요 |
| Inquiry(1:1문의) | `GET /api/inquiries`(공개), `POST/PUT/DELETE`(인증) | 혼합 — §6.2 참고 |

### 3.6 예외 처리

`GlobalExceptionHandler`는 `IllegalArgumentException` 단 하나만 처리하여 400으로 응답한다. 서비스 계층 전체가 "없음/권한없음/중복" 등 모든 에러를 `IllegalArgumentException`으로 통일해서 던지기 때문에 사실상 대부분의 예상 가능한 에러는 커버되지만, 원래 404/403이어야 할 상황도 전부 400으로 내려간다. `@Valid` 검증 실패, `IllegalStateException`(Groq API 실패 등) 같은 예외는 핸들러가 없어 Spring 기본 에러 응답으로 새어나간다.

### 3.7 초기 데이터 (`DataInitializer`)

애플리케이션 기동 시마다 **무조건** 실행되는 `CommandLineRunner`가 7명의 더미 사용자(`dummy1@roomie.test` ~ `dummy7@roomie.test`, 비밀번호 `DummyPassN!`)와 각자의 20문항 설문 응답을 시딩한다. `@Profile("dev")` 같은 환경 분리가 없어 **운영 DB에도 동일하게 실행**된다 (§6.4 참고).

### 3.8 테스트 커버리지

- `BackendApplicationTests`: 컨텍스트 로딩만 확인하는 빈 테스트
- `JwtProviderTest`: 토큰 생성/검증, 변조 토큰 거부 — 단 2개 테스트
- 그 외 인증 흐름, 게시판 CRUD, WebSocket 채팅, 그리고 **가장 중요한 호환도 알고리즘(가중치, 흡연 이분법 로직)**까지 전혀 테스트가 없다.

---

## 4. 프론트엔드 아키텍처

### 4.1 전역 구조

```
BrowserRouter
 └─ AuthProvider (localStorage 기반 JWT, 로그인/로그아웃/유저 캐시)
     └─ ChatProvider (useChatSocket 훅으로 단일 WebSocket 연결 + 알림 상태 공유)
         ├─ Navbar (모든 페이지 공통)
         ├─ Routes (아래 §4.2)
         └─ Footer (모든 페이지 공통)
```

- `AuthContext`: 토큰은 `localStorage`에만 저장, 만료 검사는 클라이언트에 없음(서버가 401을 주면 각 페이지가 개별적으로 문자열 매칭해서 처리)
- `ChatContext`: WebSocket 연결과 알림 목록을 앱 전역에서 하나만 유지 (Navbar와 ChatPage가 공유)
- `api.ts`: axios를 인스턴스화하지 않고 전역 axios를 직접 사용. 인터셉터 없음 — 토큰은 각 함수 호출 시 인자로 수동 전달

### 4.2 라우트 테이블

| 경로 | 컴포넌트 | 비고 |
|---|---|---|
| `/` | MainPage | 랜딩 페이지 |
| `/signup` | SignupPage | 회원가입 |
| `/oauth2/redirect` | OAuth2RedirectPage | 카카오 로그인 콜백 처리 |
| `/complete-profile` | CompleteProfilePage | OAuth 가입 후 추가정보 입력 |
| `/survey`, `/survey/complete` | SurveyPage, SurveyCompletePage | 20문항 설문 |
| `/recommend` | RecommendationPage | 매칭 결과(상위 3명) |
| `/profiles` | ProfileBoardPage | 전체 매칭 순위 게시판 |
| `/board`, `/board/write`, `/board/edit/:id`, `/board/:id` | 커뮤니티 게시판 CRUD | |
| `/inquiry`, `/inquiry/write`, `/inquiry/edit/:id` | 1:1 문의 | |
| `/mypage/*` (레이아웃 라우트) | ProfilePage, EditProfilePage, ActivityPage, InterestsPage, ChatPage 등 | `/mypage/my-activity`, `/mypage/settings`는 미구현 플레이스홀더 |
| `/terms`, `/privacy` | 정적 약관 페이지 | |

### 4.3 주요 화면 흐름

- **설문(SurveyPage)**: `useSurvey` 훅으로 20문항 상태 관리, 숫자키(1~5)/방향키 단축키 지원, 답변 선택 280ms 후 자동으로 다음 문항 이동
- **매칭 결과(RecommendationPage/ProfileBoardPage)**: 점수 게이지 애니메이션(`requestAnimationFrame`, `prefers-reduced-motion` 대응), "상세 비교" 모달에서 상위 일치/차이 항목을 하이라이트. 두 페이지에 비교 모달 로직이 **중복 구현**되어 있어 공용 컴포넌트로 추출되지 않음
- **커뮤니티 게시판(BoardWritePage)**: `contentEditable` + `document.execCommand`(브라우저 지원 종료 예정인 Deprecated API) 기반 자체 리치텍스트 에디터. 첨부 이미지는 서버 업로드 없이 canvas로 리사이즈 후 **base64로 본문 HTML에 직접 삽입**됨
- **채팅(ChatPage)**: `useChatSocket` 단일 소켓을 `ChatContext`로 공유, 첫 메시지 전 안전 안내 문구를 파트너별로 1회만 노출(localStorage로 추적)

### 4.4 데이터/타입

`types.ts`, `types/chat.ts`, `types/survey.ts`에 백엔드 DTO에 대응하는 타입이 정의되어 있고, `data/ProfileTags.ts`(MBTI + 약 180개 관심사 태그), `data/SeoulDistricts.ts`(서울 5개 생활권역, 25개 구, 약 400개 동)가 정적 참조 데이터로 존재한다. 이 태그 목록은 백엔드 `UserController`의 `ALLOWED_TAGS`와 **수동으로 동기화**해야 하는 이중 관리 지점이다.

### 4.5 스타일링

Tailwind나 CSS-in-JS 없이 컴포넌트/페이지별 순수 CSS 파일(22개) + `index.css`의 CSS 커스텀 프로퍼티로 라이트/다크 테마를 구현. 일부 페이지는 다른 페이지의 CSS를 그대로 import해서 재사용(예: `InquiryListPage`가 `BoardListPage.css`를 사용) — 클래스명 기반의 암묵적 결합이 존재.

### 4.6 테스트

프론트엔드에는 테스트 프레임워크 자체가 `package.json`에 없다. 단위/컴포넌트 테스트가 전무하다.

---

## 5. 인프라 및 배포

- **로컬/운영 공통**: `docker-compose.yml`로 `backend`(Spring Boot, Dockerfile 멀티스테이지 빌드), `frontend`(Vite 빌드 산출물을 nginx로 서빙) 2개 컨테이너 구성
- **nginx**: `/api/`, `/oauth2/authorization/`, `/login/oauth2/`, `/uploads/`, `/ws/`를 백엔드 컨테이너로 프록시하고, 그 외 경로는 SPA(`index.html`) fallback
- **CI/CD**: `.github/workflows/deploy.yml` — `workflow_dispatch`(수동 트리거)로 GitHub Actions가 SSH로 EC2에 접속해 `git pull` + `docker compose up --build -d` 실행. 자동 트리거(push 시 배포)는 설정되어 있지 않음
- **DB**: AWS RDS(MySQL, ap-northeast-2), 스키마 마이그레이션 도구 없이 Hibernate `ddl-auto=update`에 의존

---

## 6. 발견된 이슈 및 리스크 (우선순위순)

### 6.1 🔴 (높음) 운영 DB 자격 증명이 로컬 `.env`에 평문으로 존재

`Project/.env` 파일에 실제 AWS RDS 엔드포인트, 사용자명, **평문 비밀번호**가 그대로 적혀 있다. 다행히 이 파일은 `.gitignore`에 등록되어 있고 git 이력을 전수 조사(`git log --all --full-history -- .env`)한 결과 **한 번도 커밋된 적이 없다** — 즉 저장소 자체의 유출은 아니다. 다만:
- 로컬 디스크에 평문으로 남아있는 것 자체가 위험 요소이며, 이 대화에서도 실제로 열람되었다.
- 같은 상위 폴더(`C:\Roomie`)에 EC2 SSH 프라이빗 키(`roomie-key.pem`)도 함께 존재한다(역시 gitignore 처리됨).
- **권장 조치**: 비밀번호 로테이션 검토, `.env` 파일 접근 권한 최소화, 가능하면 AWS Secrets Manager/Parameter Store 같은 시크릿 관리 도구로 이전.

### 6.2 🟠 (중간) 1:1 문의(Inquiry) 목록/상세가 인증 없이 공개됨

`SecurityConfig`에서 `GET /api/inquiries/**`가 `permitAll`로 설정되어 있어, 로그인하지 않은 누구나 전체 사용자의 문의 내용(버그 신고, 신고, 제안 등)을 열람할 수 있다. "내 문의만 보기" 필터도 없다. 고객 문의에는 민감한 내용이 담길 수 있으므로 인증 필요 + 본인 것만 조회하도록 제한을 검토할 필요가 있다. 또한 관리자가 답변(`answer`/`status`)을 등록하는 API 자체가 아직 구현되어 있지 않아, 이 기능은 "절반만 완성된" 상태다.

### 6.3 🟠 (중간) 게시글 이미지를 base64로 DB 본문에 직접 저장

프로필 이미지는 별도 업로드 API(`/api/users/me/profile-image`)와 파일 스토리지를 사용하지만, 커뮤니티 게시글 본문의 이미지는 별도 업로드 엔드포인트 없이 클라이언트에서 canvas로 리사이즈한 뒤 **base64 문자열로 HTML에 인라인 삽입**해 `MEDIUMTEXT` 컬럼에 저장한다. 게시글이 늘어날수록 DB 용량이 빠르게 증가하고, 목록 조회 시에도 불필요하게 큰 페이로드가 오갈 수 있다.

### 6.4 🟠 (중간) 더미 데이터 시딩이 프로필/환경 구분 없이 운영 DB에도 실행됨

`DataInitializer`가 `@Profile` 가드 없이 앱 기동 시마다 실행되므로, `.env` 설정을 보면 로컬 개발 시에도 실제 운영 RDS에 연결하도록 되어 있어(§6.1) 알려진 비밀번호(`DummyPassN!`)를 가진 테스트 계정 7개가 운영 DB에도 존재할 가능성이 높다. 운영 환경에서는 이 시더를 비활성화하는 것을 권장한다.

### 6.5 🟡 (낮음) 하드코딩된 기본 시크릿 값

`application.properties`에 `JWT_SECRET`, `DB_USERNAME`/`DB_PASSWORD`의 기본값이 각각 `roomie-dev-secret-key-please-replace-in-production-32bytes+`, `aki`/`1234`로 커밋되어 있다. 환경 변수가 설정되지 않으면 이 값으로 조용히 기동되며, 이를 막는 fail-fast 장치가 없다.

### 6.6 🟡 (낮음) 테스트 커버리지 부재

백엔드는 컨텍스트 로딩 테스트 + JWT 테스트 2개뿐이고, 프론트엔드는 테스트 프레임워크 자체가 없다. 특히 매칭 점수를 결정하는 `CompatibilityCalculator`(가중치, 흡연 이분법 등 매직 넘버가 많은 핵심 로직)에 대한 테스트가 전혀 없어, 향후 리팩토링 시 회귀를 감지할 방법이 없다.

### 6.7 🟡 (낮음) 코드 품질/일관성

- `JwtProvider`의 파라미터/메서드명이 "email"이지만 실제로는 loginId가 전달됨 (§3.2)
- 설문 20문항 텍스트 뱅크가 `SurveySummaryService`와 `SurveyComparisonService`에 각각 별도 record로 **중복 정의**되어 있어 문항을 수정하면 두 곳을 다 고쳐야 함
- `SurveyResult.vector`(코사인 유사도 시절의 정규화 벡터)가 계산·저장만 되고 실제 알고리즘에서는 사용되지 않는 죽은 데이터
- 프론트엔드 태그 목록(`ProfileTags.ts`)과 백엔드 `ALLOWED_TAGS`가 수동 동기화 대상
- `RecommendationPage`와 `ProfileBoardPage`에 비교 모달 로직이 중복 구현됨
- 게시글/문의 작성 페이지의 "임시저장(로컬스토리지)" 기능이 저장만 하고 다시 읽어오는 코드가 없어 사실상 죽은 기능
- 회원탈퇴 버튼이 `alert("준비 중인 기능이에요.")`로만 연결된 미구현 스텁
- `backend/package-lock.json`이 빈 내용으로 존재(Java 프로젝트 루트에 npm 명령을 잘못 실행한 흔적으로 보임) — 삭제해도 무방해 보임

---

## 7. 요약

Roomie는 Spring Boot 4 + React 19라는 최신 스택으로 구성된, 기능적으로는 상당히 완성도 높은 룸메이트 매칭 서비스다. 특히 **흡연 여부를 이분법으로 처리하고 가중치를 극단적으로 높인 호환도 알고리즘**과, **base64 인라인 이미지 / WebSocket 실시간 채팅 / 카카오 소셜 로그인** 등 실사용을 고려한 디테일이 많다. 다만 팀 프로젝트 초기~중기 단계에 흔히 나타나는 특징들 — 테스트 부재, 환경별 설정 분리 없음, 시크릿 하드코딩, 일부 기능의 절반만 구현(문의 답변, 임시저장, 회원탈퇴) — 이 두드러지며, §6의 항목들은 프로덕션 운영을 앞두고 우선적으로 검토할 가치가 있다.
