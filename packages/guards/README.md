# open-guardrail-guards

[![npm](https://img.shields.io/npm/v/open-guardrail-guards)](https://www.npmjs.com/package/open-guardrail-guards) [![CI](https://github.com/wonjangcloud9/open-guardrail/actions/workflows/ci.yaml/badge.svg)](https://github.com/wonjangcloud9/open-guardrail/actions)

30 built-in guards for [open-guardrail](https://github.com/wonjangcloud9/open-guardrail) — the open-source guardrail engine for LLM applications.

[![npm](https://img.shields.io/npm/v/open-guardrail-guards)](https://www.npmjs.com/package/open-guardrail-guards)

## Install

```bash
npm install open-guardrail-guards open-guardrail-core
```

Or use the all-in-one package: `npm install open-guardrail`

## Guards (30)

### Security
- `promptInjection` — Detect jailbreak and prompt injection attempts
- `regex` — Custom pattern matching (ReDoS safe)
- `keyword` — Deny/allow keyword lists

### Privacy
- `pii` — Detect and mask PII (email, phone, card, SSN)

### Content
- `toxicity` — Profanity, hate speech, threats, harassment
- `topicDeny` / `topicAllow` — Topic control
- `bias` — Gender, racial, religious, age bias detection
- `language` — Restrict to allowed languages

### Format
- `wordCount` — Min/max word/character limits
- `schemaGuard` — JSON schema output validation

### AI Delegation
- `llmJudge` — Delegate judgment to external LLM
- `hallucination` — Fact-check via LLM
- `relevance` / `groundedness` — RAG verification via LLM

### Operational
- `costGuard` — Token usage and cost limits
- `rateLimit` — Per-key request rate limiting
- `dataLeakage` — System prompt leak detection
- `sentiment` — Emotional tone control

### Agent Safety
- `toolCallValidator` — Tool call argument validation (email, uuid, SQL injection)
- `codeSafety` — Dangerous code pattern detection (eval, exec, rm -rf)

### Advanced
- `copyright` — Copyright notices, trademarks, verbatim reproduction
- `watermarkDetect` — AI-generated text detection
- `multiTurnContext` — Multi-turn manipulation detection

### Korea / ISMS-P / PIPA
- `piiKr` — Korean PII (주민등록번호, 여권, 면허, 사업자등록번호)
- `profanityKr` — Korean profanity (초성, 변형 포함)
- `residentId` — Resident ID checksum + masking
- `creditInfo` — Financial info protection
- `ismsP` / `pipa` — Korean compliance presets

## Usage

```typescript
import { promptInjection, pii, keyword } from 'open-guardrail-guards';
import { pipe } from 'open-guardrail-core';

const result = await pipe(
  promptInjection({ action: 'block' }),
  pii({ entities: ['email'], action: 'mask' }),
  keyword({ denied: ['hack'], action: 'block' }),
).run('user input');
```

## License

MIT
