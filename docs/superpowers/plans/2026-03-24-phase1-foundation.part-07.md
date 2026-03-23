## Task 6: Guards Package — regex + keyword

**Files:**
- Create: `packages/guards/package.json`
- Create: `packages/guards/tsconfig.json`
- Create: `packages/guards/tsup.config.ts`
- Create: `packages/guards/src/regex.ts`
- Create: `packages/guards/src/keyword.ts`
- Create: `packages/guards/tests/regex.test.ts`
- Create: `packages/guards/tests/keyword.test.ts`

- [ ] **Step 1: Create packages/guards/package.json**

```json
{
  "name": "@open-guardrail/guards",
  "version": "0.1.0",
  "description": "Built-in guards for open-guardrail",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@open-guardrail/core": "workspace:*",
    "safe-regex2": "^4.0.0"
  },
  "devDependencies": {
    "tsup": "^8.4.0",
    "vitest": "^3.1.0"
  },
  "license": "MIT"
}
```

- [ ] **Step 2: Create tsconfig.json + tsup.config.ts**

`packages/guards/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "./dist", "rootDir": "./src" },
  "include": ["src/**/*"],
  "exclude": ["tests/**/*", "dist"]
}
```

`packages/guards/tsup.config.ts`:
```typescript
import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true, sourcemap: true, clean: true,
  target: ['node18', 'es2022'],
});
```

- [ ] **Step 3: Write failing tests for regex guard**

Create `packages/guards/tests/regex.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { regex } from '../src/regex.js';

describe('regex guard', () => {
  it('blocks text matching denied pattern', async () => {
    const guard = regex({ patterns: [/\bpassword\b/i], action: 'block' });
    const result = await guard.check('my password is 1234', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('allows text not matching any pattern', async () => {
    const guard = regex({ patterns: [/\bpassword\b/i], action: 'block' });
    const result = await guard.check('hello world', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });

  it('rejects unsafe regex patterns (ReDoS)', () => {
    expect(() => regex({ patterns: [/(a+)+$/], action: 'block' }))
      .toThrow(/unsafe regex/i);
  });

  it('includes match details in result', async () => {
    const guard = regex({ patterns: [/\d{3}-\d{4}/], action: 'warn' });
    const result = await guard.check('call 123-4567', { pipelineType: 'input' });
    expect(result.details?.matches).toBeDefined();
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd packages/guards && pnpm test`
Expected: FAIL

- [ ] **Step 5: Implement regex.ts**

Create `packages/guards/src/regex.ts`:

```typescript
import type { Guard, GuardResult, GuardContext } from '@open-guardrail/core';
import safe from 'safe-regex2';

interface RegexOptions {
  patterns: RegExp[];
  action: 'block' | 'warn';
}

export function regex(options: RegexOptions): Guard {
  for (const pattern of options.patterns) {
    if (!safe(pattern)) {
      throw new Error(`Unsafe regex pattern detected (ReDoS risk): ${pattern}`);
    }
  }

  return {
    name: 'regex',
    version: '0.1.0',
    description: 'Custom regex pattern matching guard',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const matches: string[] = [];

      for (const pattern of options.patterns) {
        const match = text.match(pattern);
        if (match) matches.push(match[0]);
      }

      const triggered = matches.length > 0;
      return {
        guardName: 'regex',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { matches } : undefined,
      };
    },
  };
}
```

- [ ] **Step 6: Run regex tests**

Run: `cd packages/guards && pnpm test -- regex`
Expected: PASS

- [ ] **Step 7: Write failing tests for keyword guard**

Create `packages/guards/tests/keyword.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { keyword } from '../src/keyword.js';

describe('keyword guard', () => {
  it('blocks text containing denied keywords', async () => {
    const guard = keyword({ denied: ['spam', 'scam'], action: 'block' });
    const result = await guard.check('this is a scam', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('allows text without denied keywords', async () => {
    const guard = keyword({ denied: ['spam'], action: 'block' });
    const result = await guard.check('hello world', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('case insensitive by default', async () => {
    const guard = keyword({ denied: ['SPAM'], action: 'block' });
    const result = await guard.check('this is spam', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('supports allowed-only mode', async () => {
    const guard = keyword({ allowed: ['greeting', 'farewell'], action: 'block' });
    const result = await guard.check('hello greeting', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('blocks when no allowed keyword found', async () => {
    const guard = keyword({ allowed: ['greeting'], action: 'block' });
    const result = await guard.check('random text', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });
});
```

- [ ] **Step 8: Implement keyword.ts**

Create `packages/guards/src/keyword.ts`:

```typescript
import type { Guard, GuardResult, GuardContext } from '@open-guardrail/core';

interface KeywordOptions {
  denied?: string[];
  allowed?: string[];
  action: 'block' | 'warn';
  caseSensitive?: boolean;
}

export function keyword(options: KeywordOptions): Guard {
  const normalize = (s: string) => options.caseSensitive ? s : s.toLowerCase();

  return {
    name: 'keyword',
    version: '0.1.0',
    description: 'Keyword deny/allow list guard',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const normalizedText = normalize(text);
      let triggered = false;
      const found: string[] = [];

      if (options.denied) {
        for (const word of options.denied) {
          if (normalizedText.includes(normalize(word))) {
            triggered = true;
            found.push(word);
          }
        }
      }

      if (options.allowed && !triggered) {
        const hasAllowed = options.allowed.some((w) => normalizedText.includes(normalize(w)));
        if (!hasAllowed) triggered = true;
      }

      return {
        guardName: 'keyword',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: found.length > 0 ? { matched: found } : undefined,
      };
    },
  };
}
```

- [ ] **Step 9: Run all guards tests**

Run: `cd packages/guards && pnpm test`
Expected: all PASS

- [ ] **Step 10: Commit**

```bash
git add packages/guards/ && git commit -m "feat(guards): add regex (with ReDoS protection) and keyword guards"
```
