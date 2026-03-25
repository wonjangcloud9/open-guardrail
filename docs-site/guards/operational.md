# Operational Guards

## costGuard

Limit token usage and estimated cost.

```typescript
costGuard({
  action: 'block' | 'warn',
  maxTokens?: number,
  maxCostUsd?: number,
})
```

## rateLimit

Per-key request rate limiting.

```typescript
rateLimit({
  action: 'block',
  maxRequests: number,
  windowMs: number,
})
```
