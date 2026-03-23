## Task 5: Core Package — Config Loader

**Files:**
- Create: `packages/core/src/config-schema.ts`
- Create: `packages/core/src/config-loader.ts`
- Create: `packages/core/tests/config-loader.test.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/core/tests/config-loader.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parseConfig, validateConfig } from '../src/config-loader.js';

const validYaml = `
version: "1"
pipelines:
  input:
    mode: fail-fast
    onError: block
    timeoutMs: 3000
    guards:
      - type: keyword
        action: block
        config:
          denied: ["bad"]
  output:
    mode: run-all
    guards:
      - type: word-count
        action: warn
        config:
          max: 500
`;

describe('Config Loader', () => {
  it('parses valid YAML string', () => {
    const config = parseConfig(validYaml);
    expect(config.version).toBe('1');
    expect(config.pipelines.input).toBeDefined();
    expect(config.pipelines.input!.guards).toHaveLength(1);
  });

  it('validates config structure', () => {
    const config = parseConfig(validYaml);
    const result = validateConfig(config);
    expect(result.success).toBe(true);
  });

  it('rejects invalid version', () => {
    const bad = `
version: "99"
pipelines:
  input:
    guards: []
`;
    const config = parseConfig(bad);
    const result = validateConfig(config);
    expect(result.success).toBe(false);
  });

  it('rejects invalid action', () => {
    const bad = `
version: "1"
pipelines:
  input:
    guards:
      - type: keyword
        action: destroy
`;
    const config = parseConfig(bad);
    const result = validateConfig(config);
    expect(result.success).toBe(false);
  });

  it('rejects invalid mode', () => {
    const bad = `
version: "1"
pipelines:
  input:
    mode: turbo
    guards: []
`;
    const config = parseConfig(bad);
    const result = validateConfig(config);
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && pnpm test`
Expected: FAIL — module not found

- [ ] **Step 3: Implement config-schema.ts**

Create `packages/core/src/config-schema.ts`:

```typescript
import { z } from 'zod';

const guardActionSchema = z.enum(['allow', 'block', 'warn', 'override', 'mask']);
const pipelineModeSchema = z.enum(['fail-fast', 'run-all']);
const onErrorSchema = z.enum(['block', 'allow', 'warn']);

const guardConfigSchema = z.object({
  type: z.string().min(1),
  action: guardActionSchema,
  threshold: z.number().min(0).max(1).optional(),
  config: z.record(z.unknown()).optional(),
});

const pipelineConfigSchema = z.object({
  mode: pipelineModeSchema.default('fail-fast'),
  onError: onErrorSchema.default('block'),
  timeoutMs: z.number().positive().default(5000),
  guards: z.array(guardConfigSchema).min(1),
});

export const configSchema = z.object({
  version: z.literal('1'),
  pipelines: z.object({
    input: pipelineConfigSchema.optional(),
    output: pipelineConfigSchema.optional(),
  }).refine(
    (p) => p.input || p.output,
    { message: 'At least one pipeline (input or output) is required' },
  ),
});

export type RawConfig = z.infer<typeof configSchema>;
export type RawGuardConfig = z.infer<typeof guardConfigSchema>;
export type RawPipelineConfig = z.infer<typeof pipelineConfigSchema>;
```

- [ ] **Step 4: Implement config-loader.ts**

Create `packages/core/src/config-loader.ts`:

```typescript
import { parse as parseYaml } from 'yaml';
import { configSchema, type RawConfig } from './config-schema.js';

export function parseConfig(yamlOrJson: string): Record<string, unknown> {
  return parseYaml(yamlOrJson, { prettyErrors: true }) as Record<string, unknown>;
}

export function validateConfig(raw: unknown): { success: true; data: RawConfig } | { success: false; errors: string[] } {
  const result = configSchema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
  };
}

export function loadConfigFromString(yamlOrJson: string): RawConfig {
  const raw = parseConfig(yamlOrJson);
  const result = validateConfig(raw);
  if (!result.success) {
    throw new Error(`Invalid config:\n${result.errors.join('\n')}`);
  }
  return result.data;
}
```

- [ ] **Step 5: Update index.ts exports**

Add to `packages/core/src/index.ts`:

```typescript
export { configSchema, type RawConfig, type RawGuardConfig, type RawPipelineConfig } from './config-schema.js';
export { parseConfig, validateConfig, loadConfigFromString } from './config-loader.js';
```

- [ ] **Step 6: Run tests**

Run: `cd packages/core && pnpm test`
Expected: all tests PASS

- [ ] **Step 7: Commit**

```bash
git add packages/core/ && git commit -m "feat(core): add Config Loader with Zod schema validation"
```
