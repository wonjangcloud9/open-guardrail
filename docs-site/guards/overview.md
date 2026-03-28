# Guards Overview

open-guardrail ships with **270 built-in guards** across 10 categories — the most comprehensive guardrail library available.

Every guard follows the same pattern:

```typescript
const guard = guardName({ action: 'block', ...options });
const result = await guard.check(text, context);
```

## Categories

| Category | Guards | Description |
|----------|-------:|-------------|
| [Security](/guards/security) | 41 | Prompt injection, indirect injection, SQL/XSS/SSRF, token smuggling, semantic firewall, supply chain, model DoS |
| [Privacy](/guards/privacy) | 35 | 26 PII regions + medical PII, financial PII, data leakage, contact info |
| [Content](/guards/content) | 38 | Profanity in 13 languages, toxicity, bias (gender/age), hate speech, copyright |
| Compliance | 27 | GDPR, EU AI Act, Korean AI Basic Act, ISMS-P, PIPA, PCI DSS, SOX, FERPA, HIPAA, COPPA |
| [Format](/guards/format) | 17 | JSON schema, word count, token limit, markdown, date/number format |
| [AI Delegation](/guards/ai-delegation) | 10 | Hallucination, reasoning trace leak, persona consistency, confidence score, content watermark |
| [Agent Safety](/guards/agent-safety) | 12 | Agent loop, tool abuse, permission, recursion, RAG poisoning, multi-agent |
| Detection | 13 | Spam, deepfake, propaganda, misinformation, child safety |
| [Operational](/guards/operational) | 15 | Cost guard, rate limit, response quality, API rate guard |
| [Korean / ISMS-P](/guards/korean) | 8+ | Korean PII, profanity, resident ID, credit info, ISMS-P, PIPA, AI Basic Act |

## Common Options

All guards accept an `action` parameter:

| Action | Result |
|--------|--------|
| `'block'` | Pipeline fails, text rejected |
| `'warn'` | Pipeline passes, but flagged |
| `'mask'` | Text modified (PII guards only) |
