## Task 10: CLI Package

**Files:**
- Create: `packages/cli/package.json`
- Create: `packages/cli/tsconfig.json`
- Create: `packages/cli/tsup.config.ts`
- Create: `packages/cli/src/index.ts`
- Create: `packages/cli/src/commands/init.ts`
- Create: `packages/cli/src/commands/validate.ts`
- Create: `packages/cli/tests/init.test.ts`
- Create: `packages/cli/tests/validate.test.ts`
- Create: `packages/cli/src/templates/default.yaml`
- Create: `packages/cli/src/templates/strict.yaml`

- [ ] **Step 1: Create cli package.json**

```json
{
  "name": "@open-guardrail/cli",
  "version": "0.1.0",
  "description": "CLI for open-guardrail",
  "type": "module",
  "bin": { "open-guardrail": "./dist/index.js" },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@open-guardrail/core": "workspace:*"
  },
  "devDependencies": {
    "tsup": "^8.4.0",
    "vitest": "^3.1.0"
  },
  "license": "MIT"
}
```

- [ ] **Step 2: Create tsconfig + tsup**

`packages/cli/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "./dist", "rootDir": "./src" },
  "include": ["src/**/*"],
  "exclude": ["tests/**/*", "dist"]
}
```

`packages/cli/tsup.config.ts`:
```typescript
import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false, sourcemap: true, clean: true,
  target: 'node18',
  banner: { js: '#!/usr/bin/env node' },
});
```

- [ ] **Step 3: Create template YAML presets**

`packages/cli/src/templates/default.yaml`:
```yaml
version: "1"
pipelines:
  input:
    mode: fail-fast
    onError: block
    guards:
      - type: prompt-injection
        action: block
      - type: keyword
        action: block
        config:
          denied: []
  output:
    mode: run-all
    guards:
      - type: word-count
        action: warn
        config:
          max: 4000
```

`packages/cli/src/templates/strict.yaml`:
```yaml
version: "1"
pipelines:
  input:
    mode: fail-fast
    onError: block
    timeoutMs: 3000
    guards:
      - type: prompt-injection
        action: block
      - type: pii
        action: mask
        config:
          entities: [email, phone, credit-card, ssn]
      - type: keyword
        action: block
        config:
          denied: []
  output:
    mode: run-all
    onError: block
    guards:
      - type: pii
        action: mask
        config:
          entities: [email, phone, credit-card, ssn]
      - type: word-count
        action: block
        config:
          max: 4000
```

- [ ] **Step 4: Write failing tests for init command**

Create `packages/cli/tests/init.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInit } from '../src/commands/init.js';

describe('init command', () => {
  let dir: string;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'og-test-')); });
  afterEach(() => { rmSync(dir, { recursive: true }); });

  it('creates guardrail.yaml with default preset', async () => {
    await runInit(dir, 'default');
    const file = join(dir, 'guardrail.yaml');
    expect(existsSync(file)).toBe(true);
    const content = readFileSync(file, 'utf-8');
    expect(content).toContain('version: "1"');
  });

  it('creates guardrail.yaml with strict preset', async () => {
    await runInit(dir, 'strict');
    const content = readFileSync(join(dir, 'guardrail.yaml'), 'utf-8');
    expect(content).toContain('pii');
  });

  it('does not overwrite existing file', async () => {
    await runInit(dir, 'default');
    await expect(runInit(dir, 'default')).rejects.toThrow(/already exists/i);
  });
});
```

- [ ] **Step 5: Write failing tests for validate command**

