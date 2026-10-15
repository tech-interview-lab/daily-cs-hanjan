# 2026-10-15 S0 데이터 기반 구현

- 시킨 것: `site/` 뼈대(Next.js, TypeScript, Vitest, dependency-cruiser), 도메인 정책 2종, DiscussionSource 포트, GitHub GraphQL 어댑터, fixture 어댑터, 본문 살균 구현
- AI 결과: 커밋 5개(뼈대, 도메인, tsconfig와 lock 보정, 어댑터, 실제 건수 대조). 테스트 31개와 실제 GitHub 대조 1개
- 내가 고친 것: 없음 (PR 리뷰 전)
- 확인 방법과 결과:
  - `npm run check` 통과: 타입 검사, 레이어 의존 검사, 테스트 31개
  - `npx next build` 성공
  - 레이어 규칙이 실제로 잡는지 확인: 위반 파일 5개(presentation→adapters, application에서 `next/cache`, 어댑터 간 참조, app에서 domain 직접 import, domain에서 `node:fs`)를 일부러 넣어 `7 dependency violations`(`next/cache` 파일 하나가 규칙 3개에 걸림) 확인 후 원복
  - 실제 GitHub 대조(`npm run test:live`, 원문): 전체 글 27, 질문 26, 전체 답변 82, 마감 댓글 제외 25, 닫힌 질문 25, 질문당 최대 제외 1, 반영 답변 57, 작성자별 합 57. 질문 번호 목록과 최상위 댓글 수는 별도 조회(`totalCount`)와 일치
  - 확인 못함: 대댓글(현재 데이터 0건)을 실제 데이터로는 검증하지 못함. fixture 테스트로만 확인. 캐시와 웹훅은 S1 이후
- 틀렸거나 아쉬웠던 점:
  - 의존 검사가 처음에는 0건을 순회했음. 타입 전용 import를 보지 않는 기본값이라서(`tsPreCompilationDeps`). "0 dependencies cruised" 출력이 이상해서 발견했고, 위반 import를 일부러 넣는 확인 전까지는 검사가 작동하는지 몰랐음
  - 살균 테스트에서 `rel="noopener noreferrer nofollow"`가 제거되는 것을 발견. 허용 속성에 `rel`이 없었음
  - npm의 선택 의존성 버그로 `package-lock.json`에서 플랫폼별 번들러 패키지가 두 번 빠짐. Vitest가 실행되지 않아 발견. 그대로 두었다면 Vercel(Linux) 빌드도 깨질 뻔함. 재생성 후 darwin, linux, win32 항목 확인
  - dependency-cruiser가 TypeScript 7을 지원하지 않아 TypeScript 6으로 고정함. TS 7에서는 `baseUrl`이 제거되고 TS 6부터는 `types`를 명시해야 함
  - `main/container` 조립과 캐시 적용은 확인할 화면이 없어 S0 범위에서 S1로 옮김(`site-structure.md` 12.2 갱신)
