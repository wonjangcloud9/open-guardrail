## Examples Structure

```
examples/
├── basic-usage/           # pipe() 기본, TypeScript
│   ├── package.json
│   ├── index.ts
│   └── README.md
├── yaml-config/           # YAML 설정 기반
│   ├── package.json
│   ├── guardrail.yaml
│   ├── index.ts
│   └── README.md
├── custom-guard/          # 커스텀 가드 작성법
│   ├── package.json
│   ├── my-guard.ts
│   ├── index.ts
│   └── README.md
├── with-express/          # Express 미들웨어
│   ├── package.json
│   ├── server.ts
│   └── README.md
├── with-nextjs/           # Next.js API Route
│   ├── package.json
│   ├── app/api/chat/route.ts
│   └── README.md
└── korean-compliance/     # 한국 규제
    ├── package.json
    ├── guardrail.yaml
    ├── index.ts
    └── README.md
```

각 예제: 독립 실행, `pnpm install && pnpm start`로 동작 확인 가능.
