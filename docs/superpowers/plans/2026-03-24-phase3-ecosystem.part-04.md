## Task 3: Audit Logger

**Files:**
- Create: `packages/core/src/audit-logger.ts`
- Create: `packages/core/tests/audit-logger.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/core/tests/audit-logger.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { AuditLogger } from '../src/audit-logger.js';

describe('AuditLogger', () => {
  it('records guard:after events', () => {
    const logger = new AuditLogger();
    logger.record({
      event: 'guard:after',
      guardName: 'pii',
      action: 'allow',
      passed: true,
      inputPreview: 'hello world',
    });
    expect(logger.entries).toHaveLength(1);
    expect(logger.entries[0].guardName).toBe('pii');
  });

  it('records guard:blocked events', () => {
    const logger = new AuditLogger();
    logger.record({
      event: 'guard:blocked',
      guardName: 'keyword',
      action: 'block',
      passed: false,
      inputPreview: 'bad word...',
    });
    expect(logger.entries[0].action).toBe('block');
  });

  it('exports entries as JSON', () => {
    const logger = new AuditLogger();
    logger.record({ event: 'guard:after', guardName: 'pii', action: 'allow', passed: true, inputPreview: 'hi' });
    const json = logger.exportJSON();
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(1);
  });

  it('filters by date range', () => {
    const logger = new AuditLogger();
    logger.record({ event: 'guard:after', guardName: 'a', action: 'allow', passed: true, inputPreview: '' });
    const entries = logger.query({ from: new Date(Date.now() - 60000) });
    expect(entries).toHaveLength(1);
  });

  it('filters by guard name', () => {
    const logger = new AuditLogger();
    logger.record({ event: 'guard:after', guardName: 'pii', action: 'allow', passed: true, inputPreview: '' });
    logger.record({ event: 'guard:blocked', guardName: 'keyword', action: 'block', passed: false, inputPreview: '' });
    const entries = logger.query({ guardName: 'keyword' });
    expect(entries).toHaveLength(1);
  });

  it('truncates input preview', () => {
    const logger = new AuditLogger({ maxPreviewLength: 10 });
    logger.record({ event: 'guard:after', guardName: 'a', action: 'allow', passed: true, inputPreview: 'a'.repeat(100) });
    expect(logger.entries[0].inputPreview.length).toBeLessThanOrEqual(13); // 10 + '...'
  });

  it('creates EventBus handler', async () => {
    const logger = new AuditLogger();
    const handler = logger.createHandler();
    await handler({ guardName: 'pii', text: 'test input', result: { passed: true, action: 'allow' } });
    expect(logger.entries).toHaveLength(1);
  });

  it('clears entries', () => {
    const logger = new AuditLogger();
    logger.record({ event: 'guard:after', guardName: 'a', action: 'allow', passed: true, inputPreview: '' });
    logger.clear();
    expect(logger.entries).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && pnpm test -- audit`
Expected: FAIL

- [ ] **Step 3: Implement audit-logger.ts**

Create `packages/core/src/audit-logger.ts`:

```typescript
import type { GuardAction } from './types.js';

export interface AuditEntry {
  timestamp: string;
  event: string;
  guardName: string;
  action: GuardAction | string;
  passed: boolean;
  inputPreview: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

interface AuditRecordInput {
  event: string;
  guardName: string;
  action: GuardAction | string;
  passed: boolean;
  inputPreview: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

interface AuditLoggerOptions {
  maxPreviewLength?: number;
  maxEntries?: number;
}

interface QueryOptions {
  from?: Date;
  to?: Date;
  guardName?: string;
  action?: string;
  passed?: boolean;
}

export class AuditLogger {
  private _entries: AuditEntry[] = [];
  private maxPreviewLength: number;
  private maxEntries: number;

  constructor(options?: AuditLoggerOptions) {
    this.maxPreviewLength = options?.maxPreviewLength ?? 200;
    this.maxEntries = options?.maxEntries ?? 10000;
  }

  get entries(): readonly AuditEntry[] {
    return this._entries;
  }

  record(input: AuditRecordInput): void {
    const preview = input.inputPreview.length > this.maxPreviewLength
      ? input.inputPreview.slice(0, this.maxPreviewLength) + '...'
      : input.inputPreview;

    this._entries.push({
      timestamp: new Date().toISOString(),
      event: input.event,
      guardName: input.guardName,
      action: input.action,
      passed: input.passed,
      inputPreview: preview,
      score: input.score,
      metadata: input.metadata,
    });

    if (this._entries.length > this.maxEntries) {
      this._entries = this._entries.slice(-this.maxEntries);
    }
  }

  query(options: QueryOptions): AuditEntry[] {
    return this._entries.filter((e) => {
      if (options.from && new Date(e.timestamp) < options.from) return false;
      if (options.to && new Date(e.timestamp) > options.to) return false;
      if (options.guardName && e.guardName !== options.guardName) return false;
      if (options.action && e.action !== options.action) return false;
      if (options.passed !== undefined && e.passed !== options.passed) return false;
      return true;
    });
  }

  exportJSON(): string {
    return JSON.stringify(this._entries, null, 2);
  }

  createHandler(): (payload: Record<string, unknown>) => Promise<void> {
    return async (payload) => {
      const result = payload.result as Record<string, unknown> | undefined;
      this.record({
        event: result?.action === 'block' ? 'guard:blocked' : 'guard:after',
        guardName: (payload.guardName as string) ?? 'unknown',
        action: (result?.action as string) ?? 'allow',
        passed: (result?.passed as boolean) ?? true,
        inputPreview: (payload.text as string) ?? '',
        score: result?.score as number | undefined,
      });
    };
  }

  clear(): void {
    this._entries = [];
  }
}
```

- [ ] **Step 4: Export from index.ts**

Add to `packages/core/src/index.ts`:
```typescript
export { AuditLogger, type AuditEntry } from './audit-logger.js';
```

- [ ] **Step 5: Run tests**

Run: `cd packages/core && pnpm test`
Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add packages/core/
git commit -m "feat(core): add AuditLogger for EU AI Act / 한국 AI 기본법 compliance"
```
