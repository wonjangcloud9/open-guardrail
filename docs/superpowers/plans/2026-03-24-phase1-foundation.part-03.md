## Task 2: Core Package — Types + Errors

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/tsup.config.ts`
- Create: `packages/core/src/types.ts`
- Create: `packages/core/src/errors.ts`
- Create: `packages/core/tests/errors.test.ts`

- [ ] **Step 1: Create packages/core/package.json**

```json
{
  "name": "@open-guardrail/core",
  "version": "0.1.0",
  "description": "Core guardrail engine for LLM applications",
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
    "test:watch": "vitest",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "yaml": "^2.7.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "tsup": "^8.4.0",
    "vitest": "^3.1.0"
  },
  "license": "MIT"
}
```

- [ ] **Step 2: Create packages/core/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["tests/**/*", "dist"]
}
```

- [ ] **Step 3: Create packages/core/tsup.config.ts**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: ['node18', 'es2022'],
});
```

- [ ] **Step 4: Write failing test for GuardError**

Create `packages/core/tests/errors.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { GuardError } from '../src/errors.js';

describe('GuardError', () => {
  it('creates a TIMEOUT error', () => {
    const err = GuardError.timeout('pii', 5000);
    expect(err.code).toBe('TIMEOUT');
    expect(err.message).toContain('pii');
    expect(err.message).toContain('5000');
  });

  it('creates an EXCEPTION error from cause', () => {
    const cause = new Error('boom');
    const err = GuardError.fromException('regex', cause);
    expect(err.code).toBe('EXCEPTION');
    expect(err.cause).toBe(cause);
  });

  it('creates a NETWORK error', () => {
    const err = GuardError.network('llm-judge', 'fetch failed');
    expect(err.code).toBe('NETWORK');
  });

  it('creates an INVALID_CONFIG error', () => {
    const err = GuardError.invalidConfig('regex', 'missing pattern');
    expect(err.code).toBe('INVALID_CONFIG');
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `cd packages/core && pnpm test`
Expected: FAIL — module `../src/errors.js` not found

- [ ] **Step 6: Implement types.ts**

Create `packages/core/src/types.ts`:

```typescript
export type GuardAction = 'allow' | 'block' | 'warn' | 'override';

export type GuardCategory =
  | 'security' | 'privacy' | 'content'
  | 'format' | 'ai' | 'locale' | 'custom';

export type PipelineStage = 'input' | 'output';

export type PipelineMode = 'fail-fast' | 'run-all';

export type OnErrorAction = 'block' | 'allow' | 'warn';

export interface GuardErrorInfo {
  code: 'TIMEOUT' | 'EXCEPTION' | 'NETWORK' | 'INVALID_CONFIG';
  message: string;
  cause?: Error;
}

export interface GuardResult {
  guardName: string;
  passed: boolean;
  action: GuardAction;
  score?: number;
  message?: string;
  overrideText?: string;
  details?: Record<string, unknown>;
  latencyMs: number;
  error?: GuardErrorInfo;
}

export interface GuardContext {
  pipelineType: PipelineStage;
  previousResults?: GuardResult[];
  metadata?: Record<string, unknown>;
  signal?: AbortSignal;
  dryRun?: boolean;
}

export interface Guard {
  name: string;
  version: string;
  description: string;
  category: GuardCategory;
  tags?: string[];
  supportedStages: PipelineStage[];
  check(text: string, ctx: GuardContext): Promise<GuardResult>;
  init?(): Promise<void>;
  dispose?(): Promise<void>;
}

export type GuardFactory<T = unknown> = (options: T) => Guard;

export interface PipelineResult {
  passed: boolean;
  action: GuardAction;
  results: GuardResult[];
  input: string;
  output?: string;
  totalLatencyMs: number;
  metadata: {
    pipelineType: PipelineStage;
    mode: PipelineMode;
    dryRun: boolean;
    timestamp: string;
  };
}

export interface PipelineOptions {
  type?: PipelineStage;
  mode?: PipelineMode;
  onError?: OnErrorAction;
  timeoutMs?: number;
  dryRun?: boolean;
  guards: Guard[];
}
```

- [ ] **Step 7: Implement errors.ts**

Create `packages/core/src/errors.ts`:

```typescript
import type { GuardErrorInfo } from './types.js';

export class GuardError extends Error implements GuardErrorInfo {
  readonly code: GuardErrorInfo['code'];
  readonly cause?: Error;

  constructor(code: GuardErrorInfo['code'], message: string, cause?: Error) {
    super(message);
    this.name = 'GuardError';
    this.code = code;
    this.cause = cause;
  }

  static timeout(guardName: string, ms: number): GuardError {
    return new GuardError('TIMEOUT', `Guard "${guardName}" timed out after ${ms}ms`);
  }

  static fromException(guardName: string, cause: Error): GuardError {
    return new GuardError('EXCEPTION', `Guard "${guardName}" threw: ${cause.message}`, cause);
  }

  static network(guardName: string, detail: string): GuardError {
    return new GuardError('NETWORK', `Guard "${guardName}" network error: ${detail}`);
  }

  static invalidConfig(guardName: string, detail: string): GuardError {
    return new GuardError('INVALID_CONFIG', `Guard "${guardName}" config error: ${detail}`);
  }

  toJSON(): GuardErrorInfo {
    return { code: this.code, message: this.message };
  }
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd packages/core && pnpm test`
Expected: 4 tests PASS

- [ ] **Step 9: Commit**

```bash
git add packages/core/ && git commit -m "feat(core): add Guard types and GuardError"
```
