---
paths:
  - "site/src/**"
---

# 사이트 레이어 의존 규칙

근거와 전체 구조는 `docs/site/site-structure.md` 4~5장을 따릅니다.

| 레이어 | 의존 허용 | 의존 금지 |
|---|---|---|
| domain | 없음 | 외부 라이브러리, 입출력, 다른 레이어 |
| application | domain | adapters, presentation, 프레임워크, 입출력 |
| adapters | application(ports), domain | presentation, 다른 어댑터 |
| presentation | application(usecases), domain | adapters |
| main | 전체 | 업무 규칙 |
| app (Next.js 라우트) | main/container, presentation/controllers | 그 외 전부 |

- 구현체 선택과 조립은 `main/container`에서만 합니다.
- `app/`의 파일은 Controller 호출과 응답 반환만 합니다. 업무 로직, 데이터 조회, 변환을 두지 않습니다.
- `next/cache` 등 Next.js 캐시 API는 `main`에서만 import합니다.
- `react`, `next/*`는 presentation, app, main에서만 import합니다. domain, application, adapters는 프레임워크를 모릅니다.
- GraphQL 토큰과 웹훅 비밀값은 서버 코드에서만 읽습니다. 클라이언트 컴포넌트(`"use client"`)에 전달하지 않습니다.
- 포트는 application이 소유하고 adapters가 구현합니다. 모든 포트에 테스트용 대체 구현을 둡니다.
- View는 ViewModel만 입력으로 받습니다. domain 객체를 View로 넘기지 않습니다.
- GraphQL 필드명은 `adapters/source` 안에서만 사용합니다.
- 규칙을 어겨야 하는 상황이면 구현하지 않고 질문합니다.
