# Guard Utilities

Compose, filter, and transform guards for complex pipelines.

## `when(condition, guard)` — Conditional Execution

Run a guard only when a condition is met:

```typescript
import { when, pipe, toxicity, pii } from 'open-guardrail';

// Only check toxicity on long text
const pipeline = pipe(
  when((text) => text.length > 200, toxicity({ action: 'block' })),
  pii({ entities: ['email'], action: 'mask' }),
);
```

The condition receives `(text, context)` and can be async:

```typescript
// Only run on output stage
when((_, ctx) => ctx.pipelineType === 'output', toxicity({ action: 'block' }));

// Async condition
when(async (text) => {
  const lang = await detectLanguage(text);
  return lang === 'ko';
}, profanityKr({ action: 'block' }));
```

When the condition is false, the guard returns `allow` with a "skipped" message.

## `compose(name, ...guards)` — Guard Bundles

Combine multiple guards into one reusable unit:

```typescript
import { compose, promptInjection, keyword, encodingAttack } from 'open-guardrail';

const securityBundle = compose('security',
  promptInjection({ action: 'block' }),
  keyword({ denied: ['hack', 'exploit'], action: 'block' }),
  encodingAttack({ action: 'block' }),
);

// Use as a single guard
const pipeline = pipe(securityBundle, pii({ entities: ['email'], action: 'mask' }));
```

**Behavior:**
- Guards run sequentially inside the bundle
- If any guard blocks, execution stops (fail-fast within the bundle)
- Override text chains through (e.g., PII masking)
- Returns the highest-priority action
- `details.subResults` contains per-guard results

## `not(guard)` — Negation

Invert a guard — useful for "must contain" checks:

```typescript
import { not, keyword } from 'open-guardrail';

// Block if response does NOT mention a disclaimer
const mustDisclaim = not(
  keyword({ allowed: ['disclaimer', 'note:'], action: 'block' }),
);

// Block if response does NOT contain Korean
const mustBeKorean = not(
  languageConsistency({ action: 'block', expected: ['ko'] }),
  'warn',  // custom action (default: 'block')
);
```

## Combining Utilities

```typescript
const pipeline = pipe(
  // Always run security
  compose('security',
    promptInjection({ action: 'block' }),
    encodingAttack({ action: 'block' }),
  ),
  // PII masking always
  pii({ entities: ['email', 'phone'], action: 'mask' }),
  // Toxicity only on long text
  when((text) => text.length > 100, toxicity({ action: 'block' })),
  // Must include disclaimer in output
  when((_, ctx) => ctx.pipelineType === 'output',
    not(keyword({ allowed: ['disclaimer'], action: 'block' }), 'warn'),
  ),
);
```
