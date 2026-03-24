# Next.js API Route

Next.js App Router with open-guardrail in API route.

## Run

```bash
pnpm install
pnpm dev
# Test:
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello"}'
```
