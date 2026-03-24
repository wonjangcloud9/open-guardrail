## Task 1: Fix umbrella exports + version alignment

**Files:**
- Modify: `packages/open-guardrail/src/index.ts`
- Modify: `packages/open-guardrail/package.json`
- Modify: `packages/core/package.json`
- Modify: `packages/guards/package.json`
- Modify: `packages/cli/package.json`

- [ ] **Step 1: Update umbrella index.ts to export all 26 guards**

Replace `packages/open-guardrail/src/index.ts`:

```typescript
// Core
export {
  type Guard, type GuardAction, type GuardCategory,
  type GuardContext, type GuardResult, type GuardErrorInfo,
  type GuardFactory, type PipelineOptions, type PipelineResult,
  type PipelineMode, type PipelineStage, type OnErrorAction,
  GuardError, EventBus, Pipeline, createPipeline, pipe,
  GuardRegistry, OpenGuardrail,
  configSchema, type RawConfig,
  parseConfig, validateConfig, loadConfigFromString,
} from 'open-guardrail-core';

// Guards — Security
export { regex, keyword, promptInjection } from 'open-guardrail-guards';

// Guards — Privacy
export { pii } from 'open-guardrail-guards';

// Guards — Content
export { toxicity, topicDeny, topicAllow, bias, language } from 'open-guardrail-guards';

// Guards — Format
export { wordCount, schemaGuard } from 'open-guardrail-guards';

// Guards — AI Delegation
export { llmJudge, hallucination, relevance, groundedness } from 'open-guardrail-guards';
export type { LlmCallFn } from 'open-guardrail-guards';

// Guards — Operational
export { costGuard, rateLimit, dataLeakage, sentiment } from 'open-guardrail-guards';

// Guards — Korea / ISMS
export { piiKr, profanityKr, residentId, creditInfo, ismsP, pipa } from 'open-guardrail-guards';
```

- [ ] **Step 2: Update all package.json versions to 0.5.0 + add metadata**

`packages/core/package.json` — add:
```json
{
  "version": "0.5.0",
  "description": "Core engine: Pipeline, Guard interface, EventBus, Config Loader — provider agnostic",
  "author": "Lucas <wonjangcloud9@gmail.com>",
  "repository": { "type": "git", "url": "https://github.com/wonjangcloud9/open-guardrail", "directory": "packages/core" },
  "bugs": "https://github.com/wonjangcloud9/open-guardrail/issues",
  "homepage": "https://github.com/wonjangcloud9/open-guardrail#readme",
  "engines": { "node": ">=18" },
  "keywords": ["guardrail", "llm", "pipeline", "guard", "event-bus", "config", "middleware"]
}
```

`packages/guards/package.json` — add:
```json
{
  "version": "0.5.0",
  "description": "25 built-in guards: security, privacy, content, format, AI delegation, Korean compliance",
  "author": "Lucas <wonjangcloud9@gmail.com>",
  "repository": { "type": "git", "url": "https://github.com/wonjangcloud9/open-guardrail", "directory": "packages/guards" },
  "bugs": "https://github.com/wonjangcloud9/open-guardrail/issues",
  "homepage": "https://github.com/wonjangcloud9/open-guardrail#readme",
  "engines": { "node": ">=18" },
  "keywords": ["guardrail", "pii", "toxicity", "bias", "prompt-injection", "isms-p", "pipa", "hallucination"]
}
```

`packages/cli/package.json` — add:
```json
{
  "version": "0.5.0",
  "description": "CLI for open-guardrail — init project, validate config, preset scaffolding",
  "author": "Lucas <wonjangcloud9@gmail.com>",
  "repository": { "type": "git", "url": "https://github.com/wonjangcloud9/open-guardrail", "directory": "packages/cli" },
  "bugs": "https://github.com/wonjangcloud9/open-guardrail/issues",
  "homepage": "https://github.com/wonjangcloud9/open-guardrail#readme",
  "engines": { "node": ">=18" },
  "keywords": ["guardrail", "cli", "llm", "config", "yaml"]
}
```

`packages/open-guardrail/package.json` — update:
```json
{
  "version": "0.5.0",
  "description": "Open-source guardrail engine for LLM apps — 25 built-in guards, pipeline chaining, YAML config",
  "author": "Lucas <wonjangcloud9@gmail.com>",
  "engines": { "node": ">=18" },
  "bugs": "https://github.com/wonjangcloud9/open-guardrail/issues",
  "homepage": "https://github.com/wonjangcloud9/open-guardrail#readme",
  "keywords": ["guardrail", "llm", "ai", "safety", "moderation", "pii", "prompt-injection", "content-filter", "compliance", "isms-p"]
}
```

- [ ] **Step 3: Build all packages**

Run: `pnpm build`
Expected: all 4 packages build successfully

- [ ] **Step 4: Run all tests**

Run: `pnpm test`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add packages/
git commit -m "feat: export all 26 guards from umbrella, align versions to v0.5.0, add npm metadata"
```
