<p align="center">
  <h1 align="center">open-guardrail</h1>
  <p align="center"><strong>Guardrail engine for LLM apps. 171 guards. Zero API calls. <0.1ms.</strong></p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/open-guardrail"><img src="https://img.shields.io/npm/v/open-guardrail" alt="npm"></a>
  <a href="https://pypi.org/project/open-guardrail/"><img src="https://img.shields.io/pypi/v/open-guardrail" alt="PyPI"></a>
  <a href="https://github.com/wonjangcloud9/open-guardrail/actions"><img src="https://github.com/wonjangcloud9/open-guardrail/actions/workflows/ci.yaml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/wonjangcloud9/open-guardrail" alt="License"></a>
  <img src="https://img.shields.io/badge/guards-171-blue" alt="guards">
  <img src="https://img.shields.io/badge/PII_regions-26-orange" alt="PII">
</p>

<p align="center">
  <a href="./README.ko.md">한국어</a> &middot;
  <a href="https://wonjangcloud9.github.io/open-guardrail/">Documentation</a> &middot;
  <a href="https://wonjangcloud9.github.io/open-guardrail/ko/">한국어 가이드</a>
</p>

---

**3 lines to protect your LLM:**

```typescript
import { pipe, promptInjection, pii } from 'open-guardrail';

const result = await pipe(promptInjection(), pii({ action: 'mask' })).run(userInput);
// Injection blocked. PII masked. Done.
```

```python
from open_guardrail import pipe, prompt_injection, pii

result = pipe(prompt_injection(), pii(action="mask")).run(user_input)
```

---

## Install

```bash
npm install open-guardrail    # TypeScript / JavaScript
pip install open-guardrail    # Python
```

## Why open-guardrail?

|  | open-guardrail | Guardrails AI | NeMo Guardrails | LLM Guard |
|--|:-:|:-:|:-:|:-:|
| **Built-in guards** | **171** | 50+ | 10+ | 30+ |
| **PII regions** | **26** (EN/KO/JA/ZH/TH/AR/HI/EU + 18 more) | 1 | 1 | 1 |
| **Language** | **TS/JS + Python** | Python | Python | Python |
| **Latency** | **<0.1ms** | 100ms+ | 100ms+ | 50ms+ |
| **External API** | Not needed | Required | Required | Partial |
| **Edge/browser** | Yes | No | No | No |
| **Presets** | 14 | - | - | - |
| **SDK adapters** | 8 | 1 | 1 | 1 |
| **Guard composition** | `compose` `when` `not` `retry` `fallback` `parallel` | - | - | - |
| **Circuit breaker** | Yes | No | No | No |
| **Custom guard builder** | 3 factory functions | No | No | No |
| **Asian compliance** | ISMS-P, PIPA, APPI, PIPL | - | - | - |
| **License** | MIT | Apache 2.0 | Apache 2.0 | MIT |

## Quick Start

### TypeScript

```typescript
import { defineGuardrail, promptInjection, pii, keyword } from 'open-guardrail';

const guard = defineGuardrail({
  guards: [
    promptInjection({ action: 'block' }),
    pii({ entities: ['email', 'phone'], action: 'mask' }),
    keyword({ denied: ['hack', 'exploit'], action: 'block' }),
  ],
});

const result = await guard('Hello, my email is user@test.com');
console.log(result.output); // "Hello, my email is [EMAIL]"
```

### Python (FastAPI-style decorators)

```python
from open_guardrail import guardrail, prompt_injection, pii

@guardrail(prompt_injection(action="block"), pii(entities=["email"], action="mask"))
def ask_llm(prompt: str) -> str:
    return call_your_llm(prompt)  # input guarded, output guarded

# Or use presets — one line:
from open_guardrail import presets
result = presets.security().run("user input")
```

### YAML Config (no code changes)

```yaml
version: "1"
pipelines:
  input:
    mode: fail-fast
    guards:
      - type: prompt-injection
        action: block
      - type: pii
        action: mask
        config:
          entities: [email, phone]
```

## 171 Built-in Guards

### Security (28)

`promptInjection` `sqlInjection` `xssGuard` `codeSafety` `encodingAttack` `invisibleText` `dataLeakage` `canaryToken` `markdownSanitize` `multiTurnContext` `urlGuard` `ipGuard` `apiKeyDetect` `secretPattern` `keyword` `regex` `regexDeny` `regexAllow` `toolCallValidator` `pathTraversal` `ssrfDetect` `commandInjection` `jailbreakPattern` `dataPoisoning` `promptLeak` `socialEngineering` `unicodeConfusable` `asciiArt`

### Privacy (33) — 26 PII regions

`pii` (EN) `piiKr` (KO) `piiJp` (JA) `piiCn` (ZH) `piiTh` (TH) `piiAr` (AR) `piiIn` (HI) `piiEu` (EU) `piiDe` (DE) `piiFr` (FR) `piiBr` (BR) `piiAu` (AU) `piiCa` (CA) `piiMx` (MX) `piiSg` (SG) `piiId` (ID) `piiRu` (RU) `piiPl` (PL) `piiEs` (ES) `piiIt` (IT) `piiTr` (TR) `piiVn` (VN) `piiNg` (NG) `piiZa` (ZA) `piiKe` (KE) `piiEg` (EG) `residentId` `creditInfo` `phoneFormat` `deanonymize` `contactInfo` `cryptoAddress` `consentDetect`

