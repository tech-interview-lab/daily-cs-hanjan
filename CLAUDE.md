# CLAUDE.md

AI 코딩 에이전트가 이 저장소에서 작업할 때 따르는 규칙입니다. 규칙은 실제로 발생한 실수에서만 추가하며, 추가 사유는 커밋 메시지에 기록합니다.

## 프로젝트

CS한잔 사이트. GitHub Discussions의 질문과 답변을 카테고리, 작성자, 검색어 기준으로 탐색하는 읽기 전용 사이트입니다. 이 저장소(daily-cs-hanjan)는 질문 생성 파이프라인(n8n), 사이트 문서, 사이트 소스를 함께 담습니다.

## 문서 지도

| 알고 싶은 것 | 문서 |
|---|---|
| 질문이 매일 올라오는 방식(n8n) | `docs/pipeline/pipeline-overview.md` |
| 사이트 요구사항과 검증 기준 | `docs/site/site-spec.md` |
| 사이트 코드 구조(레이어, MVC/MVVM, 폴더) | `docs/site/site-structure.md` |
| 사이트 화면 | `docs/site/site-design.md` |
| 결정과 근거(렌더링 방식, 마감 댓글, 기술 스택) | `docs/adr/` |
| AI 활용 원칙과 기록 방식 | `docs/ai/ai-workflow.md`, `docs/ai/ai-log-guide.md` |

## 스택과 명령

- 스택: Next.js(App Router) + TypeScript, Vercel 배포. 근거와 세부 선택은 `docs/adr/0003-tech-stack.md`
- 갱신: GitHub 웹훅으로 해당 질문의 캐시만 재검증, 열린 질문 화면은 15초 폴링(`docs/adr/0001-rendering-strategy.md`)
- 테스트 Vitest, 레이어 의존 검사 dependency-cruiser
- 명령(`site/`에서 실행): `npm ci`, `npm run dev`, `npm run build`
- 점검: `npm run check`(타입, 레이어 의존, 테스트). 실제 GitHub 대조는 `GITHUB_TOKEN=$(gh auth token) npm run test:live`
- 의존성을 바꾸면 `package-lock.json`에 플랫폼별 번들러 패키지가 남았는지 확인합니다(npm 선택 의존성 버그). 빠졌으면 `node_modules`와 lock을 지우고 `npm install`

## 폴더 구조

- `site/src/`: 사이트 소스. 레이어는 domain, application, adapters, presentation, main이며 의존 규칙은 `.claude/rules/site-layer-rules.md`를 따릅니다. `site/src/app`은 Controller만 호출하는 얇은 연결 코드입니다.
- `docs/ai/logs/`: 작업별 AI 활용 기록
- `n8n/`: 질문 생성 파이프라인 백업. 작업 범위에 없으면 수정하지 않습니다.
- `.agents/`, `skills-lock.json`: 작업 범위에 없으면 수정하지 않습니다.

## 작업 방식

- 구현에 앞서 `site-spec.md`의 해당 기능 검증 기준을 확인하고, 확인 방법을 PR에 적습니다.
- 슬라이스(S0~S4) 하나만 작업합니다. 범위 밖 변경은 하지 않습니다.
- `site-spec.md`와 충돌하거나 `site-spec.md`에 없는 동작이 필요하면 구현하지 않고 질문합니다.
- 아키텍처 결정과 스펙 변경은 제안만 하고 확정하지 않습니다.
- 보고할 때 확인한 사실과 추정을 구분합니다. 실행하지 않은 확인은 "확인 못함"으로 적습니다.

## 문서 규칙

- 문서 파일명은 저장소 안에서 유일해야 합니다. 다른 폴더에도 같은 파일명을 만들지 않습니다.
- 형식은 `{영역}-{주제}.md` 소문자 kebab-case입니다. 영역은 pipeline, site, ai 중 하나이며 결정 기록은 `docs/adr/NNNN-주제.md`입니다.
- 문서를 옮기거나 이름을 바꾸면 같은 커밋에서 모든 참조를 갱신합니다.
- 사이트는 "CS한잔 사이트"로 표기합니다.

## 금지 사항

- 토큰, 비밀키, 계정 정보를 커밋하지 않습니다.
- 원본 Discussions를 수정하지 않습니다. 사이트용 토큰은 읽기 권한만 사용합니다.
- main 브랜치에 직접 푸시하거나 강제 푸시(force push)를 하지 않습니다.
- PR을 승인(approve)하거나 머지하지 않습니다. 승인과 머지는 사용자의 몫입니다.

## 데이터 규칙

- 질문 카테고리는 제목의 `[카테고리]` 접두어에서 추출합니다.
- 마감 댓글은 반영 대상에서 제외합니다. 식별 방식은 `docs/adr/0002-auto-close-marker.md`를 따릅니다.
- 작성자가 null인 답변에서도 화면이 깨지지 않아야 합니다.

## 커밋과 PR

- 커밋 메시지는 3줄 이내로 작성합니다.
- PR 본문은 `.github/pull_request_template.md`의 모든 항목을 채웁니다.
- AI를 활용한 PR은 본문 하단에 "AI 활용 내역" 섹션을 추가합니다. 형식은 `docs/ai/ai-workflow.md`를 따릅니다.
- 머지는 Rebase and merge를 사용합니다. 승인은 반드시 사용자가 직접 검토하고 판단한 뒤 진행합니다. AI는 검토 결과를 보고만 하고 승인을 대신하지 않습니다.

## 완료 조건

- 해당 슬라이스의 확인 방법이 실행되고 결과가 PR에 기록됨
- 빌드 성공 및 링크 검사 통과
- 변경 내용을 작성자가 설명할 수 있음 (설명할 수 없으면 머지하지 않음)
