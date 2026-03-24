## Task 2: Tool Call Validator Guard

**Files:**
- Create: `packages/guards/src/tool-call-validator.ts`
- Create: `packages/guards/tests/tool-call-validator.test.ts`
- Modify: `packages/guards/src/index.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/guards/tests/tool-call-validator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { toolCallValidator } from '../src/tool-call-validator.js';

describe('tool-call-validator guard', () => {
  it('passes valid tool call', async () => {
    const guard = toolCallValidator({
      action: 'block',
      rules: [{ tool: 'sendEmail', arg: 'to', validate: 'email' }],
    });
    const input = JSON.stringify({ tool: 'sendEmail', args: { to: 'user@example.com', body: 'hello' } });
    const result = await guard.check(input, { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('blocks invalid email in tool arg', async () => {
    const guard = toolCallValidator({
      action: 'block',
      rules: [{ tool: 'sendEmail', arg: 'to', validate: 'email' }],
    });
    const input = JSON.stringify({ tool: 'sendEmail', args: { to: 'not-an-email', body: 'hello' } });
    const result = await guard.check(input, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('blocks SQL injection in any tool arg', async () => {
    const guard = toolCallValidator({
      action: 'block',
      rules: [{ tool: '*', arg: '*', denyPatterns: [/DROP\s+TABLE/i, /;\s*DELETE/i] }],
    });
    const input = JSON.stringify({ tool: 'queryDB', args: { query: 'SELECT * FROM users; DELETE FROM users' } });
    const result = await guard.check(input, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('validates uuid format', async () => {
    const guard = toolCallValidator({
      action: 'block',
      rules: [{ tool: 'getUser', arg: 'id', validate: 'uuid' }],
    });
    const valid = JSON.stringify({ tool: 'getUser', args: { id: '550e8400-e29b-41d4-a716-446655440000' } });
    const invalid = JSON.stringify({ tool: 'getUser', args: { id: 'fake-id-123' } });

    expect((await guard.check(valid, { pipelineType: 'output' })).passed).toBe(true);
    expect((await guard.check(invalid, { pipelineType: 'output' })).passed).toBe(false);
  });

  it('blocks disallowed tool names', async () => {
    const guard = toolCallValidator({
      action: 'block',
      allowedTools: ['search', 'getWeather'],
      rules: [],
    });
    const input = JSON.stringify({ tool: 'deleteAllData', args: {} });
    const result = await guard.check(input, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.details?.reason).toContain('not allowed');
  });

  it('allows non-JSON text (passthrough)', async () => {
    const guard = toolCallValidator({ action: 'block', rules: [] });
    const result = await guard.check('just regular text', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/guards && pnpm test -- tool-call`
Expected: FAIL

- [ ] **Step 3: Implement tool-call-validator.ts**

Create `packages/guards/src/tool-call-validator.ts`:

```typescript
import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

type ValidationType = 'email' | 'uuid' | 'url' | 'number';

interface ToolRule {
  tool: string; // '*' = any tool
  arg: string;  // '*' = any arg
  validate?: ValidationType;
  denyPatterns?: RegExp[];
}

interface ToolCallValidatorOptions {
  action: 'block' | 'warn';
  rules: ToolRule[];
  allowedTools?: string[];
}

const VALIDATORS: Record<ValidationType, (v: string) => boolean> = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  uuid: (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
  url: (v) => /^https?:\/\/.+/.test(v),
  number: (v) => !isNaN(Number(v)),
};

interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
}

function parseToolCall(text: string): ToolCall | null {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.tool === 'string' && typeof parsed.args === 'object') {
      return parsed as ToolCall;
    }
    return null;
  } catch {
    return null;
  }
}

export function toolCallValidator(options: ToolCallValidatorOptions): Guard {
  return {
    name: 'tool-call-validator',
    version: '0.5.0',
    description: 'Validates agent tool call arguments for type safety and injection prevention',
    category: 'security',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const call = parseToolCall(text);

      if (!call) {
        return { guardName: 'tool-call-validator', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      }

      // Check allowed tools
      if (options.allowedTools && !options.allowedTools.includes(call.tool)) {
        return {
          guardName: 'tool-call-validator', passed: false, action: options.action,
          latencyMs: Math.round(performance.now() - start),
          details: { reason: `Tool "${call.tool}" not allowed`, allowed: options.allowedTools },
        };
      }

      // Check rules
      const violations: string[] = [];

      for (const rule of options.rules) {
        const toolMatch = rule.tool === '*' || rule.tool === call.tool;
        if (!toolMatch) continue;

        const argsToCheck = rule.arg === '*'
          ? Object.entries(call.args)
          : Object.entries(call.args).filter(([k]) => k === rule.arg);

        for (const [argName, argValue] of argsToCheck) {
          const strValue = String(argValue);

          if (rule.validate && !VALIDATORS[rule.validate](strValue)) {
            violations.push(`${call.tool}.${argName}: failed ${rule.validate} validation`);
          }

          if (rule.denyPatterns) {
            for (const pattern of rule.denyPatterns) {
              if (pattern.test(strValue)) {
                violations.push(`${call.tool}.${argName}: matched deny pattern ${pattern.source}`);
              }
            }
          }
        }
      }

      const triggered = violations.length > 0;
      return {
        guardName: 'tool-call-validator',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { violations } : undefined,
      };
    },
  };
}
```

- [ ] **Step 4: Export from guards index**

Add to `packages/guards/src/index.ts`:
```typescript
export { toolCallValidator } from './tool-call-validator.js';
```

- [ ] **Step 5: Run tests**

Run: `cd packages/guards && pnpm test`
Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add packages/guards/
git commit -m "feat(guards): add tool-call-validator for agent tool argument validation"
```
