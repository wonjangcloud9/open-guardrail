## Package Structure (Monorepo)

```
open-guardrail/
├── packages/
│   ├── core/           # 엔진, Pipeline, Guard IF, EventBus
│   ├── guards/         # 빌트인 가드
│   │   ├── security/
│   │   ├── privacy/
│   │   ├── content/
│   │   ├── format/
│   │   ├── ai/
│   │   └── locale/kr/
│   └── cli/            # CLI (init, validate, test)
├── presets/             # YAML 프리셋
├── docs/site/           # Nextra 문서 사이트
├── examples/            # Express, Next.js, vanilla
└── playground/          # 브라우저 데모
```

## npm Packages

```
open-guardrail          ← 올인원
@open-guardrail/core    ← 코어 엔진만
@open-guardrail/guards  ← 빌트인 가드만
@open-guardrail/cli     ← CLI
@open-guardrail/kr      ← 한국 특화
```

## Tech Stack

| Area | Choice | Reason |
|------|--------|--------|
| Language | TypeScript (strict) | 타입 안전성, DX |
| Build | tsup | ESM+CJS, 브라우저/Node/Edge |
| Monorepo | turborepo | 빌드 캐시, 병렬 |
| Package Mgr | pnpm | workspace, 디스크 효율 |
| Test | vitest | 빠름, TS 네이티브 |
| Lint | ESLint + Prettier | 표준 |
| Config Parse | yaml + zod | YAML 로드 + 스키마 검증 |
| Regex Safety | safe-regex2 | ReDoS 방지 |
| Docs | Nextra | Next.js, MDX, i18n |
| CI/CD | GitHub Actions | 자동화 |
| Playground | React + Monaco | 실시간 데모 |

## Build Targets

- Node.js ≥18 (LTS)
- Browser ES2022+
- Edge (CF Workers, Vercel Edge, Deno Deploy)

## Edge Runtime Constraints

Edge/브라우저 환경에서는 다음 제약 존재:

| 제약 | 대응 |
|------|------|
| `fs` 없음 | `fromObject()`로 설정 로드 (YAML 파일 대신 객체) |
| 실행 시간 제한 | 가드별 `timeoutMs` 자동 조정 |
| 영속 상태 없음 | `rate-limit`/`cost-guard`는 Node.js 전용 표시 |
| 번들 크기 | 트리셰이킹 지원, 필요 가드만 import |
