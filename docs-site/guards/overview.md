# Guards Overview

open-guardrail ships with **36 built-in guards** across 8 categories.

Every guard follows the same pattern:

```typescript
const guard = guardName({ action: 'block', ...options });
const result = await guard.check(text, context);
```

## Categories

| Category | Guards | Description |
|----------|-------:|-------------|
| [Security](/guards/security) | 7 | Injection, keywords, regex, data leakage, code safety, encoding attack, markdown sanitize |
| [Privacy](/guards/privacy) | 1 | PII detection and masking |
| [Content](/guards/content) | 8 | Toxicity, bias, language, sentiment, copyright, URL, repetition, response quality |
| [Format](/guards/format) | 2 | Word count, JSON schema validation |
| [AI Delegation](/guards/ai-delegation) | 4 | LLM-based judging, hallucination, relevance, groundedness |
| [Operational](/guards/operational) | 4 | Cost, rate limit, data leakage, sentiment |
| [Agent Safety](/guards/agent-safety) | 2 | Tool call validation, code safety |
| [Korean / ISMS-P](/guards/korean) | 6 | Korean PII, profanity, resident ID, credit info, ISMS-P, PIPA |

## Common Options

All guards accept an `action` parameter:

| Action | Result |
|--------|--------|
| `'block'` | Pipeline fails, text rejected |
| `'warn'` | Pipeline passes, but flagged |
| `'mask'` | Text modified (PII guards only) |
