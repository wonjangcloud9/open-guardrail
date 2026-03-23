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
| Docs | Nextra | Next.js, MDX, i18n |
| CI/CD | GitHub Actions | 자동화 |
| Playground | React + Monaco | 실시간 데모 |

## Build Targets

- Node.js ≥18 (LTS)
- Browser ES2022+
- Edge (CF Workers, Vercel Edge, Deno Deploy)
