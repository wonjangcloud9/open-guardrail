# Agent Safety Guards

## toolCallValidator

Validate tool call arguments for type safety, injection prevention, and tool allowlists.

```typescript
toolCallValidator({
  action: 'block' | 'warn',
  allowedTools?: string[],    // tool name allowlist
  schemas?: Record<string, object>,  // JSON schemas per tool
})
```

**Detects:**
- Missing or invalid tool call arguments
- SQL injection in tool arguments
- Calls to disallowed tools
- Type mismatches against schemas

## codeSafety

Detect dangerous code patterns in LLM-generated code.

```typescript
codeSafety({ action: 'block' | 'warn' })
```

**Detects:**
- `eval()` and `Function()` calls
- Shell injection (`exec`, `spawn` with unsanitized input)
- SQL injection patterns
- Environment variable exposure (`process.env`)
