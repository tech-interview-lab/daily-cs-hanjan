# ADR-0003 기술 스택 선택

| 항목 | 내용 |
|---|---|
| 상태 | 확정 (2026-10-15) |
| 작성일 | 2026-10-15 |
| 관련 요구사항 | FR-1~FR-4, C-3, C-5 |
| 영향 범위 | `site/` 전체, `CLAUDE.md` 스택과 명령, [site-structure.md](../site/site-structure.md) |

## 1. 맥락

렌더링 방식은 [ADR-0001](./0001-rendering-strategy.md)에서 안 B(웹훅으로 해당 질문만 재검증)로 정했습니다. 스택은 아래를 한 곳에서 처리해야 합니다.

- 웹훅 수신과 서명 검증
- 질문 단위 캐시와 재검증
- 열린 화면의 답변 목록만 다시 그리는 클라이언트 컴포넌트
- GraphQL 토큰을 서버에만 두기

## 2. 선택지

| 안 | 장점 | 단점 | 판정 |
|---|---|---|---|
| Next.js + TypeScript | 서버 렌더링, 캐시 태그 재검증, 라우트 핸들러(웹훅, 폴링 API), React 클라이언트 컴포넌트를 한 프로젝트에서 제공. Vercel 기본 지원 | 프레임워크 규칙(`app/` 라우팅, 캐시 API)이 강함 | 채택 |
| Vite + React + 별도 API 서버 | 구성 자유도 | 브라우저에서 GraphQL을 직접 부를 수 없어 API 서버가 따로 필요. 운영 대상 둘. 서버 렌더링 없음 | 기각 |
| Astro (정적 출력) | 기본 JS 0, 가벼움 | 부분 갱신과 즉시 반영을 위해 결국 서버 기능이 필요 | 기각 |

## 3. 세부 선택

| 영역 | 선택 | 근거 | 상태 |
|---|---|---|---|
| 언어 | TypeScript | 포트(인터페이스) 계약 위반을 컴파일 단계에서 발견 | 확정 |
| 프레임워크 | Next.js App Router. 버전은 S0에서 고정 | 2장 | 확정 |
| 배포 | Vercel Hobby | ADR-0001 | 확정 |
| 화면 | 서버 컴포넌트 기본. 클라이언트 컴포넌트는 테마 전환, 검색 입력, 새 답변 폴링에 한정 | JS 최소화. View는 ViewModel만 받음 | 확정(AI 제안 수락) |
| 라우팅 폴더 | `site/src/app`은 Controller만 호출하는 얇은 연결 코드 | site-structure.md의 레이어 원칙 | 확정(AI 제안 수락) |
| 캐시 | Next.js 데이터 캐시와 태그(`q-{number}`, 목록 태그). Next.js 캐시 API는 `main`에서만 사용 | 프레임워크를 최외곽에 둠 | 확정(AI 제안 수락) |
| 본문 렌더링 | GraphQL `bodyHTML`을 `sanitize-html`로 다시 살균해 출력. 검색에는 `bodyText` 사용 | GitHub와 같은 모양. 마크다운 파서 불필요. 외부 입력 경계에서 심층 방어 | 확정(AI 제안 수락) |
| 검색 | 서버에서 부분 문자열 일치. 대상은 캐시된 전체 목록 | 토큰 기반 검색은 한국어 조사(예: "캐시는")에 약함. JS 없이도 동작 | 확정(AI 제안 수락) |
| 스타일 | CSS Modules와 전역 CSS 변수(디자인 토큰) | 런타임 비용 없음. [site-design.md](../site/site-design.md) 6장 토큰을 그대로 사용 | 확정(AI 제안 수락) |
| 글꼴 | Pretendard를 `next/font/local`로 자체 호스팅 | 외부 CDN 의존 없음. 레이아웃 이동 방지 | 확정(AI 제안 수락) |
| 테스트 | Vitest | TypeScript 설정 공유 | 확정(AI 제안 수락) |
| 의존 규칙 검사 | dependency-cruiser | [site-layer-rules.md](../../.claude/rules/site-layer-rules.md)의 import 방향을 CI에서 검사 | 확정(AI 제안 수락) |
| GraphQL 토큰 | fine-grained PAT, Discussions 읽기 권한만. Vercel 환경 변수 | 서버에만 보관 | 확정(AI 제안 수락) |
| 웹훅 비밀값 | Vercel 환경 변수 | 서명 검증 | 확정(AI 제안 수락) |

## 4. 결정

| 항목 | 내용 |
|---|---|
| 결정 | Next.js + TypeScript, Vercel 배포 |
| 결정일 | 2026-10-15 |
| 결정자 | 요구사항 제공자 |
| 근거 | ADR-0001의 반영 경로(웹훅, 태그 재검증, 폴링 API)를 한 프로젝트에서 구현 가능 |
| 기각한 대안 | Vite + React + API 서버, Astro(2장) |

## 5. 결과 및 영향

- 사이트 소스는 `site/`에 둡니다. 패키지 설정은 S0에서 추가하고 설치와 실행 명령은 그때 `CLAUDE.md`에 기재합니다.
- 파일 저장소가 유지되지 않는 Vercel 환경이므로 JSON 파일 저장소(`ArchiveWriter`)는 두지 않습니다. 데이터 캐시가 저장소 역할을 합니다. 변경 내용은 site-structure.md 7~10장에 반영합니다.
- 사이트 코드는 Vercel 전용 API를 쓰지 않습니다. Node 실행 환경이면 EC2로 옮길 수 있습니다.

## 6. 위험

| 위험 | 대응 |
|---|---|
| Next.js 캐시 API 변경 | 캐시 API 사용을 `main`으로 한정. 버전 고정 후 업그레이드 시 `main`만 수정 |
| `bodyHTML` 구조 변경 | 의미 요소(코드, 표, 이미지, 링크)에만 스타일 적용. 문법 강조 클래스는 MVP에서 사용 안 함 |
| 검색 대상 증가 | 응답 시간을 기록하고 기준 초과 시 `SearchIndex` 구현만 교체 |