### Content Safety (30)

`toxicity` `profanityEn` `profanityKr` `profanityJp` `profanityCn` `bias` `sentiment` `noRefusal` `banCode` `banSubstring` `competitorMention` `gibberishDetect` `readability` `readingTime` `duplicateDetect` `citationCheck` `toneCheck` `personalOpinion` `topicDeny` `topicAllow` `hateSpeech` `violenceDetect` `sexualContent` `selfHarmDetect` `emotionalManipulation` `stereotypeDetect` `brandSafety` `religiousContent` `culturalSensitivity` `sourceAttribution`

### Compliance (19)

`language` `languageConsistency` `languageDetect` `languageMix` `languageQuality` `ismsP` (ISMS-P) `pipa` (PIPA) `appi` (APPI) `pipl` (PIPL) `disclaimerRequire` `dataRetention` `aiDisclosure` `warrantyDisclaimer` `academicIntegrity` `medicalAdvice` `financialAdvice` `legalAdvice` `accessibilityCheck` `ageGate`

### Detection (13)

`spamDetect` `deepfakeIndicator` `propagandaDetect` `greenwashing` `politicalContent` `gamblingDetect` `illegalActivity` `childSafety` `misinformation` `roleplayDetect` `geographicBias` `copyright` `watermarkDetect`

### Format (17)

`wordCount` `contentLength` `tokenLimit` `schemaGuard` `jsonRepair` `jsonOutput` `repetitionDetect` `validRange` `validChoice` `singleLine` `caseValidation` `dateFormat` `numberFormat` `outputFormat` `markdownStructure` `promptLength` `payloadSize`

### AI Delegation (4)

`llmJudge` `hallucination` `relevance` `groundedness`

### Operational (15)

`costGuard` `rateLimit` `responseQuality` `maxLinks` `emptyResponse` `answerCompleteness` `emailValidator` `responseConsistency` `confidenceCheck` `timeSensitive` `instructionAdherence` `urlExtract` `hashtagDetect` `mentionDetect` `addressDetect`

## Guard Composition

```typescript
// Bundle
const security = compose('security', promptInjection(), sqlInjection(), xssGuard());

// Conditional
const longOnly = when((text) => text.length > 200, toxicity());

// Resilience
const safe = fallback(llmJudge({ ... }), keyword({ denied: [...] }));
const reliable = retry(llmJudge({ ... }), { maxRetries: 2 });
const resilient = circuitBreaker(llmJudge({ ... }), { failureThreshold: 3 });

// Performance
const cached = guardCache(llmJudge({ ... }), { ttlMs: 60_000 });
const fast = parallel([promptInjection(), toxicity()], { mode: 'race-block' });
```

## Custom Guards (3 lines)

```typescript
const brandSafety = createKeywordGuard({ name: 'brand', action: 'block', denied: ['competitor'] });
const maskOrder = createRegexGuard({ name: 'order', action: 'mask', patterns: [/ORD-\d+/g], maskLabel: '[ORDER]' });
```

## 14 Presets

`default` `strict` `korean` `japanese` `chinese` `security` `full-security` `privacy-first` `content` `gdpr` `healthcare` `finance` `ai-basic-act-kr` `eu-ai-act`

## 8 SDK Adapters

`open-guardrail-openai` `open-guardrail-anthropic` `open-guardrail-express` `open-guardrail-fastify` `open-guardrail-hono` `open-guardrail-nextjs` `open-guardrail-vercel-ai` `open-guardrail-langchain`

## CLI

```bash
npx open-guardrail-cli init              # scaffold guardrail.yaml
npx open-guardrail-cli list              # browse 171 guards
npx open-guardrail-cli list --language=ko  # filter by language
npx open-guardrail-cli test              # test your config
```

## Benchmarks

| Pipeline | ops/s | latency |
|----------|------:|--------:|
| 6-guard pipeline (short) | 48,000 | **0.021ms** |
| 6-guard pipeline (long) | 14,000 | **0.071ms** |
| Single `keyword` | 1,900,000 | <0.001ms |
| Single `promptInjection` | 1,300,000 | 0.001ms |

## Documentation

[Getting Started](https://wonjangcloud9.github.io/open-guardrail/guide/getting-started.html) | [Guard Reference](https://wonjangcloud9.github.io/open-guardrail/guide/guards.html) | [YAML Config](https://wonjangcloud9.github.io/open-guardrail/guide/yaml-config.html) | [Custom Guards](https://wonjangcloud9.github.io/open-guardrail/guide/custom-guards.html) | [Streaming](https://wonjangcloud9.github.io/open-guardrail/guide/streaming.html) | [Audit Logging](https://wonjangcloud9.github.io/open-guardrail/guide/audit-logging.html) | [한국어 가이드](https://wonjangcloud9.github.io/open-guardrail/ko/)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Sponsors

[Sponsor this project](https://github.com/sponsors/wonjangcloud9) to support development.

## License

MIT
