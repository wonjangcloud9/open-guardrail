## Task 8: Guards — word-count + schema

**Files:**
- Create: `packages/guards/src/word-count.ts`
- Create: `packages/guards/src/schema-guard.ts`
- Create: `packages/guards/src/index.ts`
- Create: `packages/guards/tests/word-count.test.ts`
- Create: `packages/guards/tests/schema-guard.test.ts`

- [ ] **Step 1: Write failing tests for word-count**

Create `packages/guards/tests/word-count.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { wordCount } from '../src/word-count.js';

describe('word-count guard', () => {
  it('blocks text exceeding max words', async () => {
    const guard = wordCount({ max: 5, action: 'block' });
    const result = await guard.check('one two three four five six seven', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.details?.wordCount).toBe(7);
  });

  it('blocks text below min words', async () => {
    const guard = wordCount({ min: 3, action: 'block' });
    const result = await guard.check('hi', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows text within range', async () => {
    const guard = wordCount({ min: 1, max: 10, action: 'block' });
    const result = await guard.check('hello world', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('counts by characters when unit=chars', async () => {
    const guard = wordCount({ max: 10, unit: 'chars', action: 'warn' });
    const result = await guard.check('hello world!', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.details?.charCount).toBe(12);
  });
});
```

- [ ] **Step 2: Implement word-count.ts**

Create `packages/guards/src/word-count.ts`:

```typescript
import type { Guard, GuardResult, GuardContext } from '@open-guardrail/core';

interface WordCountOptions {
  min?: number;
  max?: number;
  unit?: 'words' | 'chars';
  action: 'block' | 'warn';
}

export function wordCount(options: WordCountOptions): Guard {
  const unit = options.unit ?? 'words';

  return {
    name: 'word-count',
    version: '0.1.0',
    description: 'Word/character count limit guard',
    category: 'format',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const count = unit === 'words'
        ? text.trim().split(/\s+/).filter(Boolean).length
        : text.length;

      const tooShort = options.min !== undefined && count < options.min;
      const tooLong = options.max !== undefined && count > options.max;
      const triggered = tooShort || tooLong;

      return {
        guardName: 'word-count',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: { [unit === 'words' ? 'wordCount' : 'charCount']: count, min: options.min, max: options.max },
      };
    },
  };
}
```

- [ ] **Step 3: Run word-count tests**

Run: `cd packages/guards && pnpm test -- word-count`
Expected: PASS

- [ ] **Step 4: Write failing tests for schema guard**

Create `packages/guards/tests/schema-guard.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { schemaGuard } from '../src/schema-guard.js';

describe('schema guard', () => {
  const personSchema = {
    type: 'object' as const,
    properties: {
      name: { type: 'string' as const },
      age: { type: 'number' as const },
    },
    required: ['name'],
  };

  it('passes valid JSON matching schema', async () => {
    const guard = schemaGuard({ schema: personSchema, action: 'block' });
    const result = await guard.check('{"name":"Alice","age":30}', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('blocks invalid JSON', async () => {
    const guard = schemaGuard({ schema: personSchema, action: 'block' });
    const result = await guard.check('not json at all', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.details?.reason).toContain('parse');
  });

  it('blocks JSON missing required field', async () => {
    const guard = schemaGuard({ schema: personSchema, action: 'block' });
    const result = await guard.check('{"age":30}', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('blocks JSON with wrong type', async () => {
    const guard = schemaGuard({ schema: personSchema, action: 'block' });
    const result = await guard.check('{"name":123}', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });
});
```

- [ ] **Step 5: Implement schema-guard.ts**

Create `packages/guards/src/schema-guard.ts`:

```typescript
import type { Guard, GuardResult, GuardContext } from '@open-guardrail/core';

interface JsonSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

interface SimpleJsonSchema {
  type: 'object';
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
}

interface SchemaGuardOptions {
  schema: SimpleJsonSchema;
  action: 'block' | 'warn';
}

function validateSchema(data: unknown, schema: SimpleJsonSchema): string[] {
  const errors: string[] = [];
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    errors.push('Expected an object');
    return errors;
  }
  const obj = data as Record<string, unknown>;

  for (const key of schema.required ?? []) {
    if (!(key in obj)) errors.push(`Missing required field: ${key}`);
  }

  for (const [key, prop] of Object.entries(schema.properties)) {
    if (key in obj && typeof obj[key] !== prop.type) {
      errors.push(`Field "${key}" expected ${prop.type}, got ${typeof obj[key]}`);
    }
  }
  return errors;
}

export function schemaGuard(options: SchemaGuardOptions): Guard {
  return {
    name: 'schema',
    version: '0.1.0',
    description: 'JSON Schema validation guard',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        return {
          guardName: 'schema', passed: false, action: options.action,
          latencyMs: Math.round(performance.now() - start),
          details: { reason: 'JSON parse error' },
        };
      }

      const errors = validateSchema(parsed, options.schema);
      const triggered = errors.length > 0;

      return {
        guardName: 'schema',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { errors } : undefined,
      };
    },
  };
}
```

- [ ] **Step 6: Create guards index.ts**

Create `packages/guards/src/index.ts`:

```typescript
export { regex } from './regex.js';
export { keyword } from './keyword.js';
export { pii } from './pii.js';
export { promptInjection } from './prompt-injection.js';
export { wordCount } from './word-count.js';
export { schemaGuard } from './schema-guard.js';
```

- [ ] **Step 7: Run all guards tests**

Run: `cd packages/guards && pnpm test`
Expected: all 6 guard test files PASS

- [ ] **Step 8: Build guards package**

Run: `cd packages/guards && pnpm build`
Expected: `dist/` created

- [ ] **Step 9: Commit**

```bash
git add packages/guards/ && git commit -m "feat(guards): add word-count and schema guards, complete Phase 1 guard set"
```
