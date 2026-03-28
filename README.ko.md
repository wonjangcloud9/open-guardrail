# open-guardrail

**330개 가드. 26개 지역 PII. <0.1ms 지연. 벤더 종속 없음.**

LLM 애플리케이션을 위한 가장 포괄적인 오픈소스 가드레일 엔진. 프롬프트 인젝션 차단, 26개 지역 PII 마스킹, 4개 언어 비속어 감지 — 외부 API 호출 없이 모두 가능합니다.

[![npm](https://img.shields.io/npm/v/open-guardrail)](https://www.npmjs.com/package/open-guardrail)
[![PyPI](https://img.shields.io/pypi/v/open-guardrail)](https://pypi.org/project/open-guardrail/)
[![license](https://img.shields.io/github/license/wonjangcloud9/open-guardrail)](LICENSE)
[![CI](https://github.com/wonjangcloud9/open-guardrail/actions/workflows/ci.yaml/badge.svg)](https://github.com/wonjangcloud9/open-guardrail/actions)
![guards](https://img.shields.io/badge/가드-330-blue)
![PII languages](https://img.shields.io/badge/PII_지역-26-orange)

[English](./README.md) | **한국어** | [문서](https://wonjangcloud9.github.io/open-guardrail/)

> **Node.js**, **Python**, 브라우저, Edge 런타임에서 동작. 외부 API 불필요.

## 왜 open-guardrail?

- **330개 가드** — 프롬프트 인젝션부터 GDPR/EU AI Act/한국 AI 기본법까지, 모두 패턴 기반 (ML 모델 불필요)
- **26개 지역 PII** — 한국, 일본, 중국, 영어, 태국, 아랍, 인도, EU + 18개 추가 지역
- **<0.1ms** — 6가드 파이프라인 0.1ms 미만. API 기반 대비 50,000배 저렴
- **JS + Python** — 동일한 가드, 동일한 API, 동일한 커버리지
- **19개 프리셋** — GDPR, 의료, 금융, 한국/일본/중국 규제, 풀 보안
- **제로 의존성** — 외부 API, ML 모델, 벤더 종속 없음
- **커스텀 가드 빌더** — 3줄로 나만의 가드 생성

| 기능 | open-guardrail | Guardrails AI | NeMo Guardrails | LLM Guard |
|------|:-:|:-:|:-:|:-:|
| 언어 | **TS/JS + Python** | Python | Python | Python |
| 내장 가드 | **330** | 50+ | 10+ | 30+ |
| PII 지역 | **26개 지역** | 1 | 1 | 1 |
| 외부 API 불필요 | ✅ | ❌ | ❌ | 일부 |
| 병렬 실행 | ✅ | ❌ | ✅ | ❌ |
| 서킷 브레이커 | ✅ | ❌ | ❌ | ❌ |
| 결과 캐싱 | ✅ | ❌ | ✅ | ❌ |
| 커스텀 가드 빌더 | ✅ 3종 팩토리 | ❌ | ❌ | ❌ |
| 규제 준수 | ✅ GDPR, EU AI Act, 🇰🇷 AI 기본법, ISMS-P, PIPA, APPI, PIPL | ❌ | ❌ | ❌ |
| SDK 어댑터 | **8개** | 1개 | 1개 | 1개 |
| 6가드 지연 | **<0.1ms** | 100ms+ | 100ms+ | 50ms+ |

## 설치

```bash
npm install open-guardrail
```

## 빠른 시작

```typescript
import { defineGuardrail, promptInjection, pii, keyword } from 'open-guardrail';

const guard = defineGuardrail({
  guards: [
    promptInjection({ action: 'block' }),
    pii({ entities: ['email', 'phone'], action: 'mask' }),
    keyword({ denied: ['hack', 'exploit'], action: 'block' }),
  ],
});

const result = await guard('사용자 입력 텍스트');
if (!result.passed) console.log('차단됨:', result.action);
// result.output에 PII 마스킹된 텍스트 포함
```

`pipe()` 단축형도 사용 가능:

```typescript
const result = await pipe(
  promptInjection({ action: 'block' }),
  pii({ entities: ['email'], action: 'mask' }),
).run('사용자 입력');
```

## YAML 설정

`guardrail.yaml` 파일을 생성합니다:

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
  output:
    mode: run-all
    guards:
      - type: toxicity
        action: warn
      - type: hallucination
        action: block
```

코드에서 로드:

```typescript
import { OpenGuardrail } from 'open-guardrail';

const engine = await OpenGuardrail.fromConfig('./guardrail.yaml');
const result = await engine.run(text);
```

## CLI

```bash
npx open-guardrail-cli init          # guardrail.yaml 생성
npx open-guardrail-cli validate      # 설정 파일 검증
npx open-guardrail-cli list          # 215개 가드 조회
```

## 내장 가드 (215개)

### 보안 (28)

`promptInjection` `sqlInjection` `xssGuard` `codeSafety` `encodingAttack` `invisibleText` `dataLeakage` `canaryToken` `markdownSanitize` `multiTurnContext` `urlGuard` `ipGuard` `apiKeyDetect` `secretPattern` `keyword` `regex` `regexDeny` `regexAllow` `toolCallValidator` `pathTraversal` `ssrfDetect` `commandInjection` `jailbreakPattern` `dataPoisoning` `promptLeak` `socialEngineering` `unicodeConfusable` `asciiArt`

### 개인정보 (33) — 26개 지역 PII

`pii` (EN) `piiKr` (KO) `piiJp` (JA) `piiCn` (ZH) `piiTh` (TH) `piiAr` (AR) `piiIn` (HI) `piiEu` (EU) `piiDe` (DE) `piiFr` (FR) `piiBr` (BR) `piiAu` (AU) `piiCa` (CA) `piiMx` (MX) `piiSg` (SG) `piiId` (ID) `piiRu` (RU) `piiPl` (PL) `piiEs` (ES) `piiIt` (IT) `piiTr` (TR) `piiVn` (VN) `piiNg` (NG) `piiZa` (ZA) `piiKe` (KE) `piiEg` (EG) `residentId` `creditInfo` `phoneFormat` `deanonymize` `contactInfo` `cryptoAddress` `consentDetect`

### 콘텐츠 안전 (30)

`toxicity` `profanityEn` `profanityKr` `profanityJp` `profanityCn` `bias` `sentiment` `noRefusal` `banCode` `banSubstring` `competitorMention` `gibberishDetect` `readability` `readingTime` `duplicateDetect` `citationCheck` `toneCheck` `personalOpinion` `topicDeny` `topicAllow` `hateSpeech` `violenceDetect` `sexualContent` `selfHarmDetect` `emotionalManipulation` `stereotypeDetect` `brandSafety` `religiousContent` `culturalSensitivity` `sourceAttribution`

### 규제 준수 (19)

`language` `languageConsistency` `languageDetect` `languageMix` `languageQuality` `ismsP` (ISMS-P) `pipa` (PIPA) `appi` (APPI) `pipl` (PIPL) `disclaimerRequire` `dataRetention` `aiDisclosure` `warrantyDisclaimer` `academicIntegrity` `medicalAdvice` `financialAdvice` `legalAdvice` `accessibilityCheck` `ageGate`

### 탐지 (13)

`spamDetect` `deepfakeIndicator` `propagandaDetect` `greenwashing` `politicalContent` `gamblingDetect` `illegalActivity` `childSafety` `misinformation` `roleplayDetect` `geographicBias` `copyright` `watermarkDetect`

### 포맷 (17)

`wordCount` `contentLength` `tokenLimit` `schemaGuard` `jsonRepair` `jsonOutput` `repetitionDetect` `validRange` `validChoice` `singleLine` `caseValidation` `dateFormat` `numberFormat` `outputFormat` `markdownStructure` `promptLength` `payloadSize`

### AI 위임 (4)

`llmJudge` `hallucination` `relevance` `groundedness`

### 운영 (15)

`costGuard` `rateLimit` `responseQuality` `maxLinks` `emptyResponse` `answerCompleteness` `emailValidator` `responseConsistency` `confidenceCheck` `timeSensitive` `instructionAdherence` `urlExtract` `hashtagDetect` `mentionDetect` `addressDetect`

## 한국 규제 준수 예시

```typescript
import { pipe, piiKr, profanityKr, residentId, pipa } from 'open-guardrail';

// ISMS-P + 개인정보보호법 준수 파이프라인
const pipeline = pipe(
  piiKr({ entities: ['resident-id', 'passport', 'driver-license'], action: 'mask' }),
  residentId({ action: 'mask' }),
  profanityKr({ action: 'block' }),
  pipa({ action: 'block' }),
);

const result = await pipeline.run('제 주민등록번호는 901201-1234567입니다');
// → 주민번호가 마스킹된 안전한 텍스트 반환
```

또는 프리셋 사용:

```yaml
# guardrail.yaml
version: "1"
preset: korean          # ISMS-P + PIPA + 주민등록번호 검증
pipelines:
  input:
    mode: fail-fast
```

## 프리셋

| 프리셋 | 용도 |
|--------|------|
| `default` | 기본 보호 (프롬프트 인젝션, 키워드, 단어 수) |
| `strict` | 전체 PII 마스킹 + 엄격 차단 |
| `korean` | 한국 규제 준수 (ISMS-P, PIPA, 주민등록번호) |
| `security` | 인젝션, PII, 데이터 유출 중심 |
| `content` | 독성, 편향, 언어 제어 |
| `ai-basic-act-kr` | 한국 AI 기본법 준수 (편향 방지, PII, 독성) |
| `eu-ai-act` | EU AI Act 준수 (편향, PII, 독성, 워터마크, 저작권) |

## SDK 어댑터

### OpenAI

```typescript
import OpenAI from 'openai';
import { pipe, promptInjection } from 'open-guardrail';
import { createGuardedOpenAI } from 'open-guardrail-openai';

const guarded = createGuardedOpenAI(new OpenAI(), {
  input: pipe(promptInjection({ action: 'block' })),
});

const res = await guarded.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: '안녕하세요!' }],
});
```

### Vercel AI SDK

```typescript
import { createGuardrailMiddleware } from 'open-guardrail-vercel-ai';

const middleware = createGuardrailMiddleware({
  input: inputPipeline,
  output: outputPipeline,
});
```

### LangChain.js

```typescript
import { createGuardrailChain } from 'open-guardrail-langchain';

const chain = createGuardrailChain({
  input: inputPipeline,
  output: outputPipeline,
});
```

## 패키지

| 패키지 | 설명 |
|--------|------|
| `open-guardrail` | 올인원 (코어 + 215개 가드) |
| `open-guardrail-core` | 코어 엔진 (Pipeline, StreamingPipeline, Router, AuditLogger) |
| `open-guardrail-guards` | 내장 가드 모음 |
| `open-guardrail-cli` | CLI 도구 |
| `open-guardrail-openai` | OpenAI SDK 어댑터 |
| `open-guardrail-anthropic` | Anthropic (Claude) SDK 어댑터 |
| `open-guardrail-express` | Express 미들웨어 어댑터 |
| `open-guardrail-fastify` | Fastify 플러그인 어댑터 |
| `open-guardrail-hono` | Hono 미들웨어 (Edge/Workers/Deno/Bun) |
| `open-guardrail-nextjs` | Next.js App Router 어댑터 |
| `open-guardrail-vercel-ai` | Vercel AI SDK 미들웨어 어댑터 |
| `open-guardrail-langchain` | LangChain.js 통합 어댑터 |

## 주요 기능

- **파이프라인 체이닝** — `pipe()` 또는 `createPipeline()`으로 가드 조합
- **스트리밍 검증** — 청크 단위 가드 + 풀텍스트 시맨틱 검사 (`StreamingPipeline`)
- **리스크 기반 라우팅** — 입력 위험도에 따라 다른 파이프라인 실행 (`GuardRouter`)
- **에이전트 안전** — `toolCallValidator`로 도구 호출 인자 검증
- **감사 로깅** — EU AI Act / 한국 AI 기본법 준수 (`AuditLogger`)
- **선언적 설정** — YAML/JSON 설정, 코드 변경 불필요
- **이벤트 훅** — `guard:before`, `guard:after`, `guard:blocked`, `guard:error`
- **드라이 런 모드** — 차단 없이 가드 테스트
- **Fail-fast / Run-all** — 파이프라인별 실행 전략 선택
- **에러 처리** — 타임아웃 포함 설정 가능한 fail-closed/open
- **프로바이더 무관** — 모든 LLM, 모든 프레임워크와 호환

## 플레이그라운드

브라우저에서 가드를 직접 테스트해보세요 — 백엔드 불필요:

```bash
pnpm playground
```

가드를 선택하고 텍스트를 입력하면 실시간으로 결과를 확인할 수 있습니다. 프롬프트 인젝션, PII, 독성 콘텐츠, 한국어 PII 샘플 입력을 지원합니다.

## 벤치마크

Apple M 시리즈 (Node.js 22) 기준 단일 가드 및 파이프라인 처리량:

| 벤치마크 | ops/s | 평균 지연 |
|----------|------:|----------:|
| `keyword` — 짧은 텍스트 | 1,900,000 | <0.001ms |
| `regex` — 짧은 텍스트 | 2,700,000 | <0.001ms |
| `promptInjection` — 짧은 텍스트 | 1,300,000 | 0.001ms |
| `pii(mask)` — PII 텍스트 | 408,000 | 0.002ms |
| `piiKr(mask)` — 한국 PII | 810,000 | 0.001ms |
| `toxicity` — 독성 텍스트 | 152,000 | 0.007ms |
| **pipeline(6개 가드)** — 짧은 텍스트 | 48,000 | 0.021ms |
| **pipeline(6개 가드)** — 긴 혼합 | 14,000 | 0.071ms |

```bash
pnpm bench
```

## 기여

[CONTRIBUTING.md](./CONTRIBUTING.md)를 참고하세요.

## 보안

취약점 보고는 [SECURITY.md](./SECURITY.md)를 참고하세요.

## 라이선스

MIT
