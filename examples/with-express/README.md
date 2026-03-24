# Express Middleware

Express server with open-guardrail as input middleware.

## Run

```bash
pnpm install
pnpm start
# Test:
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello"}'
```