Create `packages/cli/tests/validate.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runValidate } from '../src/commands/validate.js';

describe('validate command', () => {
  let dir: string;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'og-test-')); });
  afterEach(() => { rmSync(dir, { recursive: true }); });

  it('validates a correct config', async () => {
    const yaml = 'version: "1"\npipelines:\n  input:\n    guards:\n      - type: keyword\n        action: block\n';
    writeFileSync(join(dir, 'guardrail.yaml'), yaml);
    const result = await runValidate(join(dir, 'guardrail.yaml'));
    expect(result.valid).toBe(true);
  });

  it('returns errors for invalid config', async () => {
    writeFileSync(join(dir, 'bad.yaml'), 'version: "99"\npipelines:\n  input:\n    guards: []\n');
    const result = await runValidate(join(dir, 'bad.yaml'));
    expect(result.valid).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it('throws if file not found', async () => {
    await expect(runValidate(join(dir, 'nope.yaml'))).rejects.toThrow();
  });
});
```

- [ ] **Step 6: Implement init.ts**

Create `packages/cli/src/commands/init.ts`:

```typescript
import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const TEMPLATES: Record<string, string> = {
  default: `version: "1"
pipelines:
  input:
    mode: fail-fast
    onError: block
    guards:
      - type: prompt-injection
        action: block
      - type: keyword
        action: block
        config:
          denied: []
  output:
    mode: run-all
    guards:
      - type: word-count
        action: warn
        config:
          max: 4000
`,
  strict: `version: "1"
pipelines:
  input:
    mode: fail-fast
    onError: block
    timeoutMs: 3000
    guards:
      - type: prompt-injection
        action: block
      - type: pii
        action: mask
        config:
          entities: [email, phone, credit-card, ssn]
      - type: keyword
        action: block
        config:
          denied: []
  output:
    mode: run-all
    onError: block
    guards:
      - type: pii
        action: mask
        config:
          entities: [email, phone, credit-card, ssn]
      - type: word-count
        action: block
        config:
          max: 4000
`,
};

export async function runInit(targetDir: string, preset: string = 'default'): Promise<void> {
  const dest = join(targetDir, 'guardrail.yaml');
  if (existsSync(dest)) {
    throw new Error(`guardrail.yaml already exists in ${targetDir}`);
  }

  const content = TEMPLATES[preset];
  if (!content) {
    throw new Error(`Unknown preset: ${preset}. Available: ${Object.keys(TEMPLATES).join(', ')}`);
  }

  writeFileSync(dest, content, 'utf-8');
}
```

- [ ] **Step 7: Implement validate.ts**

Create `packages/cli/src/commands/validate.ts`:

```typescript
import { readFileSync, existsSync } from 'node:fs';
import { loadConfigFromString, validateConfig, parseConfig } from '@open-guardrail/core';

interface ValidateResult {
  valid: boolean;
  errors?: string[];
}

export async function runValidate(filePath: string): Promise<ValidateResult> {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = readFileSync(filePath, 'utf-8');
  const raw = parseConfig(content);
  const result = validateConfig(raw);

  if (result.success) {
    return { valid: true };
  }
  return { valid: false, errors: result.errors };
}
```

- [ ] **Step 8: Implement CLI entry point**

Create `packages/cli/src/index.ts`:

```typescript
import { runInit } from './commands/init.js';
import { runValidate } from './commands/validate.js';

const [,, command, ...args] = process.argv;

async function main(): Promise<void> {
  switch (command) {
    case 'init': {
      const preset = args[0] ?? 'default';
      await runInit(process.cwd(), preset);
      console.log(`Created guardrail.yaml (${preset} preset)`);
      break;
    }
    case 'validate': {
      const file = args[0] ?? 'guardrail.yaml';
      const result = await runValidate(file);
      if (result.valid) {
        console.log('Config is valid.');
      } else {
        console.error('Config errors:');
        result.errors?.forEach((e) => console.error(`  - ${e}`));
        process.exit(1);
      }
      break;
    }
    default:
      console.log('Usage: open-guardrail <init|validate> [args]');
      console.log('  init [preset]    Create guardrail.yaml (default|strict)');
      console.log('  validate [file]  Validate a config file');
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
```

- [ ] **Step 9: Run CLI tests**

Run: `cd packages/cli && pnpm test`
Expected: all PASS

- [ ] **Step 10: Commit**

```bash
git add packages/cli/ && git commit -m "feat(cli): add init and validate commands with default/strict presets"
```
